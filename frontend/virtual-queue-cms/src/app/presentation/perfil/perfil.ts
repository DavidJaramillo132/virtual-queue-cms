import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/userServices';
//import { PerfilService } from '../../services/perfilService';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { IUsuario } from '../../domain/entities';
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html'
})
export class PerfilComponent implements OnInit {
  faUser = faUser;
  IUsuario: IUsuario | null = null;
  isEditMode: boolean = false;
  editedProfile: Partial<IUsuario> = {};
  profileCompleteness: number = 0;
  isSaving: boolean = false;
  saveMessage: string = '';

  constructor(
    private userService: UserService,
    //private perfilService: PerfilService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const currentUser = this.userService.currentUserValue;

    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  getUser(): IUsuario | null {
    return this.userService.currentUserValue;
  }
}
