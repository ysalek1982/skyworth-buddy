/**
 * Serial Number Utilities
 * Normalización y validación de números de serie para TV Skyworth
 */

/**
 * Normaliza un número de serial removiendo guiones, espacios y convirtiéndolo a mayúsculas.
 * @example normalizeSerial("2540415M-00039") => "2540415M00039"
 * @example normalizeSerial(" 2540415M - 00039 ") => "2540415M00039"
 */
export function normalizeSerial(serial: string): string {
  return serial
    .trim()
    .replace(/-/g, '') // Remove all dashes
    .replace(/\s+/g, '') // Remove all spaces
    .toUpperCase();
}

/**
 * Valida el formato de un serial normalizado.
 * Solo permite letras A-Z y números 0-9.
 * NO valida longitud mínima/máxima.
 * @returns Object with isValid boolean and optional error message
 */
export function validateSerialFormat(serial: string): { isValid: boolean; error: string | null } {
  const normalized = normalizeSerial(serial);
  
  if (!normalized) {
    return { isValid: false, error: 'El serial es obligatorio.' };
  }

  // Check for invalid characters (anything not A-Z or 0-9)
  const invalidCharsMatch = normalized.match(/[^A-Z0-9]/g);
  if (invalidCharsMatch) {
    return { 
      isValid: false, 
      error: 'El serial solo debe contener letras y números (sin guiones ni espacios).' 
    };
  }

  return { isValid: true, error: null };
}

/**
 * Detecta si el usuario escribió el serial con guiones y devuelve un mensaje informativo.
 * Útil para mostrar retroalimentación antes de la validación completa.
 */
export function detectDashInSerial(serial: string): boolean {
  return serial.includes('-');
}

/**
 * Ejemplo de formato de serial para mostrar en la UI
 */
export const SERIAL_EXAMPLE = '2540415M00039';

/**
 * Ejemplo de serial con guión (como aparece en algunas etiquetas)
 */
export const SERIAL_EXAMPLE_WITH_DASH = '2540415M-00039';

/**
 * Ejemplo de modelo (para diferenciar del serial)
 */
export const MODEL_EXAMPLE = '65Q7500G';
