import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './error404-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./error404-page.component.css'],
})
export default class error404PageComponent{}
