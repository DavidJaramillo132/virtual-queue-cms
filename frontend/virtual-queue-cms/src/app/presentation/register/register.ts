import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environment/environment';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { Navbar } from '../navbar/navbar';
const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-register',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule, Navbar], 
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  public faGoogle = faGoogle;
  public faGithub = faGithub;
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading = false;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      rol: ['cliente', [Validators.required]], // cliente o adminLocal
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatch });
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      if (this.registerForm.errors && this.registerForm.errors['passwordMismatch']) {
        this.errorMessage = 'Las contraseñas no coinciden.';
      }
      return;
    }

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

  // Validator para comprobar que password y confirmPassword coincidan
  passwordsMatch(group: FormGroup) {
    const pwd = group.get('password')?.value;
    const cpwd = group.get('confirmPassword')?.value;
    return pwd && cpwd && pwd === cpwd ? null : { passwordMismatch: true };
  }
}
