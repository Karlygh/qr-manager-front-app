import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './encabezado.html',
  styleUrls: ['./encabezado.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Encabezado {}
