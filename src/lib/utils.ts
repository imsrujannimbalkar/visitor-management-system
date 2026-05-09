
/**
 * Recursively removes all undefined values from an object or array.
 * Useful for sanitizing data before sending it to Firestore.
 */
export const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  const sanitized: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      sanitized[key] = (typeof value === 'object' && value !== null && !(value instanceof Date))
        ? sanitizeForFirestore(value)
        : value;
    }
  });

  return sanitized;
};
