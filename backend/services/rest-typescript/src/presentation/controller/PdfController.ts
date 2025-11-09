import { Request, Response } from "express";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import axios from "axios";

export class PdfController {
    /**
     * Genera un informe PDF con los datos del perfil del usuario
     * GET /api/usuarios/informe-pdf
     */
    async generarInformePerfil(req: Request, res: Response): Promise<void> {
        try {
            // Obtener el token del header Authorization
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).json({ message: 'Token no proporcionado' });
                return;
            }

            const token = authHeader.replace('Bearer ', '');

            // Llamar al servicio GraphQL para obtener los datos del perfil completo
            const graphqlUrl = process.env.GRAPHQL_URL || 'http://localhost:8000/graphql';
            
            const query = `
                query {
                    perfilCompletoUsuario {
                        id
                        nombreCompleto
                        email
                        telefono
                        totalCitas
                        citasCompletadas
                        citasPendientes
                        citasCanceladas
                    }
                }
            `;

            // Hacer la petición a GraphQL
            const graphqlResponse = await axios.post<any>(
                graphqlUrl,
                { query },
                {
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (graphqlResponse.data.errors) {
                console.error('Errores de GraphQL:', graphqlResponse.data.errors);
                res.status(400).json({ 
                    message: 'Error al obtener datos del usuario',
                    errors: graphqlResponse.data.errors 
                });
                return;
            }

            const perfilData = graphqlResponse.data.data.perfilCompletoUsuario;

            if (!perfilData) {
                res.status(404).json({ message: 'No se encontró información del usuario' });
                return;
            }

            // Preparar los datos para el generador de PDF
            const pdfData = {
                usuario: {
                    nombre: perfilData.nombreCompleto,
                    email: perfilData.email,
                    telefono: perfilData.telefono || 'No especificado',

                },
                resumenCitas: {
                    totalCitas: perfilData.totalCitas,
                    citasCompletadas: perfilData.citasCompletadas,
                    citasPendientes: perfilData.citasPendientes,
                    citasCanceladas: perfilData.citasCanceladas
                }
            };

            // Crear nombre de archivo temporal
            const timestamp = Date.now();
            const tempDir = path.join(__dirname, '../../../temp');
            const outputPath = path.join(tempDir, `informe_${perfilData.id}_${timestamp}.pdf`);

            // Crear directorio temporal si no existe
            await fs.mkdir(tempDir, { recursive: true });

            // Agregar la ruta de salida a los datos
            const inputData = {
                ...pdfData,
                outputPath
            };

            // Ruta al script de Python
            const pythonScriptPath = path.join(
                __dirname,
                '../../../../pdf-generator/pdf_generator.py'
            );

            console.log('Ruta del script Python:', pythonScriptPath);
            console.log('Datos a enviar al PDF:', JSON.stringify(inputData, null, 2));

            // Ejecutar el script de Python
            const pythonProcess = spawn('python', [pythonScriptPath]);

            let stdout = '';
            let stderr = '';

            // Enviar datos JSON al proceso de Python
            pythonProcess.stdin.write(JSON.stringify(inputData));
            pythonProcess.stdin.end();

            // Capturar salida estándar
            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            // Capturar errores
            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Esperar a que el proceso termine
            pythonProcess.on('close', async (code) => {
                if (code !== 0) {
                    console.error('Error en el generador de PDF:', stderr);
                    res.status(500).json({ 
                        message: 'Error al generar el PDF',
                        error: stderr 
                    });
                    return;
                }

                try {
                    // Leer el resultado
                    const result = JSON.parse(stdout);

                    if (!result.success) {
                        res.status(500).json({ 
                            message: 'Error al generar el PDF',
                            error: result.error 
                        });
                        return;
                    }

                    // Leer el archivo PDF generado
                    const pdfBuffer = await fs.readFile(outputPath);

                    // Configurar headers para la descarga
                    const fileName = `Informe_${perfilData.nombreCompleto.replace(/\s+/g, '_')}_${timestamp}.pdf`;
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                    res.setHeader('Content-Length', pdfBuffer.length);

                    // Enviar el PDF
                    res.send(pdfBuffer);

                    // Eliminar el archivo temporal después de enviarlo
                    setTimeout(async () => {
                        try {
                            await fs.unlink(outputPath);
                        } catch (error) {
                            console.error('Error al eliminar archivo temporal:', error);
                        }
                    }, 5000);

                } catch (error) {
                    console.error('Error al procesar el PDF:', error);
                    res.status(500).json({ 
                        message: 'Error al procesar el PDF generado',
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                }
            });

        } catch (error) {
            console.error('Error al generar informe PDF:', error);
            res.status(500).json({ 
                message: 'Error interno del servidor',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
