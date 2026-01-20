import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PanelControlBusiness } from '../../pages-panel-control-user/panel-control-business/panel-control-business';

@Component({
  selector: 'app-tu-restaurante',
  standalone: true,
  imports: [CommonModule, RouterModule, PanelControlBusiness],
  templateUrl: './tu-restaurante.html',
  styleUrls: ['./tu-restaurante.css']
})
export class TuRestaurante {

}
