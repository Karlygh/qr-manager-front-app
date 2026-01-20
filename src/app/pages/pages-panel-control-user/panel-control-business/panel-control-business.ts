import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DetallesPanelControl } from './detalles-panel-control/detalles-panel-control';

@Component({
  selector: 'app-panel-control-business',
  standalone: true,
  imports: [RouterModule, CommonModule,DetallesPanelControl],
  templateUrl: './panel-control-business.html',
  styleUrls: ['./panel-control-business.css']
})
export class PanelControlBusiness {

}
