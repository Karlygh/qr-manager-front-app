export const BUSINESS_CREATION_CONSTANTS = {
  FORM_LABELS: {
    BUSINESS_NAME: 'Nombre del Negocio',
    DESCRIPTION: 'Una breve descripción',
    EMAIL: 'Email Principal',
    PHONE: 'Teléfono',
    ADDRESS: 'Dirección',
    LOGO: 'Logo del Negocio'
  },

  ERROR_MESSAGES: {
    REQUIRED_FIELD: 'Este campo es obligatorio.',
    MIN_LENGTH_NAME: 'Debe tener al menos 3 caracteres.',
    MIN_LENGTH_DESC: 'La descripción debe tener al menos 5 caracteres.',
    INVALID_EMAIL: 'Debe ser un email con formato válido.',
    INVALID_PHONE: 'El teléfono debe tener exactamente 9 dígitos numéricos.',
    FILE_TOO_LARGE: 'El archivo no debe exceder 5MB.',
    INVALID_FILE_TYPE: 'Solo se permiten imágenes (JPG, PNG, GIF, WebP).',
    UNKNOWN_ERROR: 'Error desconocido al crear el negocio.'
  },

  FILE_UPLOAD: {
    MAX_SIZE_MB: 5,
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },

  PHONE_REGEX: /^[0-9]{9}$/,

  MESSAGES: {
    NETWORK_ERROR: 'Error de conexión. Por favor, intenta nuevamente.',
    BAD_REQUEST: 'Revisa que todos los campos y formatos sean correctos.',
    SUCCESS_TITLE: '¡Negocio creado con éxito!',
    SUCCESS_SUBTITLE: 'Estamos preparando tu panel de control.',
    REDIRECT_SUBTITLE: 'Serás redirigido en unos segundos...'
  },

  REDIRECT_DELAY_MS: 2500
};
