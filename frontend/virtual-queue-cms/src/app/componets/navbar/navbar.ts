import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { UserService } from '../../services/Rest/userServices'; 
import { IUsuario } from '../../domain/entities';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule, CommonModule],
  templateUrl: './navbar.html',
})
export class Navbar implements OnInit {
  faUser = faUser;
  usuario: IUsuario | null = null;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    // 🔄 Escucha los cambios del usuario en tiempo real
    this.userService.userActual.subscribe((user) => {
      this.usuario = user;
    });
  }

  logout() {
    this.userService.logout(); 
  }
}
