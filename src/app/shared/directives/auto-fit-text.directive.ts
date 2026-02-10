import {
  Directive,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: '[appAutoFitText]',
  standalone: true,
})
export class AutoFitTextDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private resizeObserver: ResizeObserver | null = null;

  readonly maxFontSize = input<number>(11);
  readonly minFontSize = input<number>(6);

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.adjustFontSize());

    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => this.adjustFontSize());
    });
    this.resizeObserver.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private adjustFontSize(): void {
    const element = this.el.nativeElement as HTMLElement;
    const containerWidth = element.clientWidth;

    if (containerWidth === 0) return;

    const max = this.maxFontSize();
    const min = this.minFontSize();

    element.style.fontSize = `${max}px`;

    let currentSize = max;
    while (element.scrollWidth > containerWidth && currentSize > min) {
      currentSize -= 0.5;
      element.style.fontSize = `${currentSize}px`;
    }
  }
}