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
    if (this.registerForm.invalid) {
      await this.userService.registerUsuario(this.registerForm.value).subscribe({
        next: (res: any) => {
          if (res.successful) {
            this.registerForm.reset();
            this.router.navigate(['/home']);
          }else {
            this.errorMessage = res.message || 'Error en el registro. Inténtalo de nuevo.';
          }
        },
        error: (err: any) => {
          this.errorMessage = err.message;
        }
      });
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    const { email, password, nombre, rol, telefono } = this.registerForm.value;


  }

  // Validator para comprobar que password y confirmPassword coincidan
  passwordsMatch(group: FormGroup) {
    const pwd = group.get('password')?.value;
    const cpwd = group.get('confirmPassword')?.value;
    return pwd && cpwd && pwd === cpwd ? null : { passwordMismatch: true };
  }
}
