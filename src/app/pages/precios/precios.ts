import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './precios.html',
  styleUrl: './precios.css'
})
export class Precios {
  isYearly = false;

  plans = [
    {
      name: 'Profesional',
      monthlyPrice: '17.99€/mes',
      monthlyPriceNum: 17.99, 
      yearlyPrice: '215.00€/año',
      freeMonths: 2, 
      features: [
        '✔ Personalización completa del menú.',
        '✔ QR digitales ilimitados.',
        '✔ 20 QR para usar.',
        '✔ Modo idioma extra (añadir varios idiomas al menú).',
        '✔ Ayuda tu primera vez en tu primera carta.'
      ],
      isFeatured: true
    },
    {
      name: 'Básico',
      monthlyPrice: '9.99€/mes',
      monthlyPriceNum: 9.99, 
      yearlyPrice: '99.90€/año',
      freeMonths: 2, 
      features: [
        '✔ Personalización completa del menú.',
        '✔ QR digitales ilimitados.'
      ],
      isFeatured: false
    },
    {
      name: 'Premium',
      monthlyPrice: '29.99€/mes',
      monthlyPriceNum: 29.99, 
      yearlyPrice: '299.90€/año',
      freeMonths: 3, 
      features: [
        '✔ Personalización completa del menú.',
        '✔ QR digitales ilimitados.',
        '✔ 50 QR para usar.',
        '✔ Modo idioma extra (añadir varios idiomas al menú).',
        '✔ Ayuda tu primera vez en tu primera carta.',
        '✔ Revisión mensual del menú por un diseñador.',
        '✔ Consultoría de mejora del menú 1 vez al año.',
        '✔ Atención por Whatsapp personalizada.',
        '✔ Asesoría por videollamada o cita personal.'
      ],
      isFeatured: true
    }
  ];

  togglePricing(): void {
    this.isYearly = !this.isYearly;
    console.log('Toggle clicked:', this.isYearly, 'Active class should be:', this.isYearly ? 'added' : 'removed');
  }

  getCurrentPrice(plan: any): string {
    return this.isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  }

  // Nueva función para calcular el precio anual con descuento y el equivalente mensual
  getAnnualInfo(plan: any): { total: string, monthlyEquivalent: string, totalSavings: string } {
    // Cálculo: (Precio Mensual * (12 - Meses Gratis))
    const monthsPaid = 12 - plan.freeMonths; 
    const totalCost = (plan.monthlyPriceNum * monthsPaid); 

    // Costo total con formato de dos decimales
    const totalCostFormatted = totalCost.toFixed(2); 

    // Costo mensual equivalente (Costo total / 12)
    const monthlyEquivalent = (totalCost / 12).toFixed(2);

    // Ahorro total (Precio mensual * meses gratis)
    const totalSavings = (plan.monthlyPriceNum * plan.freeMonths).toFixed(2);

    return {
      total: `${totalCostFormatted}€`,
      monthlyEquivalent: `${monthlyEquivalent}€/mes`,
      totalSavings: `${totalSavings}€`
    };
  }
}