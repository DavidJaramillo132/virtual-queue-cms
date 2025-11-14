import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTrash, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { AdminGeneralService, Usuario, RolUsuario } from '../../../services/Rest/admin-general.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})
export class UsuariosComponent implements OnInit {
  // Icons
  faSearch = faSearch;
  faTrash = faTrash;
  faEnvelope = faEnvelope;

  // Estado
  searchQuery = signal<string>('');
  filtroRol = signal<string>('todos');
  loading = signal<boolean>(true);

  // Data
  usuarios = signal<Usuario[]>([]);

  constructor(private adminGeneralService: AdminGeneralService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  // Carga los usuarios desde el servicio
  cargarUsuarios() {
    this.loading.set(true);
    const rol = this.filtroRol() !== 'todos' ? this.filtroRol() as RolUsuario : undefined;
    
    this.adminGeneralService.getAllUsuarios(rol).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.loading.set(false);
      }
    });
  }

  // Recarga usuarios cuando cambia el filtro de rol
  onFiltroRolChange() {
    this.cargarUsuarios();
  }

  usuariosFiltrados() {
    let usuarios = this.usuarios();
    
    // Filtrar por rol
    if (this.filtroRol() !== 'todos') {
      usuarios = usuarios.filter(u => u.rol === this.filtroRol());
    }
    
    // Filtrar por búsqueda
    const query = this.searchQuery().toLowerCase();
    if (query) {
      usuarios = usuarios.filter(u => 
        u.nombre.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }
    
    return usuarios;
  }

  eliminarUsuario(usuario: Usuario) {
    if (confirm(`¿Estás seguro de eliminar al usuario "${usuario.nombre}"? Esta acción no se puede deshacer.`)) {
      this.adminGeneralService.deleteUsuario(usuario.id).subscribe({
        next: () => {
          // Remover el usuario de la lista
          this.usuarios.set(this.usuarios().filter(u => u.id !== usuario.id));
          alert('Usuario eliminado exitosamente');
        },
        error: (error) => {
          console.error('Error eliminando usuario:', error);
          alert('Error al eliminar el usuario. Por favor, intenta nuevamente.');
        }
      });
    }
  }

  getRolBadgeClass(rol: RolUsuario): string {
    const classes: { [key in RolUsuario]: string } = {
      'Cliente': 'px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full',
      'Admin Local': 'px-3 py-1 bg-black text-white text-xs font-medium rounded-full',
      'Admin Sistema': 'px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full'
    };
    return classes[rol];
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}
