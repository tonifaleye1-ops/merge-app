/**
 * Placeholder for API key encryption at rest. `api_keys.encrypted_key` is
 * currently stored and read back as plain text. Swap the bodies of these
 * two functions for real encryption (e.g. envelope encryption via a KMS)
 * — every caller already goes through here, so nothing else needs to
 * change.
 */
export function encryptApiKey(rawKey: string): string {
  return rawKey;
}

export function decryptApiKey(encryptedKey: string): string {
  return encryptedKey;
}
