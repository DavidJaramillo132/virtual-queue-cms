import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NegocioServices } from '../../../services/Rest/negocio-services';
import { UserService } from '../../../services/Rest/userServices';
import { INegocio } from '../../../domain/entities';

@Component({
  selector: 'app-negocio-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './negocio-info.html',
  styleUrls: ['./negocio-info.css']
})
export class NegocioInfoComponent implements OnInit {
  // Estado de edición y mensajes
  isEditing = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Data del negocio
  negocio = signal<INegocio | null>(null);
  negocioTemp: Partial<INegocio> = {};
  
  // Imagen
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  
  private negocioId: string = '';

  constructor(
    private negocioService: NegocioServices,
    private userService: UserService
  ) {
    // Obtener el negocio_id del usuario autenticado
    const currentUser = this.userService.currentUserValue;
    if (currentUser && currentUser.negocio_id) {
      this.negocioId = currentUser.negocio_id;
    }
  }

  ngOnInit() {
    if (this.negocioId) {
      this.cargarNegocio();
    } else {
      this.errorMessage.set('No se encontró información del negocio. Por favor, inicie sesión nuevamente.');
    }
  }

  cargarNegocio() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.negocioService.getNegocioById(this.negocioId).subscribe({
      next: (data: INegocio) => {
        this.negocio.set(data);
        this.isLoading.set(false);
        // Inicializar preview de imagen si existe
        if (data.imagen_url) {
          this.imagePreview = data.imagen_url;
        }
      },
      error: (error: any) => {
        this.errorMessage.set(error.message || 'Error al cargar la información del negocio');
        this.isLoading.set(false);
        console.error('Error al cargar negocio:', error);
      }
    });
  }

  toggleEdit() {
    if (this.isEditing()) {
      // Cancelar edición
      this.negocioTemp = {};
      this.selectedImageFile = null;
      this.imagePreview = null;
      this.errorMessage.set('');
      this.successMessage.set('');
    } else {
      // Iniciar edición - copiar datos actuales
      const currentNegocio = this.negocio();
      if (currentNegocio) {
        this.negocioTemp = { ...currentNegocio };
        this.imagePreview = currentNegocio.imagen_url || null;
      }
    }
    this.isEditing.set(!this.isEditing());
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage.set('Por favor selecciona una imagen válida (JPG, PNG o WEBP)');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set('La imagen es demasiado grande. Máximo 5MB.');
        return;
      }

      this.selectedImageFile = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      
      this.errorMessage.set('');
    }
  }

  triggerImageInput(): void {
    this.imageInput.nativeElement.click();
  }

  removeImage(): void {
    this.selectedImageFile = null;
    const currentNegocio = this.negocio();
    this.imagePreview = currentNegocio?.imagen_url || null;
    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }
  }

  guardarCambios() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validar que tengamos negocio_id
    if (!this.negocioId) {
      this.errorMessage.set('Error: No se encontró el ID del negocio');
      this.isLoading.set(false);
      return;
    }

    // Si hay una imagen nueva, subirla primero
    if (this.selectedImageFile) {
      this.subirImagenYActualizar();
    } else {
      // Solo actualizar datos sin imagen
      this.actualizarDatosNegocio();
    }
  }

  private subirImagenYActualizar(): void {
    const formData = new FormData();
    formData.append('imagen', this.selectedImageFile!);

    this.negocioService.uploadImagen(this.negocioId, formData).subscribe({
      next: (response: any) => {
        // La imagen se subió, ahora actualizar los datos incluyendo la URL de la imagen
        const dataToUpdate: Partial<INegocio> = {
          nombre: this.negocioTemp.nombre,
          categoria: this.negocioTemp.categoria,
          descripcion: this.negocioTemp.descripcion,
          direccion: this.negocioTemp.direccion,
          telefono: this.negocioTemp.telefono,
          correo: this.negocioTemp.correo,
          imagen_url: response.imagen_url || response.url
        };

        this.actualizarDatosNegocio(dataToUpdate);
      },
      error: (error: any) => {
        this.errorMessage.set(error.message || 'Error al subir la imagen');
        this.isLoading.set(false);
        console.error('Error al subir imagen:', error);
      }
    });
  }

  private actualizarDatosNegocio(dataToUpdate?: Partial<INegocio>): void {
    // Preparar datos para actualizar (solo campos editables)
    const datosFinales: Partial<INegocio> = dataToUpdate || {
      nombre: this.negocioTemp.nombre,
      categoria: this.negocioTemp.categoria,
      descripcion: this.negocioTemp.descripcion,
      direccion: this.negocioTemp.direccion,
      telefono: this.negocioTemp.telefono,
      correo: this.negocioTemp.correo
    };

    this.negocioService.updateNegocio(this.negocioId, datosFinales).subscribe({
      next: (negocioActualizado: INegocio) => {
        this.negocio.set(negocioActualizado);
        this.selectedImageFile = null;
        this.imagePreview = negocioActualizado.imagen_url || null;
        this.successMessage.set('Información actualizada correctamente');
        this.isEditing.set(false);
        this.isLoading.set(false);
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error: any) => {
        this.errorMessage.set(error.message || 'Error al actualizar la información');
        this.isLoading.set(false);
        console.error('Error al actualizar negocio:', error);
      }
    });
  }
}
