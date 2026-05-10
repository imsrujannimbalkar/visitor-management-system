/**
 * Simple client-side encryption utility for sensitive PII.
 * Note: For production use, a more robust Key Management System (KMS) is recommended.
 */

const ENCRYPTION_KEY_PREFIX = 'vms-key-';

/**
 * Gets or creates a local encryption key for the current organization.
 */
async function getOrgKey(orgId: string): Promise<CryptoKey> {
  const storageKey = `${ENCRYPTION_KEY_PREFIX}${orgId}`;
  const existingKey = localStorage.getItem(storageKey);
  
  if (existingKey) {
    const rawKey = Uint8Array.from(atob(existingKey), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'raw',
      rawKey,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exported = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem(storageKey, btoa(String.fromCharCode(...new Uint8Array(exported))));
  
  return key;
}

export async function encryptData(text: string, orgId: string): Promise<string> {
  if (!text) return '';
  try {
    const key = await getOrgKey(orgId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return text; // Fallback to plain text if crypto fails (not ideal, but prevents crash)
  }
}

export async function decryptData(encryptedBase64: string, orgId: string): Promise<string> {
  if (!encryptedBase64 || !encryptedBase64.includes('==')) return encryptedBase64; // Likely not encrypted
  try {
    const key = await getOrgKey(orgId);
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    // If decryption fails, it might be plain text or wrong key
    return encryptedBase64;
  }
}
