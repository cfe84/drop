import { createClientAsync, getClientAsync } from "./apiConnector.js";
import { createKeyPairAsync, createPass } from "./encryption.js";

const PRIVATE_KEY_KEY = "drop.privateKey"
const PUBLIC_KEY_KEY = "drop.publicKey"
const ALIAS_KEY = "drop.alias"
const PASS_KEY = "drop.pass"
const CLIENT = "drop.client"

export function loadLocalClient() {
  const privateKey = localStorage.getItem(PRIVATE_KEY_KEY)
  const publicKey = localStorage.getItem(PUBLIC_KEY_KEY)
  const alias = localStorage.getItem(ALIAS_KEY)
  const pass = localStorage.getItem(PASS_KEY)
  if (!privateKey || !publicKey || !alias || !pass) {
    return null
  }
  return getClientObject(privateKey, publicKey, pass, alias)
}

export async function registerAsClientAsync() {
  const keyPair = await createKeyPairAsync()
  const pass = createPass()
  const publicKey = keyPair.publicKey
  const privateKey = keyPair.privateKey
  const alias = await createClientAsync(pass, publicKey)
  const client = getClientObject(privateKey, publicKey, pass, alias)
  client.save()
  return client
}

function getClientObject(privateKey, publicKey, pass, alias) {
  function save() {
    localStorage.setItem(PRIVATE_KEY_KEY, privateKey)
    localStorage.setItem(PUBLIC_KEY_KEY, publicKey)
    localStorage.setItem(ALIAS_KEY, alias)
    localStorage.setItem(PASS_KEY, pass)
  }
  return {
    alias,
    publicKey,
    privateKey,
    pass,
    save
  }
}

export function cleanClient() {
  localStorage.clear()
}

export async function getClientPublicKeyAsync(alias) {
  const storageKey = `${CLIENT}.${alias}.publicKey`
  let publicKey = localStorage.getItem(storageKey)
  if (!publicKey) {
    const client = await getClientAsync(alias)
    publicKey = client.publicKey
    localStorage.setItem(storageKey, publicKey)
  }
  return publicKey
}