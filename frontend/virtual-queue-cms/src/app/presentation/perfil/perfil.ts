import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/Rest/userServices';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { IUsuario } from '../../domain/entities';

import { UserGraphQl } from '../../services/GraphQL/user-graph-ql'
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
  perfilGraphQL: any[] = [];
  
  // Datos del resumen de citas desde GraphQL
  resumenCitas = {
    totalCitas: 0,
    citasCompletadas: 0,
    citasPendientes: 0,
    citasCanceladas: 0
  };

  constructor(
    private userService: UserService,
    //private perfilService: PerfilService,
    private router: Router,
    private userGraphQl: UserGraphQl
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadUserProfileGraphQL();
  
  }

  loadUserProfileGraphQL() {
    this.userGraphQl.perfil_completo_usuario()
      .subscribe({
        next: (res) => {
          this.perfilGraphQL = res?.data?.perfilCompletoUsuario ? [res.data.perfilCompletoUsuario] : [];
          console.log("respuesta del graphQL", res);
          // Extraer los datos del resumen de citas
          if (res?.data?.perfilCompletoUsuario) {
            this.resumenCitas = {
              totalCitas: res.data.perfilCompletoUsuario.totalCitas || 0,
              citasCompletadas: res.data.perfilCompletoUsuario.citasCompletadas || 0,
              citasPendientes: res.data.perfilCompletoUsuario.citasPendientes || 0,
              citasCanceladas: res.data.perfilCompletoUsuario.citasCanceladas || 0
            };
          }
        },
        error: (err) => {
          console.error("Error al cargar perfil desde GraphQL:", err);
          this.perfilGraphQL = [];
          // Mantener valores en 0 en caso de error
        }
      });
    
    console.log("informacion del graphQL", this.perfilGraphQL);
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
  // Modificar el perfil
  habilitarModoEdicion(): void {
    this.isEditMode = true;
    const currentUser = this.getUser();
    if (currentUser) {
      this.editedProfile = { ...currentUser };
    }
  }

  cancelarModoEdicion(): void {
    this.isEditMode = false;
    this.editedProfile = {};
    this.saveMessage = '';
  }

  guardarCambios(): void {
    const currentUser = this.getUser();

    if (!currentUser || !currentUser.id) {
      this.saveMessage = 'Error: No se pudo identificar el usuario.';
      return;
    }

    // Crear el objeto completo con el id del usuario actual
    const usuarioActualizado: any = {
      ...currentUser,
      ...this.editedProfile,
      id: currentUser.id
    };

    this.isSaving = true;
    this.saveMessage = '';

    this.userService.actualizarUsuario(usuarioActualizado).subscribe({
      next: (updatedUser: IUsuario) => {
        this.IUsuario = updatedUser;
        this.isEditMode = false;
        this.isSaving = false;
        this.saveMessage = 'Perfil actualizado con éxito.';

        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error al actualizar el perfil:', err);
        this.isSaving = false;
        this.saveMessage = 'Error al actualizar el perfil. Por favor, inténtalo de nuevo.';
      }
    });
  }

  ResumenPDF(): void {
    this.loadUserProfileGraphQL();
  }
}
