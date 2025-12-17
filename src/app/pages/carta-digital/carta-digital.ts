import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { SectionqrCartadigital } from '../../sectionqr-cartadigital/sectionqr-cartadigital';
import { ActualizaCartaDigital } from '../../actualiza-carta-digital/actualiza-carta-digital';
import { AlergenosCartaDigital } from '../../alergenos-carta-digital/alergenos-carta-digital';
import { NosotrosCartaDigital } from "../../nosotros-carta-digital/nosotros-carta-digital";

@Component({
  standalone: true, 
  selector: 'app-carta-digital',
  imports: [RouterLink, CommonModule, RouterModule, SectionqrCartadigital, ActualizaCartaDigital, AlergenosCartaDigital, NosotrosCartaDigital], 
  templateUrl: './carta-digital.html',
  styleUrls: ['./carta-digital.css']
})
export class CartaDigital {
}