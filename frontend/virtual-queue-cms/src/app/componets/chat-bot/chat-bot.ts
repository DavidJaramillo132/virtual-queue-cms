import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCommentDots, faTimes, faTrash, faPaperPlane, faUser, faRobot } from '@fortawesome/free-solid-svg-icons';
import { ChatBotService, ChatMessage, ChatOption } from '../../services/chat-bot.service';

@Component({
  selector: 'app-chat-bot',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './chat-bot.html',
  styleUrls: ['./chat-bot.css']
})
export class ChatBotComponent {
  // Icons
  faCommentDots = faCommentDots;
  faTimes = faTimes;
  faTrash = faTrash;
  faPaperPlane = faPaperPlane;
  faUser = faUser;
  faRobot = faRobot;

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentMessage = signal('');
  isLoading = signal(false);
  
  // Contexto para rastrear IDs seleccionados
  private conversationContext = signal<{
    negocio_id?: string;
    servicio_id?: string;
    estacion_id?: string;
    negocio_nombre?: string;
    servicio_nombre?: string;
    estacion_nombre?: string;
    fecha?: string;
    hora_inicio?: string;
    hora_fin?: string;
  }>({});
  
  constructor(private chatService: ChatBotService) {
    // Mensaje de bienvenida inicial
    this.messages.set([
      {
        role: 'assistant',
        content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }
    ]);
  }

  toggleChat() {
    this.isOpen.update(value => !value);
  }

  closeChat() {
    this.isOpen.set(false);
  }

  sendMessage() {
    const messageText = this.currentMessage().trim();
    if (!messageText || this.isLoading()) return;

    // Detectar si el usuario quiere reiniciar el contexto
    if (this.esComandoReiniciar(messageText)) {
      this.reiniciarChat();
      return;
    }

    // Analizar el mensaje para detectar menciones de servicios
    this.detectarMencionesEnMensaje(messageText);

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    this.currentMessage.set('');
    this.isLoading.set(true);

    // Enviar al servicio con contexto
    this.chatService.sendMessage(messageText, this.conversationContext()).subscribe({
      next: (response) => {
        // Limpiar formato Markdown de la respuesta
        const respuestaLimpia = this.limpiarMarkdown(response.respuesta);
        
        // Actualizar contexto con IDs de las herramientas ejecutadas
        this.actualizarContexto(response);
        
        // Generar opciones si hay herramientas ejecutadas con resultados
        const opciones = this.generarOpciones(response, respuestaLimpia);
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: respuestaLimpia,
          timestamp: new Date(),
          options: opciones
        };
        
        // Guardar herramientas ejecutadas en el mensaje para acceso posterior
        (assistantMessage as any).herramientas = response.herramientas_ejecutadas;
        
        this.messages.update(msgs => [...msgs, assistantMessage]);
        this.isLoading.set(false);
        
        // Auto-scroll al final
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error al enviar mensaje:', error);
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.',
          timestamp: new Date()
        };
        
        this.messages.update(msgs => [...msgs, errorMessage]);
        this.isLoading.set(false);
      }
    });

    // Auto-scroll al final
    setTimeout(() => this.scrollToBottom(), 100);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onOptionClick(option: ChatOption) {
    // Extraer información del label del botón y actualizar contexto antes de enviar
    const ctx = this.conversationContext();
    
    if (option.label.startsWith('📍')) {
      // Es un negocio - buscar el ID en la última respuesta
      const negocioNombre = option.label.replace('📍 ', '').trim();
      const lastMessages = this.messages();
      
      // Buscar en las herramientas ejecutadas de mensajes previos
      for (let i = lastMessages.length - 1; i >= 0; i--) {
        const msg = lastMessages[i];
        if (msg.role === 'assistant' && (msg as any).herramientas) {
          const herramientas = (msg as any).herramientas;
          for (const h of herramientas) {
            if (h.herramienta === 'buscar_negocios' && h.resultado?.negocios) {
              const negocios = Array.isArray(h.resultado.negocios) ? h.resultado.negocios : [h.resultado.negocios];
              const negocio = negocios.find((n: any) => n.nombre === negocioNombre);
              if (negocio) {
                this.conversationContext.set({
                  ...ctx,
                  negocio_id: negocio.id,
                  negocio_nombre: negocioNombre
                });
                break;
              }
            }
          }
        }
      }
    } else if (option.label.startsWith('✂️')) {
      // Es un servicio - buscar el ID en la última respuesta
      const servicioNombre = option.label.split(' - ')[0].replace('✂️ ', '').trim();
      const lastMessages = this.messages();
      
      // Buscar en las herramientas ejecutadas de mensajes previos
      for (let i = lastMessages.length - 1; i >= 0; i--) {
        const msg = lastMessages[i];
        if (msg.role === 'assistant' && (msg as any).herramientas) {
          const herramientas = (msg as any).herramientas;
          for (const h of herramientas) {
            if ((h.herramienta === 'obtener_servicios' || h.herramienta === 'obtener_servicios_negocio') && h.resultado?.servicios) {
              const servicios = Array.isArray(h.resultado.servicios) ? h.resultado.servicios : [h.resultado.servicios];
              const servicio = servicios.find((s: any) => s.nombre === servicioNombre);
              if (servicio) {
                this.conversationContext.update(c => ({
                  ...c,
                  servicio_id: servicio.id,
                  servicio_nombre: servicioNombre
                }));
                break;
              }
            }
          }
        }
      }
    } else if (option.label.startsWith('🪑')) {
      // Es una estación
      const estacionNombre = option.label.replace('🪑 ', '').trim();
      this.conversationContext.update(c => ({
        ...c,
        estacion_nombre: estacionNombre
      }));
    } else if (option.label.startsWith('🕐')) {
      // Es un horario - guardar fecha, hora_inicio y hora_fin en el contexto
      if ((option as any).data) {
        const horarioData = (option as any).data;
        this.conversationContext.update(c => ({
          ...c,
          fecha: horarioData.fecha,
          hora_inicio: horarioData.hora_inicio,
          hora_fin: horarioData.hora_fin
        }));
      }
    }
    
    // Enviar la opción seleccionada como un mensaje del usuario
    this.currentMessage.set(option.value);
    this.sendMessage();
  }

  private actualizarContexto(response: any) {
    if (!response.herramientas_ejecutadas) return;
    
    const ctx = this.conversationContext();
    
    for (const herramienta of response.herramientas_ejecutadas) {
      // Guardar IDs de negocios
      if (herramienta.herramienta === 'buscar_negocios' && herramienta.resultado?.negocios) {
        // Solo guardar si hay un único negocio o si ya tenemos un nombre seleccionado
        const negocios = Array.isArray(herramienta.resultado.negocios) 
          ? herramienta.resultado.negocios 
          : [herramienta.resultado.negocios];
        
        if (ctx.negocio_nombre) {
          const negocio = negocios.find((n: any) => n.nombre === ctx.negocio_nombre);
          if (negocio) {
            this.conversationContext.update(c => ({
              ...c,
              negocio_id: negocio.id
            }));
          }
        }
      }
      
      // Guardar IDs de servicios
      if ((herramienta.herramienta === 'obtener_servicios' || herramienta.herramienta === 'obtener_servicios_negocio') && herramienta.resultado?.servicios) {
        const servicios = Array.isArray(herramienta.resultado.servicios)
          ? herramienta.resultado.servicios
          : [herramienta.resultado.servicios];
        
        if (ctx.servicio_nombre) {
          const servicio = servicios.find((s: any) => s.nombre === ctx.servicio_nombre);
          if (servicio) {
            this.conversationContext.update(c => ({
              ...c,
              servicio_id: servicio.id
            }));
          }
        }
      }
      
      // Guardar IDs de estaciones
      if (herramienta.herramienta === 'obtener_estaciones' && herramienta.resultado?.estaciones) {
        const estaciones = Array.isArray(herramienta.resultado.estaciones)
          ? herramienta.resultado.estaciones
          : [herramienta.resultado.estaciones];
        
        if (ctx.estacion_nombre) {
          const estacion = estaciones.find((e: any) => 
            e.nombre === ctx.estacion_nombre || 
            ('Estación ' + e.id.substring(0, 8)) === ctx.estacion_nombre
          );
          if (estacion) {
            this.conversationContext.update(c => ({
              ...c,
              estacion_id: estacion.id
            }));
          }
        }
      }
    }
  }

  private detectarMencionesEnMensaje(mensaje: string) {
    const mensajeLower = mensaje.toLowerCase();
    const lastMessages = this.messages();
    
    // Primero buscar menciones de horarios (máxima prioridad)
    if (mensajeLower.includes('reservar') || mensajeLower.includes('quiero el')) {
      for (let i = lastMessages.length - 1; i >= 0; i--) {
        const msg = lastMessages[i];
        if (msg.role === 'assistant' && (msg as any).herramientas) {
          const herramientas = (msg as any).herramientas;
          
          for (const h of herramientas) {
            if (h.herramienta === 'ver_horarios_disponibles' && h.resultado?.horarios && h.resultado?.fecha) {
              const horarios = Array.isArray(h.resultado.horarios) ? h.resultado.horarios : [h.resultado.horarios];
              const fecha = h.resultado.fecha;
              
              // Buscar patrón de hora en el mensaje (formato HH:MM:SS o HH:MM)
              const horaMatch = mensaje.match(/\d{1,2}:\d{2}(?::\d{2})?/);
              if (horaMatch) {
                const horaTexto = horaMatch[0];
                const horario = horarios.find((h: any) => h.hora_inicio.startsWith(horaTexto.substring(0, 5)));
                
                if (horario) {
                  console.log(`🔍 Detectado horario mencionado: ${fecha} ${horario.hora_inicio} - ${horario.hora_fin}`);
                  this.conversationContext.update(c => ({
                    ...c,
                    fecha: fecha,
                    hora_inicio: horario.hora_inicio,
                    hora_fin: horario.hora_fin
                  }));
                  return;
                }
              }
            }
          }
        }
      }
    }
    
    // Buscar menciones de estaciones (segunda prioridad)
    for (let i = lastMessages.length - 1; i >= 0; i--) {
      const msg = lastMessages[i];
      if (msg.role === 'assistant' && (msg as any).herramientas) {
        const herramientas = (msg as any).herramientas;
        
        for (const h of herramientas) {
          if (h.herramienta === 'obtener_estaciones' && h.resultado?.estaciones) {
            const estaciones = Array.isArray(h.resultado.estaciones) ? h.resultado.estaciones : [h.resultado.estaciones];
            
            for (const estacion of estaciones) {
              const nombreEstacionLower = estacion.nombre.toLowerCase();
              if (mensajeLower.includes(nombreEstacionLower)) {
                console.log(`🔍 Detectada estación mencionada: ${estacion.nombre} (${estacion.id})`);
                this.conversationContext.update(c => ({
                  ...c,
                  estacion_id: estacion.id,
                  estacion_nombre: estacion.nombre
                }));
                return;
              }
            }
          }
        }
      }
    }
    
    // Buscar menciones de servicios
    for (let i = lastMessages.length - 1; i >= 0; i--) {
      const msg = lastMessages[i];
      if (msg.role === 'assistant' && (msg as any).herramientas) {
        const herramientas = (msg as any).herramientas;
        
        // Buscar en obtener_servicios
        for (const h of herramientas) {
          if ((h.herramienta === 'obtener_servicios' || h.herramienta === 'obtener_servicios_negocio') && h.resultado?.servicios) {
            const servicios = Array.isArray(h.resultado.servicios) ? h.resultado.servicios : [h.resultado.servicios];
            
            // Buscar si el usuario menciona algún servicio
            for (const servicio of servicios) {
              const nombreServicioLower = servicio.nombre.toLowerCase();
              if (mensajeLower.includes(nombreServicioLower)) {
                console.log(`🔍 Detectado servicio mencionado: ${servicio.nombre} (${servicio.id})`);
                this.conversationContext.update(c => ({
                  ...c,
                  servicio_id: servicio.id,
                  servicio_nombre: servicio.nombre
                }));
                return; // Salir después de encontrar el primer match
              }
            }
          }
        }
      }
    }
  }

  private scrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private limpiarMarkdown(texto: string): string {
    if (!texto) return texto;
    
    return texto
      // Remover ** (negrita)
      .replace(/\*\*(.+?)\*\*/g, '$1')
      // Remover * (cursiva)
      .replace(/\*(.+?)\*/g, '$1')
      // Remover __ (negrita alternativa)
      .replace(/__(.+?)__/g, '$1')
      // Remover _ (cursiva alternativa)
      .replace(/_(.+?)_/g, '$1')
      // Remover # (headers)
      .replace(/^#+\s+/gm, '')
      // Remover ``` (bloques de código)
      .replace(/```[\s\S]*?```/g, '')
      // Remover ` (código inline)
      .replace(/`(.+?)`/g, '$1');
  }

  private generarOpciones(response: any, respuestaTexto: string): ChatOption[] | undefined {
    const opciones: ChatOption[] = [];
    
    // Si hay negocios en los resultados, crear opciones SOLO para los mencionados en la respuesta
    if (response.herramientas_ejecutadas && response.herramientas_ejecutadas.length > 0) {
      for (const herramienta of response.herramientas_ejecutadas) {
        if (herramienta.herramienta === 'buscar_negocios' && herramienta.resultado?.negocios) {
          const negocios = Array.isArray(herramienta.resultado.negocios) 
            ? herramienta.resultado.negocios 
            : [herramienta.resultado.negocios];
          
          // Filtrar solo negocios que aparecen en el texto de respuesta
          negocios.forEach((negocio: any) => {
            if (respuestaTexto.toLowerCase().includes(negocio.nombre.toLowerCase())) {
              opciones.push({
                label: `📍 ${negocio.nombre}`,
                value: `Quiero hacer una cita en ${negocio.nombre}`
              });
            }
          });
        }
        
        // Si hay servicios, crear opciones solo para los mencionados
        if ((herramienta.herramienta === 'obtener_servicios' || herramienta.herramienta === 'obtener_servicios_negocio') && herramienta.resultado?.servicios) {
          const servicios = Array.isArray(herramienta.resultado.servicios)
            ? herramienta.resultado.servicios
            : [herramienta.resultado.servicios];
          
          servicios.forEach((servicio: any) => {
            if (respuestaTexto.toLowerCase().includes(servicio.nombre.toLowerCase())) {
              const precio = servicio.precio_centavos ? (servicio.precio_centavos / 100).toFixed(2) : '0.00';
              opciones.push({
                label: `✂️ ${servicio.nombre} - $${precio}`,
                value: `Quiero el servicio de ${servicio.nombre}`
              });
            }
          });
        }

        // Si hay estaciones, crear opciones
        if (herramienta.herramienta === 'obtener_estaciones' && herramienta.resultado?.estaciones) {
          const estaciones = Array.isArray(herramienta.resultado.estaciones)
            ? herramienta.resultado.estaciones
            : [herramienta.resultado.estaciones];
          
          estaciones.forEach((estacion: any) => {
            opciones.push({
              label: `🪑 ${estacion.nombre || 'Estación ' + estacion.id.substring(0, 8)}`,
              value: `Quiero la estación ${estacion.nombre || estacion.id.substring(0, 8)}`
            });
          });
        }

        // Si hay horarios disponibles, crear opciones (máximo 10)
        if (herramienta.herramienta === 'ver_horarios_disponibles' && herramienta.resultado?.horarios) {
          const horarios = Array.isArray(herramienta.resultado.horarios)
            ? herramienta.resultado.horarios
            : [herramienta.resultado.horarios];
          const fecha = herramienta.resultado.fecha;
          
          horarios.slice(0, 10).forEach((horario: any) => {
            // Los horarios ya vienen como slots individuales (ej: 09:00-09:20, 09:20-09:40)
            const horaInicio = horario.hora_inicio.substring(0, 5); // Quitar segundos
            const horaFin = horario.hora_fin.substring(0, 5);
            opciones.push({
              label: `🕐 ${horaInicio} - ${horaFin}`,
              value: `Quiero reservar el ${fecha} de ${horario.hora_inicio} a ${horario.hora_fin}`,
              data: { ...horario, fecha }
            });
          });
        }
      }
    }
    
    return opciones.length > 0 ? opciones : undefined;
  }

  clearChat() {
    this.messages.set([
      {
        role: 'assistant',
        content: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }
    ]);
    // Limpiar el contexto
    this.conversationContext.set({});
  }

  /**
   * Reinicia el chat (limpia mensajes y contexto en backend y frontend)
   */
  reiniciarChat() {
    this.isLoading.set(true);
    
    // Agregar mensaje del usuario si hay texto
    const mensajeActual = this.currentMessage().trim();
    if (mensajeActual) {
      const userMessage: ChatMessage = {
        role: 'user',
        content: mensajeActual,
        timestamp: new Date()
      };
      this.messages.update(msgs => [...msgs, userMessage]);
      this.currentMessage.set('');
    }
    
    this.chatService.reiniciarChat().subscribe({
      next: () => {
        // Limpiar contexto local
        this.conversationContext.set({});
        
        // Limpiar mensajes y mostrar mensaje de bienvenida
        this.messages.set([
          {
            role: 'assistant',
            content: '✅ Conversación reiniciada. ¿En qué negocio te gustaría agendar tu cita?',
            timestamp: new Date()
          }
        ]);
        
        this.isLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error al reiniciar chat:', error);
        
        // Limpiar contexto local de todos modos
        this.conversationContext.set({});
        
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: '✅ Conversación reiniciada. ¿En qué negocio te gustaría agendar tu cita?',
          timestamp: new Date()
        }]);
        
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Detecta si el mensaje del usuario es un comando para reiniciar
   */
  private esComandoReiniciar(mensaje: string): boolean {
    const mensajeLower = mensaje.toLowerCase();
    const palabrasClave = [
      'reiniciar',
      'reinicia',
      'resetear',
      'reset',
      'olvida',
      'nueva cita',
      'nueva conversacion',
      'empezar de nuevo',
      'comenzar de nuevo',
      'borrar contexto',
      'limpiar',
      'cancelar proceso'
    ];
    
    return palabrasClave.some(palabra => mensajeLower.includes(palabra));
  }
}
