import { decrypt, encrypt } from "./encryption.js"
import { createDropAsync, getDropsAsync } from "./apiConnector.js"
import { getClientAsync } from "./apiConnector.js"

export async function getDecryptedDropsAsync(client) {
  return getDropsAsync({ alias: client.alias, pass: client.pass })
    .then(drops => drops.map(drop => {
      const decryptedContent = decrypt(client.privateCertificate, drop.encrypted_key, drop.encrypted_text)
      return {
        fromAlias: drop.from_alias,
        decryptedContent
      }
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

export async function sendEncryptedDropAsync(fromAlias, toAlias, message) {
  const key = await getClientKeyAsync(toAlias)
  if (!key) {
    return
  }
  const cryptogram = encrypt(key.public_certificate, message)
  const drop = await createDropAsync({
    fromAlias,
    toAlias,
    encryptedKey: cryptogram.encryptedKey,
    encryptedContent: cryptogram.encryptedContent
  })
  return drop
}