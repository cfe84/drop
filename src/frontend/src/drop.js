import { decryptAsync, encryptAsync } from "./encryption.js"
import { createDropAsync, getDropsAsync } from "./apiConnector.js"
import { getClientAsync } from "./apiConnector.js"

export async function getDecryptedDropsAsync(client) {
  const drops = await getDropsAsync({ alias: client.alias, pass: client.pass })
  let res = []
  for (let drop of drops) {
    const sender = await getClientAsync(drop.fromAlias)
    const decryptedContent = await decryptAsync(client.privateKey, sender.publicKey, drop.encryptedKey, drop.encryptedText)
    res.push({
      fromAlias: drop.fromAlias,
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

  }
}

export async function sendEncryptedDropAsync(client, toAlias, message, onStateChanged = (state) => { }) {
  onStateChanged("Getting public key")
  const key = await getClientKeyAsync(toAlias)
  if (!key) {
    onStateChanged("Key doesn't exist")
    return {
      result: "failure",
      error: "Key doesn't exist"
    }
  }
  onStateChanged("Encrypting text")
  const cryptogram = await encryptAsync(key.publicKey, client.privateKey, message)
  onStateChanged("Uploading drop")
  const drop = await createDropAsync({
    fromAlias: client.alias,
    toAlias,
    encryptedKey: cryptogram.encryptedKey,
    encryptedContent: cryptogram.encryptedContent
  })
  return {
    result: "success",
    drop
  }
}