// Client-side encryption utilities using Web Crypto API
const SALT_ROUNDS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

async function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: SALT_ROUNDS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function encodeBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function decodeBase64(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function encrypt(plaintext, passphrase) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(passphrase, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const encryptedArray = new Uint8Array(encrypted);
  const authTag = encryptedArray.slice(-16);
  const ciphertext = encryptedArray.slice(0, -16);

  return {
    encryptedContent: encodeBase64(ciphertext),
    iv: encodeBase64(iv),
    authTag: encodeBase64(authTag),
    salt: encodeBase64(salt),
  };
}

async function decrypt(encryptedContent, iv, authTag, salt, passphrase) {
  const key = await deriveKey(passphrase, decodeBase64(salt));
  const decoder = new TextDecoder();

  let ciphertext = decodeBase64(encryptedContent);
  const authTagBytes = decodeBase64(authTag);
  const encryptedBytes = new Uint8Array(ciphertext.length + authTagBytes.length);
  encryptedBytes.set(ciphertext, 0);
  encryptedBytes.set(authTagBytes, ciphertext.length);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: decodeBase64(iv) },
      key,
      encryptedBytes
    );
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error("Incorrect passphrase or corrupted secret.");
  }
}

export { encrypt, decrypt };