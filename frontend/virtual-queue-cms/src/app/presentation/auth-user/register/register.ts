import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { userService } from '../../../services/userServices';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './register.html',
})
export class Register {
  public faGoogle = faGoogle;
  public faGithub = faGithub;
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading = false;

  constructor(private fb: FormBuilder, private userService: userService, private router: Router) {
    this.registerForm = this.fb.group({
      nombreCompleto: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      rol: ['cliente', [Validators.required]], // cliente o adminLocal
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatch });
  }

  async onSubmit() {
    // Validar que el formulario sea válido
    if (this.registerForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    // Preparar datos para enviar (sin confirmPassword y terms)
    const { nombreCompleto, email, password, rol, telefono } = this.registerForm.value;
    const userData = { nombreCompleto, email, password, rol, telefono };

    this.userService.registerUsuario(userData).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log('Usuario registrado exitosamente:', res);
        this.successMessage = 'Registro exitoso. Redirigiendo...';
        this.registerForm.reset();

        // Redirigir después de un breve delay
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error en el registro:', err);
        this.errorMessage = err.error?.message || 'Error en el registro. Inténtalo de nuevo.';
      }
    });
  }

  // Validator para comprobar que password y confirmPassword coincidan
  passwordsMatch(group: FormGroup) {
    const pwd = group.get('password')?.value;
    const cpwd = group.get('confirmPassword')?.value;
    return pwd && cpwd && pwd === cpwd ? null : { passwordMismatch: true };
  }
}
