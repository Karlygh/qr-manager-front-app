import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-qr-manager-info',
  standalone: true,
  templateUrl: './qr-manager-info.html',
  styleUrls: ['./qr-manager-info.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrManagerInfo {}
