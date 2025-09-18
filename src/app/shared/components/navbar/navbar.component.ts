import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'shared-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'], // styleUrls en lugar de styleUrl
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {

  private router = inject(Router);
  public navbarItems: Array<{ label: string, url?: string, icon: string, action?: () => void, subItems?: Array<{ label: string, url?: string, action?: () => void }> }> = [];
  public isProfileDropdownOpen: boolean = false;  // Controla el dropdown

  ngOnInit(): void {
    this.navbarItems = [
      { label: 'Inicio', url: '/home', icon: '' },
      { label: 'Mi negocio', url: '/business', icon: '' },
      { label: 'Mi carta', url: '/menu', icon: '' },
      { label: 'Sobre nosotros', url: '/about-us', icon: ''},
      { label: 'Contacta con nosotros', url: '/contact-us', icon: ''},
    ];


  }
}
