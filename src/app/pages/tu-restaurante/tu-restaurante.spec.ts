import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TuRestaurante } from './tu-restaurante';

describe('TuRestaurante', () => {
  let component: TuRestaurante;
  let fixture: ComponentFixture<TuRestaurante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TuRestaurante]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TuRestaurante);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
