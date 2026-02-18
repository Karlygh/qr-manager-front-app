import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaqItem, FeatureItem } from '../../../../shared/models/faq.model';

@Component({
  selector: 'app-preguntas-frecuentes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preguntas-frecuentes.html',
  styleUrl: './preguntas-frecuentes.css'
})
export class PreguntasFrecuentes {

  faqs: FaqItem[] = [
    {
      question: '¿Puedo cancelar cuando quiera?',
      answer: 'Sí, tienes la libertad de cancelar tu suscripción en cualquier momento sin ningún tipo de penalización ni cargos adicionales. Al cancelar, tu acceso a los beneficios y funcionalidades de tu plan continuará hasta el final del período de facturación ya pagado, garantizando transparencia y seguridad. Nos comprometemos a que el proceso de cancelación sea rápido, sencillo y totalmente libre de complicaciones, para que tengas el control absoluto sobre tu suscripción en todo momento.'
    },
    {
      question: '¿Cómo funciona la facturación anual?',
      answer: 'La facturación anual te permite pagar un único monto por todo el año, lo que simplifica la gestión de tu suscripción y evita pagos mensuales repetidos. Además, al elegir el plan anual, obtienes meses adicionales sin coste, según la oferta vigente de tu plan, lo que maximiza el valor de tu inversión. Esta modalidad está diseñada para ofrecerte mayor comodidad, previsibilidad en los pagos y beneficios adicionales, garantizando que puedas disfrutar de nuestros servicios durante todo el año sin interrupciones.'
    },
    {
      question: '¿Puedo cambiar de plan más adelante?',
      answer: 'Sí, puedes subir o bajar de plan cuando lo necesites.'
    },
    {
      question: '¿El soporte está incluido en todos los planes?',
      answer: 'Sí, todos nuestros planes incluyen acceso al soporte técnico y de atención al cliente, garantizando que siempre tengas ayuda disponible cuando la necesites. La velocidad y prioridad de respuesta varían según el nivel de plan que hayas elegido, asegurando que cada usuario reciba un servicio adecuado a sus necesidades. Nuestro equipo de especialistas está preparado para resolver cualquier duda, incidencia o consulta de manera eficiente, brindando una experiencia fluida y confiable para que puedas aprovechar al máximo todos los beneficios de tu suscripción.'
    }
  ];

  whyUs: FeatureItem[] = [
    {
      title: 'Seguridad Garantizada',
      description: 'Protegemos tus datos con estándares de nivel empresarial.',
      detail: 'Utilizamos cifrado avanzado, auditorías continuas y protocolos internacionales para asegurar la integridad y privacidad de tu información.'
    },
    {
      title: 'Soporte 24/7',
      description: 'Un equipo listo para ayudarte en cualquier momento.',
      detail: 'Nuestro equipo de expertos está disponible por chat, correo y ticket para resolver cualquier duda o incidencia con rapidez.'
    },
    {
      title: 'Actualizaciones Constantes',
      description: 'Mejoras y nuevas funciones añadidas de forma continua.',
      detail: 'Implementamos nuevas características y mejoras de rendimiento regularmente para mantener tu experiencia siempre al máximo nivel.'
    }
  ];

  guarantees: FeatureItem[] = [
    {
      title: '14 días de reembolso',
      description: 'Si no quedas satisfecho, te devolvemos tu dinero.',
      detail: 'Durante los primeros 14 días puedes solicitar un reembolso completo sin preguntas. Queremos que te sientas totalmente seguro con tu inversión.'
    },
    {
      title: 'Pagos Seguros',
      description: 'Procesamos a través de plataformas certificadas.',
      detail: 'Todas las transacciones son procesadas mediante proveedores auditados y certificados en estándares internacionales de seguridad.'
    },
    {
      title: 'Sin cargos ocultos',
      description: 'Transparencia total en todos nuestros precios.',
      detail: 'No aplicamos cargos sorpresa ni incrementos inesperados. Siempre sabrás exactamente cuánto pagas.'
    }
  ];

}