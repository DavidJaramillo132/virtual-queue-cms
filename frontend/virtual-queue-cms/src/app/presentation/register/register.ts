import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-register',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, RouterLink], 
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading = false;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', [Validators.required]],
      rol: ['cliente', [Validators.required]], // cliente o adminLocal
    });
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    const { email, password, nombre, rol, telefono } = this.registerForm.value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, rol, telefono } 
        }
      });

      if (error) throw error;

      this.successMessage = 'Registro exitoso. Revisa tu correo para confirmar la cuenta.';
      this.registerForm.reset();
    } catch (err: any) {
      this.errorMessage = err.message;
    } finally {
      this.loading = false;
    }
  }
}
