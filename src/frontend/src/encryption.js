const subtle = window.crypto.subtle
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const toB64 = btoa
const fromB64 = atob

async function serializeKeyAsync(key) {
  const exp = await subtle.exportKey("jwk", key)
  return toB64(JSON.stringify(exp))
}

async function deserializeKeyAsync(key) {
  const object = JSON.parse(fromB64(key))
  return object
}

export async function createKeyPairAsync() {
  const key = await subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256", //can be "P-256", "P-384", or "P-521"
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["deriveKey", "deriveBits"] //can be any combination of "deriveKey" and "deriveBits"
  )

  return Promise.resolve({
    privateKey: await serializeKeyAsync(key.privateKey),
    publicKey: await serializeKeyAsync(key.publicKey)
  })
}

export function createPass() {
  const passLength = Math.ceil(120 + Math.random() * 10)
  const array = window.crypto.getRandomValues(new Uint32Array(passLength));
  return toB64(array)
}

const AES_KEY_LENGTH = 256
const AES_TAG_LENGTH = 128
const AES_IV_LENGTH = 12

async function createSingleUseKeyAsync() {
  const key = await subtle.generateKey({
    name: "AES-GCM",
    length: AES_KEY_LENGTH,
  },
    true,
    ["encrypt", "decrypt"])
  return key
}
export async function encryptAsync(theirPublicKey, myPrivateKey, content) {
  const bytes = encoder.encode(content)

  const encryptionKey = await createSingleUseKeyAsync()
  const serializedKey = await serializeKeyAsync(encryptionKey)

  const iv = window.crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH))
  const encrypted = await subtle.encrypt({ name: "AES-GCM", tagLength: AES_TAG_LENGTH, iv }, encryptionKey, bytes)
  const encryptedContent = new Uint8Array(encrypted).join("|")
  const encodedIv = iv.join("|")
  const serializedContent = encryptedContent + "," + encodedIv

  const encryptedKey = serializedKey // Todo encrypt the key
  return {
    encryptedKey,
    encryptedContent: serializedContent
  }
}

export async function decryptAsync(myPrivateKey, theirPublicKey, encryptedKey, serializedContent) {
  const deserializedKey = await deserializeKeyAsync(encryptedKey)
  const encryptionKey = await subtle.importKey("jwk", deserializedKey, { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
  const splat = serializedContent.split(",")
  const encryptedContent = splat[0]
  const encodedIv = splat[1]
  const iv = new Uint8Array(encodedIv.split("|"))
  const encryptedBuffer = new Uint8Array(encryptedContent.split("|").map(e => Number.parseInt(e)))
  const decrypted = await subtle.decrypt({ name: "AES-GCM", tagLength: AES_TAG_LENGTH, iv }, encryptionKey, encryptedBuffer)
  const decryptedContent = decoder.decode(decrypted)
  return decryptedContent
}