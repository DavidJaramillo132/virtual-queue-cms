import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LoginService } from '../../services/loginservice';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule], 
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private loginService: LoginService) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMsg = 'Por favor, completa todos los campos correctamente';
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    try {
      const { user, error } = await this.loginService.signIn(email!, password!);
      if (error) throw error;
      console.log('✅ Usuario logueado:', user);
      this.errorMsg = '';
    } catch (err: any) {
      this.errorMsg = err.message || 'Error al iniciar sesión';
    } finally {
      this.loading = false;
    }
  }
}
