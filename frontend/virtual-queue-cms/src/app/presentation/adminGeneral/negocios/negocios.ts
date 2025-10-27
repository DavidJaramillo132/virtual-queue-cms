import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faEye, faExclamationTriangle, faTrash } from '@fortawesome/free-solid-svg-icons';

interface Negocio {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  tieneAdvertencia: boolean;
}

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
  faExclamationTriangle = faExclamationTriangle;
  faTrash = faTrash;

  // Estado
  searchQuery = signal<string>('');

  // Data - Preparado para conexión a BD
  negocios = signal<Negocio[]>([
    {
      id: 1,
      nombre: 'Restaurante El Buen Sabor',
      categoria: 'Restaurante',
      descripcion: 'Comida tradicional y deliciosa',
      direccion: 'Calle Principal 123',
      telefono: '555-0101',
      email: 'contacto@buensabor.com',
      activo: true,
      tieneAdvertencia: false
    },
    {
      id: 2,
      nombre: 'Veterinaria Patitas Felices',
      categoria: 'Veterinaria',
      descripcion: 'Cuidado integral para tus mascotas',
      direccion: 'Avenida Central 456',
      telefono: '555-0102',
      email: 'info@patitasfelices.com',
      activo: true,
      tieneAdvertencia: false
    },
    {
      id: 3,
      nombre: 'Salón de Belleza Glamour',
      categoria: 'Salón de Belleza',
      descripcion: 'Tu belleza es nuestra pasión',
      direccion: 'Plaza Mayor 789',
      telefono: '555-0103',
      email: 'contacto@glamour.com',
      activo: true,
      tieneAdvertencia: false
    },
    {
      id: 4,
      nombre: 'Hospital Central',
      categoria: 'Hospital',
      descripcion: 'Atención médica de calidad',
      direccion: 'Avenida Salud 321',
      telefono: '555-0104',
      email: 'info@hospitalcentral.com',
      activo: true,
      tieneAdvertencia: true
    }
  ]);

  ngOnInit() {
    // TODO: Aquí se cargará la data desde el servicio
    // this.cargarNegocios();
  }

  // Método preparado para conexión con BD
  cargarNegocios() {
    // TODO: Implementar llamada al servicio
    // this.negociosService.getAllNegocios().subscribe(data => {
    //   this.negocios.set(data);
    // });
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
    // TODO: Navegar a vista de detalles o abrir modal
    console.log('Ver detalles de:', negocio);
  }

  emitirAdvertencia(negocio: Negocio) {
    if (confirm(`¿Estás seguro de emitir una advertencia a ${negocio.nombre}?`)) {
      // TODO: Implementar
      // this.negociosService.emitirAdvertencia(negocio.id).subscribe(...)
      negocio.tieneAdvertencia = true;
      this.negocios.set([...this.negocios()]);
    }
  }

  eliminarNegocio(negocio: Negocio) {
    if (confirm(`¿Estás seguro de eliminar el negocio "${negocio.nombre}"? Esta acción no se puede deshacer.`)) {
      // TODO: Implementar
      // this.negociosService.deleteNegocio(negocio.id).subscribe(...)
      this.negocios.set(this.negocios().filter(n => n.id !== negocio.id));
    }
  }
}
