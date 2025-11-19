import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  standalone: true, 
  selector: 'app-carta-digital',
  imports: [RouterLink,CommonModule,RouterModule], 
  templateUrl: './carta-digital.html',
  styleUrl: './carta-digital.css'
})
export class CartaDigital {
}