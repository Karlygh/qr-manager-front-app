import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DetallesPanelControl } from './detalles-panel-control/detalles-panel-control';

@Component({
  selector: 'app-panel-control-buisiness',
  standalone: true,
  imports: [RouterModule, CommonModule,DetallesPanelControl],
  templateUrl: './panel-control-buisiness.html',
  styleUrls: ['./panel-control-buisiness.css']
})
export class PanelControlBuisiness {

}