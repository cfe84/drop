import { createKeyPairAsync, decryptAsync, encryptAsync } from "./encryption.js"
import { createDropAsync, getDropsAsync } from "./apiConnector.js"
import { saveSenderAlias } from "./cache.js"
import { getClientPublicKeyAsync } from "./client.js"

export async function decryptDropAsync(client, drop) {
  let key = drop.publicKey
  if (!key) {
    const publicKey = await getClientPublicKeyAsync(drop.fromAlias)
    saveSenderAlias(drop.fromAlias)
    key = publicKey
  }
  const decryptedContent = await decryptAsync(client.privateKey, key, drop.encryptedKey, drop.encryptedText)
  return {
    dropId: drop.dropId,
    deleteOnDisplay: drop.deleteOnDisplay,
    fromAlias: drop.fromAlias,
    decryptedContent
  }
}

export async function getDecryptedDropsAsync(client) {
  const drops = await getDropsAsync({ alias: client.alias, pass: client.pass })
  let res = []
  for (let drop of drops) {
    const decryptedDrop = await decryptDropAsync(client, drop)
    res.push(decryptedDrop)
  }
  return res
}

export async function sendEncryptedDropAsync(client, toAliases, message, deleteOnDisplay, sendAnonymously, onStateChanged = (state) => { }) {
  onStateChanged("Getting public keys")
  const keysAndAliases = await Promise.all(toAliases.map(async (alias) => {
    const key = await getClientPublicKeyAsync(alias)
    if (!key) {
      onStateChanged(`Key ${alias} doesn't exist`)
      return null
    }
    saveSenderAlias(alias)
    return {
      key,
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
  try {
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
  } catch (err) {
    return {
      result: "failed",
      error: err
    }
  }

}