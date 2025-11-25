import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Encabezado } from '../../encabezado/encabezado';
import { EncabezadoEjemplos } from "../../encabezado-ejemplos/encabezado-ejemplos";
import { QrManagerInfo } from '../../qr-manager-info/qr-manager-info';
import { Precios } from '../precios/precios';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Encabezado,
    EncabezadoEjemplos,
    QrManagerInfo,Precios
],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent { 
  public title = "QR-MANAGER"
}