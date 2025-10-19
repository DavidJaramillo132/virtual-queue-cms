import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { INegocio } from '../../domain/entities';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.html',
  standalone: true,
  imports: [CommonModule]
})
export class BusinessCard {
  @Input() negocio!: INegocio;

  constructor(private router: Router) {}

  goToBusiness(): void {
    if (this.negocio && this.negocio.id) {
      this.router.navigate(['/business', this.negocio.id]);
    }
  }
}
