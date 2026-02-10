import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Pipe para manejar la lógica dinámica de labels en formularios reactivos.
 * Si el control está vacío/null/undefined, muestra "Sin completar"
 * De lo contrario, muestra la etiqueta original.
 * 
 * Uso: {{ controlName | formLabel: 'Nombre del Campo' }}
 */
@Pipe({
  name: 'formLabel',
  standalone: true
})
export class FormLabelPipe implements PipeTransform {
  
  /**
   * Transforma el control del formulario en una etiqueta visible
   * @param control - AbstractControl del formulario
   * @param originalLabel - Etiqueta original del campo
   * @returns Etiqueta dinamica o "Sin completar"
   */
  transform(control: AbstractControl | null | undefined, originalLabel: string): string {
    if (!control) {
      return originalLabel;
    }

    const value = control.value;
    
    // Si el valor está vacío, null, undefined o es solo espacios en blanco
    const isEmpty = !value || (typeof value === 'string' && value.trim().length === 0);
    
    return isEmpty ? 'Sin completar' : originalLabel;
  }
}
