import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { UserService } from '../../../services/Rest/userServices';
import { NegocioServices } from '../../../services/Rest/negocio-services';
import { switchMap } from 'rxjs';
import { Business } from './business/business';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule, Business],
  templateUrl: './register.html',
})
export class Register {
  public faGoogle = faGoogle;
  public faGithub = faGithub;
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading = false;
  showBusinessForm = false;

  constructor(
    private fb: FormBuilder, 
    private userService: UserService,
    private negocioService: NegocioServices,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nombre_completo: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      rol: ['cliente', [Validators.required]], // cliente, negocio o admin_sistema
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatch });

    // Escuchar cambios en el campo 'rol'
    this.registerForm.get('rol')?.valueChanges.subscribe((value) => {
      this.showBusinessForm = value === 'negocio';
    });
  }

  async onSubmit() {
    // Validar que el formulario sea válido
    if (this.registerForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    // Preparar datos para enviar (sin confirmPassword y terms)
    const { nombre_completo, email, password, rol, telefono, negocio } = this.registerForm.value;
    const userData = { nombre_completo, email, password, rol, telefono };
    const userLoginData = { email, password };

    // Si el rol es "negocio", primero crear el usuario y luego el negocio
    if (rol === 'negocio' && negocio) {
      this.userService.registerUsuario(userData).pipe(
        switchMap((userResponse: any) => {
          console.log('Usuario registrado:', userResponse);
          // Crear el negocio asociado al usuario
          // Extraer id del usuario creado. Puede venir en distintos formatos según el backend
          const userId = userResponse.id || userResponse.data?.id || userResponse.usuario?.id || userResponse.user?.id || userResponse.data?.user?.id;
          console.log('userId extraído del registro:', userId);

          if (!userId) {
            // Evitar crear un negocio huérfano si no se encuentra el id del usuario
            throw new Error('No se pudo obtener el id del usuario tras el registro');
          }

          const negocioData = {
            nombre: negocio.nombre,
            categoria: negocio.categoria,
            descripcion: negocio.descripcion,
            telefono: negocio.telefono_negocio,
            correo: negocio.correo,
            imagen_url: negocio.imagen_url || '',
            // Usar el userId extraído del response (puede venir anidado)
            admin_negocio_id: userId,
            estado: true,
          };
          
          return this.negocioService.createNegocio(negocioData);
        }),
        switchMap((negocioResponse: any) => {
          console.log('Negocio creado:', negocioResponse);
          // Hacer login después de crear el negocio
          return this.userService.loginUsuario(userLoginData);
        })
      ).subscribe({
        next: (res: any) => {
          this.loading = false;
          console.log('Registro completo:', res);
          this.successMessage = '¡Registro exitoso! Tu negocio ha sido creado. Redirigiendo...';
          this.registerForm.reset();
          
          // Redirigir después de un breve delay
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1500);
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Error en el registro:', err);
          this.errorMessage = err.error?.message || 'Error en el registro. Inténtalo de nuevo.';
        }
      });
    } else {
      // Registro normal de cliente
      this.userService.registerUsuario(userData).pipe(
        switchMap(() => this.userService.loginUsuario(userLoginData))
      ).subscribe({
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
  }

  // Marcar todos los campos como tocados para mostrar errores
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
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
