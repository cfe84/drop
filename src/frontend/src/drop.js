import { createKeyPairAsync, decryptAsync, encryptAsync } from "./encryption.js"
import { createDropAsync, getDropsAsync } from "./apiConnector.js"
import { getClientAsync } from "./apiConnector.js"
import { saveSenderAlias } from "./cache.js"

export async function getDecryptedDropsAsync(client) {
  const drops = await getDropsAsync({ alias: client.alias, pass: client.pass })
  let res = []
  for (let drop of drops) {
    let key = drop.publicKey
    if (!key) {
      const sender = await getClientAsync(drop.fromAlias)
      saveSenderAlias(sender.alias)
      key = sender.publicKey
    }
    const decryptedContent = await decryptAsync(client.privateKey, key, drop.encryptedKey, drop.encryptedText)
    res.push({
      dropId: drop.dropId,
      deleteOnDisplay: drop.deleteOnDisplay,
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

export async function sendEncryptedDropAsync(client, toAliases, message, deleteOnDisplay, sendAnonymously, onStateChanged = (state) => { }) {
  onStateChanged("Getting public keys")
  const keysAndAliases = await Promise.all(toAliases.map(async (alias) => {
    const key = await getClientKeyAsync(alias)
    if (!key) {
      onStateChanged(`Key ${alias} doesn't exist`)
      return null
    }
    return {
      key: key.publicKey,
      alias
    }
  }))
  if (keysAndAliases.indexOf(null) >= 0) {
    return {
      result: "failure",
      error: "Key doesn't exist"
    }
  }
  let privateKey = client.privateKey
  let publicKey = undefined
  let fromAlias = client.alias
  if (sendAnonymously) {
    onStateChanged("Creating one time use key")
    const key = await createKeyPairAsync()
    privateKey = key.privateKey
    publicKey = key.publicKey
    fromAlias = "(anonymous)"
  }
  onStateChanged("Encrypting text")
  const cryptogram = await encryptAsync(keysAndAliases, privateKey, message)
  onStateChanged("Uploading drop")
  const drop = await createDropAsync({
    fromAlias,
    toAliases: cryptogram.encryptedKeys,
    encryptedContent: cryptogram.encryptedContent,
    publicKey,
    deleteOnDisplay
  })
  return {
    result: "success",
    drop
  }
}