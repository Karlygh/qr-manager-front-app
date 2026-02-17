import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BUSINESS_CREATION_CONSTANTS } from '../constants/business-creation.constants';

@Component({
  selector: 'app-business-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isVisible"
      class="success-overlay"
      role="dialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="'modal-title'"
      [attr.aria-describedby]="'modal-description'"
    >
      <div class="success-modal animate-pop" [attr.aria-live]="'polite'">
        <div class="icon-circle" aria-hidden="true">
          <i class="bi bi-patch-check-fill"></i>
        </div>
        <h3 id="modal-title" class="modal-title">
          {{ CONSTANTS.MESSAGES.SUCCESS_TITLE }}
        </h3>
        <p id="modal-description" class="modal-description">
          {{ showRedirectMessage ? CONSTANTS.MESSAGES.REDIRECT_SUBTITLE : CONSTANTS.MESSAGES.SUCCESS_SUBTITLE }}
        </p>
        <div *ngIf="showLoader" class="loader" role="status" aria-label="Cargando..."></div>
      </div>
    </div>
  `,
  styleUrls: ['./business-success-modal.component.css']
})
export class BusinessSuccessModalComponent implements OnChanges {
  @Input() isVisible = false;
  @Output() redirectNeeded = new EventEmitter<void>();

  protected CONSTANTS = BUSINESS_CREATION_CONSTANTS;
  showLoader = true;
  showRedirectMessage = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue === true) {
      this.setUpRedirectTimer();
    }
  }

  private setUpRedirectTimer(): void {
    setTimeout(() => {
      this.showRedirectMessage = true;
    }, 1000);

    setTimeout(() => {
      this.redirectNeeded.emit();
    }, BUSINESS_CREATION_CONSTANTS.REDIRECT_DELAY_MS);
  }
}
