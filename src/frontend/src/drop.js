import { decrypt, encrypt } from "./encryption.js"
import { createDropAsync, getDropsAsync } from "./apiConnector.js"

export async function getDecryptedDropsAsync(client) {
  return getDropsAsync({ alias: client.alias, pass: client.pass })
    .then(drops => drops.map(drop => {
      const decryptedContent = decrypt(client.privateCertificate, drop.encrypted_key, drop.encrypted_text)
      return decryptedContent
    }))
}

async function getClientKeyAsync(alias) {
  try {
    const key = await getClientAsync(alias)
    return key
  } catch (err) {
    alert(err.message)
  }
}

export async function sendEncryptedDropAsync(alias, message) {
  const key = await getClientKeyAsync(alias)
  if (!key) {
    return
  }
  const cryptogram = encrypt(key.public_certificate, message)
  const drop = await createDropAsync({
    alias,
    encryptedKey: cryptogram.encryptedKey,
    encryptedContent: cryptogram.encryptedContent
  })
  return drop
}