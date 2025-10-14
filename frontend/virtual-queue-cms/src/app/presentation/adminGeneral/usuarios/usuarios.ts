import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTrash, faEnvelope } from '@fortawesome/free-solid-svg-icons';

type RolUsuario = 'Cliente' | 'Admin Local' | 'Admin Sistema';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  fechaRegistro: string;
}

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

  // Data - Preparado para conexión a BD
  usuarios = signal<Usuario[]>([
    {
      id: 1,
      nombre: 'María García',
      email: 'maria@example.com',
      rol: 'Cliente',
      fechaRegistro: '2024-01-10'
    },
    {
      id: 2,
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      rol: 'Admin Local',
      fechaRegistro: '2024-01-05'
    },
    {
      id: 3,
      nombre: 'Ana López',
      email: 'ana@example.com',
      rol: 'Cliente',
      fechaRegistro: '2024-01-15'
    },
    {
      id: 4,
      nombre: 'Carlos Martínez',
      email: 'carlos@example.com',
      rol: 'Admin Sistema',
      fechaRegistro: '2024-01-01'
    },
    {
      id: 5,
      nombre: 'Laura Sánchez',
      email: 'laura@example.com',
      rol: 'Cliente',
      fechaRegistro: '2024-01-20'
    }
  ]);

  ngOnInit() {
    // TODO: Aquí se cargará la data desde el servicio
    // this.cargarUsuarios();
  }

  // Método preparado para conexión con BD
  cargarUsuarios() {
    // TODO: Implementar llamada al servicio
    // this.usuariosService.getAllUsuarios().subscribe(data => {
    //   this.usuarios.set(data);
    // });
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
      // TODO: Implementar
      // this.usuariosService.deleteUsuario(usuario.id).subscribe(...)
      this.usuarios.set(this.usuarios().filter(u => u.id !== usuario.id));
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
