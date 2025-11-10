import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { UserService } from '../../../services/Rest/userServices';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './login.html',
})
export class Login {
  public faGoogle = faGoogle;
  public faGithub = faGithub;
  loginForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading = false;

  constructor(private fb: FormBuilder, private userService: UserService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }


  onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    const { email, password } = this.loginForm.value;
    const userData = { email, password };

    this.userService.loginUsuario(userData).subscribe({
      next: (res: any) => {
        console.log('Respuesta del servidor:', res);
        if (res.successful) {
          console.log('Inicio de sesión exitoso:', res);
          this.successMessage = 'Inicio de sesión exitoso. Redirigiendo...';
          
          this.loginForm.reset();
          this.loading = false;
          console.log("negocio id", res.user.rol);
          if (res.user.rol == 'negocio'){
            this.router.navigate(['/admin-local'])
          }else{
            this.router.navigate(['/home']);
          }

        } else {
          this.errorMessage = res.message || 'Error en el inicio de sesión.';
          this.loading = false;
        }
      },
      error: (error: any) => {
        console.error('Error en el inicio de sesión:', error);
        this.errorMessage = error.error?.message || 'Error en el inicio de sesión. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
  }



}
