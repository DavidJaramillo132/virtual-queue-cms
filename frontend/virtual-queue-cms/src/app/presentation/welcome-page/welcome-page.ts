import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-welcome-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './welcome-page.html',
})
export class WelcomePage {

}
