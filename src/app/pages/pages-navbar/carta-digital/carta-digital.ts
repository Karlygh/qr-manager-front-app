import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Encabezado } from '../../home/encabezado/encabezado';
import { EncabezadoEjemplos } from "../../home/encabezado-ejemplos/encabezado-ejemplos";
import { QrManagerInfo } from '../../home/qr-manager-info/qr-manager-info';
import { Precios } from '../precios/precios';

@Component({
  standalone: true,
  selector: 'app-carta-digital',
  imports: [
    CommonModule,
    RouterModule,
    Encabezado,
    EncabezadoEjemplos,
    QrManagerInfo,Precios
],
  templateUrl: './carta-digital.html',
  styleUrls: ['./carta-digital.css']
})
export class CartaDigital { 
  public title = "QR-MANAGER"
}