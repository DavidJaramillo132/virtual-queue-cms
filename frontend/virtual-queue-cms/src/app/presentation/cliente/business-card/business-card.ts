import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-business-card',
  templateUrl: './business-card.html',
  styleUrls: ['./business-card.css'],
  standalone: true,
})
export class BusinessCard {
  @Input() negocio: any;
}
