import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstalacionesClientes } from './instalaciones-clientes';

describe('InstalacionesClientes', () => {
  let component: InstalacionesClientes;
  let fixture: ComponentFixture<InstalacionesClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstalacionesClientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstalacionesClientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
