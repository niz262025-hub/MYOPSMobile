export function base64url(bytes: Uint8Array): string {
  const binary = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join('');

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getRandomBytes(length: number): Uint8Array {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buffer = new Uint8Array(length);
    globalThis.crypto.getRandomValues(buffer);
    return buffer;
  }

  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function createVerifier(): string {
  return base64url(getRandomBytes(32));
}

export async function createChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function createState(): string {
  return base64url(getRandomBytes(32));
}
