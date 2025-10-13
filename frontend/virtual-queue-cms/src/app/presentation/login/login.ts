import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../services/loginservice';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { Navbar } from '../navbar/navbar';
import { environment } from '../../environment/environment';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FontAwesomeModule, Navbar],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  public faGoogle = faGoogle;
  public faGithub = faGithub;
  loginForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading = false;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      if (this.loginForm.errors && this.loginForm.errors['passwordMismatch']) {
        this.errorMessage = 'Las contraseñas no coinciden.';
      }
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    const { email, password } = this.loginForm.value;


}}
