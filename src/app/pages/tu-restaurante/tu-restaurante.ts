import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PanelControlBuisiness } from '../../panel-control-buisiness/panel-control-buisiness';

@Component({
  selector: 'app-tu-restaurante',
  standalone: true,
  imports: [CommonModule,RouterModule,PanelControlBuisiness],
  templateUrl: './tu-restaurante.html',
  styleUrl: './tu-restaurante.css'
})
export class TuRestaurante {

}
