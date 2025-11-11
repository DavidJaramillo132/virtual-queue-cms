import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faEye, faTrash, faTimes, faMapMarkerAlt, faPhone, faEnvelope, faCalendar, faUser } from '@fortawesome/free-solid-svg-icons';
import { AdminGeneralService, Negocio } from '../../../services/Rest/admin-general.service';

@Component({
  selector: 'app-negocios',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './negocios.html',
  styleUrls: ['./negocios.css']
})
export class NegociosComponent implements OnInit {
  // Icons
  faSearch = faSearch;
  faEye = faEye;
  faTrash = faTrash;
  faTimes = faTimes;
  faMapMarkerAlt = faMapMarkerAlt;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faCalendar = faCalendar;
  faUser = faUser;

  // Estado
  searchQuery = signal<string>('');
  loading = signal<boolean>(true);
  showModal = signal<boolean>(false);
  negocioDetalle = signal<Negocio | null>(null);
  loadingDetalle = signal<boolean>(false);

  // Data
  negocios = signal<Negocio[]>([]);

  constructor(private adminGeneralService: AdminGeneralService) {}

  ngOnInit() {
    this.cargarNegocios();
  }

  // Carga los negocios desde el servicio
  cargarNegocios() {
    this.loading.set(true);
    this.adminGeneralService.getAllNegocios().subscribe({
      next: (data) => {
        this.negocios.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando negocios:', error);
        this.loading.set(false);
      }
    });
  }

  // Buscar negocios cuando cambia el query
  onSearchChange() {
    const query = this.searchQuery();
    this.loading.set(true);
    this.adminGeneralService.getAllNegocios(query).subscribe({
      next: (data) => {
        this.negocios.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error buscando negocios:', error);
        this.loading.set(false);
      }
    });
  }

  negociosFiltrados() {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.negocios();
    }
    return this.negocios().filter(n => 
      n.nombre.toLowerCase().includes(query) ||
      n.categoria.toLowerCase().includes(query) ||
      n.email.toLowerCase().includes(query)
    );
  }

  verDetalles(negocio: Negocio) {
    this.loadingDetalle.set(true);
    this.showModal.set(true);
    
    // Cargar detalles completos del negocio desde el backend
    this.adminGeneralService.getNegocioById(negocio.id).subscribe({
      next: (detalle) => {
        this.negocioDetalle.set(detalle);
        this.loadingDetalle.set(false);
      },
      error: (error) => {
        console.error('Error cargando detalles del negocio:', error);
        // Si falla, usar los datos que ya tenemos
        this.negocioDetalle.set(negocio);
        this.loadingDetalle.set(false);
        alert('Error al cargar los detalles completos del negocio');
      }
    });
  }

  cerrarModal() {
    this.showModal.set(false);
    this.negocioDetalle.set(null);
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return 'No disponible';
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  eliminarNegocio(negocio: Negocio) {
    if (confirm(`¿Estás seguro de eliminar el negocio "${negocio.nombre}"? Esta acción no se puede deshacer.`)) {
      this.adminGeneralService.deleteNegocio(negocio.id).subscribe({
        next: () => {
          // Remover el negocio de la lista
          this.negocios.set(this.negocios().filter(n => n.id !== negocio.id));
          alert('Negocio eliminado exitosamente');
        },
        error: (error) => {
          console.error('Error eliminando negocio:', error);
          alert('Error al eliminar el negocio. Por favor, intenta nuevamente.');
        }
      });
    }
  }
}
