import { decryptAsync, encryptAsync } from "./encryption.js"
import { createDropAsync, getDropsAsync } from "./apiConnector.js"
import { getClientAsync } from "./apiConnector.js"

export async function getDecryptedDropsAsync(client) {
  const drops = await getDropsAsync({ alias: client.alias, pass: client.pass })
  let res = []
  for (let drop of drops) {
    const sender = await getClientAsync(drop.from_alias)
    const decryptedContent = await decryptAsync(client.privateCertificate, sender.public_certificate, drop.encrypted_key, drop.encrypted_text)
    res.push({
      fromAlias: drop.from_alias,
      decryptedContent
    })
  }
  return res
}

async function getClientKeyAsync(alias) {
  try {
    const key = await getClientAsync(alias)
    return key
  } catch (err) {
    alert(err.message)
  }
}

export async function sendEncryptedDropAsync(client, toAlias, message) {
  const key = await getClientKeyAsync(toAlias)
  if (!key) {
    return
  }
  const cryptogram = await encryptAsync(key.public_certificate, client.privateKey, message)
  const drop = await createDropAsync({
    fromAlias: client.alias,
    toAlias,
    encryptedKey: cryptogram.encryptedKey,
    encryptedContent: cryptogram.encryptedContent
  })
  return drop
}