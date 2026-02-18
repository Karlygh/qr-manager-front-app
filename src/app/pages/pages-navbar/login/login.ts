import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginForm } from './login-form/login-form';
import { LoginSocial } from './login-social/login-social';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, LoginForm, LoginSocial],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {}