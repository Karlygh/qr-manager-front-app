import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './encabezado.html',
  styleUrls: ['./encabezado.css']
})
export class Encabezado {
}
