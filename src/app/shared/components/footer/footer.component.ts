import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'shared-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})



export class FooterComponent {

  private router = inject(Router);
  public footerItems: Array<{ label: string, url?: string, action?: () => void, subItems?: Array<{ label: string, url?: string, action?: () => void }> }> = [];


  public correo = "cleancoderscadiz@gmail.com";
  public telefono = "+34 123 456 789";
  public instagram = "https://www.instagram.com/cleancoderscadiz";
  public twitter = "https://www.twitter.com";
  public facebook = "https://www.facebook.com/profile.php?id=1000000000000";


  ngOnInit(): void {
    this.footerItems = [
      { label: this.correo, url: '/home' },
      { label: this.telefono, url: '/shop/products' },
    ]};




}
