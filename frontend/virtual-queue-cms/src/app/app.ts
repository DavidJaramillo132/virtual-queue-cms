import { Component, Provider, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Navbar } from './componets/navbar/navbar';
import { Footer } from './componets/footer/footer';
import { ChatBotComponent } from './componets/chat-bot/chat-bot';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ReactiveFormsModule, 
    FontAwesomeModule,
    Navbar,
    Footer,
    ChatBotComponent
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('virtual-queue-cms');

}
