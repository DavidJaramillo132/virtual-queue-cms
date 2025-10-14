import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.html',
  standalone: true,
})
export class BusinessCard {
  @Input() negocio: any;

  constructor(private router: Router) {}

  goToBusiness(): void {
    if (this.negocio && this.negocio.id) {
      this.router.navigate(['/business', this.negocio.id]);
    }
  }
}
