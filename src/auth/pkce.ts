import * as Crypto from 'expo-crypto';
import { encode as base64Encode } from 'base64-arraybuffer';

export function base64url(bytes: Uint8Array): string {
  return base64Encode(bytes.buffer as ArrayBuffer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function createVerifier(): string {
  return base64url(Crypto.getRandomBytes(32));
}

export async function createChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function createState(): string {
  return base64url(Crypto.getRandomBytes(32));
}
