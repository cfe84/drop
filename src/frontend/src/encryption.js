const subtle = window.crypto.subtle
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const toB64 = btoa
const fromB64 = atob

const UIntArrayToB64 = (arr) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let res = ""

  for (let i = 0; i < arr.length; i += 3) {
    const b1 = arr[i]
    const b2 = i + 1 < arr.length ? arr[i + 1] : 0
    const b3 = i + 2 < arr.length ? arr[i + 2] : 0
    const n1 = b1 >>> 2
    const n2 = ((b1 & 3) << 4) + (b2 >>> 4)
    const n3 = ((b2 & 15) << 2) + (b3 >>> 6)
    const n4 = b3 & 63
    const [c1, c2, c3, c4] = [
      chars[n1],
      chars[n2],
      i + 1 < arr.length ? chars[n3] : "=",
      i + 2 < arr.length ? chars[n4] : "="]
    res += `${c1}${c2}${c3}${c4}`
  }
  return res;
}

const b64ToUIntArray = (base64) => {
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i)
  }
  return array;
}

const AES_KEY_LENGTH = 256
const AES_TAG_LENGTH = 128
const AES_IV_LENGTH = 12

const EC_NAMED_CURVE = "P-521"

/**
 * Export key as JWK then serialize using b64
 * @param {CryptoKey} key 
 * @returns 
 */
async function serializeKeyAsync(key) {
  const exp = await subtle.exportKey("jwk", key)
  return toB64(JSON.stringify(exp))
}

/**
 * Deserialize using b64 then parse JSON. Note that this
 * doesn't import as CryptoKey
 * @param {B64 serialized jwk key} key 
 * @returns 
 */
async function deserializeKeyAsync(key) {
  const object = JSON.parse(fromB64(key))
  return object
}

/**
 * Deserialize an AES key
 * @param {Serialized key} key 
 * @returns Crypto key
 */
async function deserializeAESKeyAsync(key) {
  const deserializedKey = await deserializeKeyAsync(key)
  const res = await subtle.importKey(
    "jwk",
    deserializedKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"])
  return res
}

function isFirefox() {
  return navigator.userAgent.indexOf("Firefox") >= 0
}

/**
 * Deserialize a public or private ECDH key
 * @param {Serialized ECDH key, public or private} key 
 * @returns 
 */
async function deserializeECDHKeyAsync(key) {
  const deserializedKey = await deserializeKeyAsync(key)
  const key_ops = isFirefox() ? ["deriveKey"] : deserializedKey.key_ops
  deserializedKey.key_ops = key_ops
  const res = await subtle.importKey(
    "jwk",
    deserializedKey,
    { name: "ECDH", namedCurve: EC_NAMED_CURVE },
    false,
    key_ops)
  return res
}

/**
 * Create an ECDH key pair
 * @returns ECDH CryptoKey pair, exported to jwk and serialized as b64
 */
export async function createKeyPairAsync() {
  const key = await subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: EC_NAMED_CURVE, //can be "P-256", "P-384", or "P-521"
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["deriveKey"] //can be any combination of "deriveKey" and "deriveBits"
  )

  return Promise.resolve({
    privateKey: await serializeKeyAsync(key.privateKey),
    publicKey: await serializeKeyAsync(key.publicKey)
  })
}

/**
 * Create a password.
 * @returns Unique password, to be used to retrieve drops from backend
 */
export function createPass() {
  const passLength = Math.ceil(120 + Math.random() * 10)
  const array = window.crypto.getRandomValues(new Uint32Array(passLength));
  return UIntArrayToB64(array)
}

/**
 * Create a single use CEK (Content Encryption Key) meant to encrypt content
 * @returns AES CryptoKey
 */
async function createSingleUseCEKAsync() {
  const key = await subtle.generateKey({
    name: "AES-GCM",
    length: AES_KEY_LENGTH,
  },
    true,
    ["encrypt", "decrypt"])
  return key
}

/**
 * Encrypt content using AES and serialize it to string
 * @param {Content as string} content 
 * @param {AES CryptoKey, a single use one will be created and returned if omitted} encryptionKey 
 * @returns 
 */
async function encryptContentAsync(content, encryptionKey = null) {
  const bytes = encoder.encode(content)

  if (!encryptionKey) {
    encryptionKey = await createSingleUseCEKAsync()
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH))
  const encrypted = await subtle.encrypt({ name: "AES-GCM", tagLength: AES_TAG_LENGTH, iv }, encryptionKey, bytes)
  const array = new Uint8Array(encrypted)
  const encryptedContent = UIntArrayToB64(array)
  const encodedIv = UIntArrayToB64(iv)
  const serializedContent = encryptedContent + "," + encodedIv
  return {
    serializedContent,
    encryptionKey
  }
}

/**
 * Derive an AES encryption key from a public/private ECDH key pair. Meant
 * to be used as a Key-Encryption-Key.
 * @param {Public ECDH key serialized to b64-jwk} theirPublicKeySerialized 
 * @param {Private ECDH key serialized to b64-jwk} myPrivateKeySerialized 
 * @returns AES crypto key.
 */
async function deriveKek(theirPublicKeySerialized, myPrivateKeySerialized) {
  const myPrivateKey = await deserializeECDHKeyAsync(myPrivateKeySerialized)
  const theirPublicKey = await deserializeECDHKeyAsync(theirPublicKeySerialized)
  const kek = await subtle.deriveKey(
    {
      name: "ECDH",
      namedCurve: EC_NAMED_CURVE,
      public: theirPublicKey
    },
    myPrivateKey,
    {
      name: "AES-GCM",
      length: AES_KEY_LENGTH
    },
    true,
    ["encrypt", "decrypt"])
  return kek
}

/**
 * Encrypt AES key using the KEK derived from ECDH key pair
 * @param {Other party's public ECDH key, serialized as b64-jwk} theirPublicKeySerialized 
 * @param {My private ECDH key, serialized as b64-jwk} myPrivateKeySerialized 
 * @param {AES key used to encrypt content (CEK), that will be encrypted with the KEK} encryptedCEK 
 * @returns Encryption key encrypted with KEK and serialized to string
 */
async function encryptKeyAsync(theirPublicKeySerialized, myPrivateKeySerialized, encryptedCEK) {
  const kek = await deriveKek(theirPublicKeySerialized, myPrivateKeySerialized)
  const serializedEncryptionKey = await serializeKeyAsync(encryptedCEK)
  const { serializedContent } = await encryptContentAsync(serializedEncryptionKey, kek)
  return serializedContent
}

/**
 * Decrypt AES key that was encrypted with AES using KEK derived from ECDH key pair
 * @param {Other party's public ECDH key, serialized as b64-jwk} theirPublicKeySerialized 
 * @param {My private ECDH key, serialized as b64-jwk} myPrivateKeySerialized 
 * @param {AES CEK (content encryption key), encrypted with KEK} encryptedCEK 
 * @returns AES CryptoKey, that can be used to decrypt content
 */
async function decryptKeyAsync(theirPublicKeySerialized, myPrivateKeySerialized, encryptedCEK) {
  const kek = await deriveKek(theirPublicKeySerialized, myPrivateKeySerialized)
  const serializedKey = await decryptContentAsync(kek, encryptedCEK)
  const encryptionKey = await deserializeAESKeyAsync(serializedKey)
  return encryptionKey
}

/**
 * Decrypt content previously encrypted with AES and serialized to string
 * @param {AES CryptoKey used to encrypt content} contentEncryptionKey 
 * @param {content previously encrypted with AES and serialized to string} serializedContent 
 * @returns Clear content as string
 */
async function decryptContentAsync(contentEncryptionKey, serializedContent) {
  const splat = serializedContent.split(",")
  const encryptedContent = splat[0]
  const encodedIv = splat[1]
  const iv = b64ToUIntArray(encodedIv)
  const encryptedBuffer = b64ToUIntArray(encryptedContent)

  const decrypted = await subtle.decrypt({ name: "AES-GCM", tagLength: AES_TAG_LENGTH, iv }, contentEncryptionKey, encryptedBuffer)
  const decryptedContent = decoder.decode(decrypted)
  return decryptedContent
}

/**
 * Encrypts content in several steps:
 * 1) Generates a single use AES CEK (Content Encryption Key)
 * 2) Encrypt the content using the AES key
 * 3) Derive an AES KEK (Key Encryption Key) using an ECDH key pair: your private key and their public key
 * 4) Encrypt the CEK using the KEK
 * 5) Returns both the encrypted content and the encrypted CEK which can safely be transmitted online.
 * @param {ECDH public keys from remote party, serialized as b64-jwk, and as an array of {alias, key}} theirPublicKeysSerialized 
 * @param {Own ECDH private key, serialized as b64-jwk} myPrivateKeySerialized 
 * @param {String content to be encrypted} content 
 * @returns A pair containing the CEK encrypted with the KEK, and the Content encrypted with the CEK and serialized to string.
 */
export async function encryptAsync(theirPublicKeysSerialized, myPrivateKeySerialized, content) {
  const { serializedContent, encryptionKey } = await encryptContentAsync(content)
  const encryptedKeys = await Promise.all(theirPublicKeysSerialized.map(async (keyAndAlias) => {
    const key = await encryptKeyAsync(keyAndAlias.key, myPrivateKeySerialized, encryptionKey)
    return {
      alias: keyAndAlias.alias,
      encryptedKey: key
    }
  }))
  return {
    encryptedKeys,
    encryptedContent: serializedContent
  }
}

/**
 * Decrypt content previous encrypted using ECDH KEK.
 * @param {Own ECDH private key, serialized as b64-jwk} myPrivateKeySerialized 
 * @param {ECDH public key from remote party, serialized as b64-jwk} theirPublicKeySerialized 
 * @param {AES CEK encrypted with ECDH derived KEK} encryptedKey 
 * @param {Content encrypted with the CEK and serialized to string} serializedContent 
 * @returns Clear content
 */
export async function decryptAsync(myPrivateKeySerialized, theirPublicKeySerialized, encryptedKey, serializedContent) {
  const encryptionKey = await decryptKeyAsync(theirPublicKeySerialized, myPrivateKeySerialized, encryptedKey)
  const decryptedContent = await decryptContentAsync(encryptionKey, serializedContent)
  return decryptedContent
}