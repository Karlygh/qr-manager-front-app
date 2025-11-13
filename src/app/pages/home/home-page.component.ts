import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Encabezado } from '../../encabezado/encabezado';
import { EncabezadoEjemplos } from "../../encabezado-ejemplos/encabezado-ejemplos";
import { QrManagerInfo } from '../../qr-manager-info/qr-manager-info';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Encabezado,
    EncabezadoEjemplos,
    QrManagerInfo,
],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
// Usamos export normal y clase con convención de nombre de archivo
export class HomePageComponent { 
  public title = "QR-MANAGER"
}