import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NegocioData {
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
}

@Component({
  selector: 'app-negocio-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './negocio-info.html',
  styleUrls: ['./negocio-info.css']
})
export class NegocioInfoComponent implements OnInit {
  // Estado de edición
  isEditing = signal<boolean>(false);

  // Data del negocio - Preparado para conexión a BD
  negocio = signal<NegocioData>({
    nombre: 'Restaurante El Buen Sabor',
    categoria: 'Restaurante',
    descripcion: 'Comida tradicional y deliciosa',
    direccion: 'Calle Principal 123',
    telefono: '555-0101',
    email: 'contacto@buensabor.com'
  });

  // Copia temporal para edición
  negocioTemp: NegocioData = { ...this.negocio() };

  ngOnInit() {
    // TODO: Aquí se cargará la data desde el servicio
    // this.cargarNegocio();
  }

  // Método preparado para conexión con BD
  cargarNegocio() {
    // TODO: Implementar llamada al servicio
    // this.negocioService.getNegocio().subscribe(data => {
    //   this.negocio.set(data);
    // });
  }

  toggleEdit() {
    if (this.isEditing()) {
      // Cancelar edición
      this.negocioTemp = { ...this.negocio() };
    } else {
      // Iniciar edición
      this.negocioTemp = { ...this.negocio() };
    }
    this.isEditing.set(!this.isEditing());
  }

  guardarCambios() {
    // TODO: Implementar llamada al servicio para guardar
    // this.negocioService.updateNegocio(this.negocioTemp).subscribe(
    //   data => {
    //     this.negocio.set(this.negocioTemp);
    //     this.isEditing.set(false);
    //   }
    // );
    
    // Por ahora solo actualizamos localmente
    this.negocio.set({ ...this.negocioTemp });
    this.isEditing.set(false);
  }
}
