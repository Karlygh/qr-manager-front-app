import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleClientes } from './google-clientes';

describe('GoogleClientes', () => {
  let component: GoogleClientes;
  let fixture: ComponentFixture<GoogleClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleClientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleClientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
