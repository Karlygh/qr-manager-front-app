import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-regristo-login',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './regristo-login.html',
  styleUrl: './regristo-login.css'
})
export class RegristoLogin {

}
