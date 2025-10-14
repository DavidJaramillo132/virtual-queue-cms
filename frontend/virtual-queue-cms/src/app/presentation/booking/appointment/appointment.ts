import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-appointment',
  imports: [ReactiveFormsModule],
  templateUrl: './appointment.html',
})
export class Appointment {
  @Output() closeModal = new EventEmitter<void>();
  bookingForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.bookingForm = this.fb.group({
      fecha: [''],
      hora: [''],
      nombre: [''],
    });
  }

  close() {
    this.closeModal.emit();
  }


  onSubmit() {
    console.log(this.bookingForm.value);
    // Aquí puedes llamar a tu servicio para crear la cita
    this.close();
  }
}
