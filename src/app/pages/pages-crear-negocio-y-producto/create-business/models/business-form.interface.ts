export interface BusinessFormData {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  description: string;
}

export interface FileValidationError {
  type: 'SIZE' | 'TYPE' | 'EXTENSION';
  message: string;
}
