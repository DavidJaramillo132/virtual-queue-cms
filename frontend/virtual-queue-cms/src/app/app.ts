import { Component, Provider, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Navbar } from './presentation/navbar/navbar';
import { Footer } from './presentation/footer/footer';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ReactiveFormsModule, 
    FontAwesomeModule,
    Navbar,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('virtual-queue-cms');

}
