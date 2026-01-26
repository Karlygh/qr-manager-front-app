import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorariosClientes } from './horarios-clientes';

describe('HorariosClientes', () => {
  let component: HorariosClientes;
  let fixture: ComponentFixture<HorariosClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorariosClientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorariosClientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
