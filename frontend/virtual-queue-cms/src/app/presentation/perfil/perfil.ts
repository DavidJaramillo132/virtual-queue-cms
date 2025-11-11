import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/Rest/userServices';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { IUsuario } from '../../domain/entities';

import { UserGraphQl } from '../../services/GraphQL/user-graph-ql'
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html'
})
export class PerfilComponent implements OnInit {
  faUser = faUser;
  IUsuario: IUsuario | null = null;
  isEditMode: boolean = false;
  editedProfile: Partial<IUsuario> = {};
  profileCompleteness: number = 0;
  isSaving: boolean = false;
  saveMessage: string = '';
  perfilGraphQL: any[] = [];
  
  // Datos del resumen de citas desde GraphQL
  resumenCitas = {
    totalCitas: 0,
    citasCompletadas: 0,
    citasPendientes: 0,
    citasCanceladas: 0
  };

  constructor(
    private userService: UserService,
    //private perfilService: PerfilService,
    private router: Router,
    private userGraphQl: UserGraphQl
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    // Solo cargar datos de GraphQL si el usuario es cliente
    if (this.isCliente()) {
      this.loadUserProfileGraphQL();
    }
  }

  /**
   * Verifica si el usuario actual es un cliente
   */
  isCliente(): boolean {
    const user = this.getUser();
    return user?.rol === 'cliente';
  }

  loadUserProfileGraphQL() {
    // Solo cargar si el usuario es cliente
    if (!this.isCliente()) {
      return;
    }

    this.userGraphQl.perfil_completo_usuario()
      .subscribe({
        next: (res) => {
          this.perfilGraphQL = res?.data?.perfilCompletoUsuario ? [res.data.perfilCompletoUsuario] : [];
          console.log("respuesta del graphQL", res);
          // Extraer los datos del resumen de citas
          if (res?.data?.perfilCompletoUsuario) {
            this.resumenCitas = {
              totalCitas: res.data.perfilCompletoUsuario.totalCitas || 0,
              citasCompletadas: res.data.perfilCompletoUsuario.citasCompletadas || 0,
              citasPendientes: res.data.perfilCompletoUsuario.citasPendientes || 0,
              citasCanceladas: res.data.perfilCompletoUsuario.citasCanceladas || 0
            };
          }
        },
        error: (err) => {
          console.error("Error al cargar perfil desde GraphQL:", err);
          this.perfilGraphQL = [];
          // Mantener valores en 0 en caso de error
        }
      });
    
    console.log("informacion del graphQL", this.perfilGraphQL);
  }


  loadUserProfile(): void {
    const currentUser = this.userService.currentUserValue;

    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

  }
  goBack(): void {
    this.router.navigate(['/home']);
  }

  getUser(): IUsuario | null {
    const user = this.userService.currentUserValue;
    if (!user) {
      return null;
    }
    
    // Mapear nombreCompleto a nombre_completo si es necesario
    const mappedUser: any = { ...user };
    if (user.nombreCompleto && !user.nombre_completo) {
      mappedUser.nombre_completo = user.nombreCompleto;
    }
    
    // Mapear creado_en a creadoEn si es necesario
    if (user.creado_en && !user.creadoEn) {
      mappedUser.creadoEn = user.creado_en;
    }
    
    // Convertir creadoEn a Date si es un string
    if (mappedUser.creadoEn && typeof mappedUser.creadoEn === 'string') {
      mappedUser.creadoEn = new Date(mappedUser.creadoEn);
    }
    
    return mappedUser as IUsuario;
  }

  /**
   * Obtiene el nombre completo del usuario, manejando ambos formatos
   */
  getUserNombreCompleto(): string {
    const user = this.getUser();
    if (!user) {
      return 'No disponible';
    }
    
    // Intentar obtener nombre_completo primero, luego nombreCompleto
    const nombre = user.nombre_completo || (user as any).nombreCompleto;
    return nombre || 'No disponible';
  }

  /**
   * Obtiene la fecha de creación del usuario formateada
   */
  getFechaCreacion(): string {
    const user = this.userService.currentUserValue;
    if (!user) {
      return 'No disponible';
    }
    
    // Intentar obtener creadoEn de diferentes fuentes (el usuario puede tenerlo en diferentes formatos)
    const fechaValue = user.creadoEn || (user as any).creado_en || (user as any).created_at;
    
    if (!fechaValue) {
      return 'No disponible';
    }
    
    // Convertir a Date (puede venir como string desde JSON)
    let fecha: Date;
    try {
      if (fechaValue instanceof Date) {
        fecha = fechaValue;
      } else {
        fecha = new Date(fechaValue);
      }
      
      // Verificar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'No disponible';
      }
      
      // Formatear fecha en español
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, fechaValue);
      return 'No disponible';
    }
  }
  // Modificar el perfil
  habilitarModoEdicion(): void {
    this.isEditMode = true;
    const currentUser = this.getUser();
    if (currentUser) {
      this.editedProfile = { 
        ...currentUser,
        nombre_completo: currentUser.nombre_completo || (currentUser as any).nombreCompleto || ''
      };
    }
  }

  cancelarModoEdicion(): void {
    this.isEditMode = false;
    this.editedProfile = {};
    this.saveMessage = '';
  }

  guardarCambios(): void {
    const currentUser = this.getUser();

    if (!currentUser || !currentUser.id) {
      this.saveMessage = 'Error: No se pudo identificar el usuario.';
      return;
    }

    // Crear el objeto completo con el id del usuario actual
    // Asegurar que nombre_completo esté presente
    const usuarioActualizado: any = {
      ...currentUser,
      ...this.editedProfile,
      id: currentUser.id,
      nombre_completo: this.editedProfile.nombre_completo || currentUser.nombre_completo || (currentUser as any).nombreCompleto || ''
    };

    this.isSaving = true;
    this.saveMessage = '';

    this.userService.actualizarUsuario(usuarioActualizado).subscribe({
      next: (updatedUser: IUsuario) => {
        this.IUsuario = updatedUser;
        this.isEditMode = false;
        this.isSaving = false;
        this.saveMessage = 'Perfil actualizado con éxito.';

        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error al actualizar el perfil:', err);
        this.isSaving = false;
        this.saveMessage = 'Error al actualizar el perfil. Por favor, inténtalo de nuevo.';
      }
    });
  }

  ResumenPDF(): void {
    // Solo permitir generar PDF si el usuario es cliente
    if (!this.isCliente()) {
      this.saveMessage = 'Esta funcionalidad solo está disponible para clientes.';
      setTimeout(() => {
        this.saveMessage = '';
      }, 3000);
      return;
    }

    // Mostrar mensaje de carga
    this.saveMessage = 'Generando informe PDF...';
    this.isSaving = true;

    // Usar GraphQL directamente para generar el PDF
    this.userGraphQl.generar_informe_pdf().subscribe({
      next: (response) => {
        if (response.success) {
          // Convertir base64 a Blob
          const byteCharacters = atob(response.pdfBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          // Crear enlace de descarga
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = response.nombreArchivo;

          // Simular click para descargar
          document.body.appendChild(link);
          link.click();

          // Limpiar
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.isSaving = false;
          this.saveMessage = '¡Informe PDF generado exitosamente!';

          // Limpiar mensaje después de 3 segundos
          setTimeout(() => {
            this.saveMessage = '';
          }, 3000);
        } else {
          // Error desde el servidor
          this.isSaving = false;
          this.saveMessage = response.mensaje || 'Error al generar el informe PDF.';

          setTimeout(() => {
            this.saveMessage = '';
          }, 5000);
        }
      },
      error: (err) => {
        console.error('Error al generar el PDF:', err);
        this.isSaving = false;
        this.saveMessage = 'Error al generar el informe PDF. Por favor, inténtalo de nuevo.';

        setTimeout(() => {
          this.saveMessage = '';
        }, 5000);
      }
    });
  }
}
