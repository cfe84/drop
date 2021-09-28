export function createKeyPair() {
  return {
    privateKey: "PRIVATE_KEY",
    publicKey: "PUBLIC_KEY"
  }
}

export function createPass() {
  const passLength = 120 + Math.random() * 10
  let req = ""
  for (let i = 0; i < passLength; i++) {
    req += String.fromCharCode(Math.ceil(Math.random() * 254))
  }
  return btoa(req)
}

export function createSingleUseKey() {
  return "CONTENT_ENCRYPTION_KEY"
}

export function encrypt(publicKey, content) {
  const encryptionKey = "ENCRYPTION_KEY"
  const encryptedKey = `EncryptKey(${publicKey}, ${encryptionKey})`
  const encryptedContent = `Encrypt(${encryptionKey}, ${content})`
  return {
    encryptedKey,
    encryptedContent
  }
}

export function decrypt(privateKey, encryptedKey, encryptedContent) {
  const encryptionKey = `DecriptKey(${privateKey}, ${encryptedKey})`
  const decryptedContent = `Decrypt(${encryptionKey}, ${encryptedContent})`
  return decryptedContent
}
