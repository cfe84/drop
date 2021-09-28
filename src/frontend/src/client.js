import { createClientAsync } from "./apiConnector.js";
import { createKeyPair, createPass } from "./encryption.js";

const PRIVATE_CERTIFICATE_KEY = "drop.privateCertificate"
const PUBLIC_CERTIFICATE_KEY = "drop.publicCertificate"
const ALIAS_KEY = "drop.alias"
const PASS_KEY = "drop.pass"

export function loadLocalClient() {
  const privateCertificate = localStorage.getItem(PRIVATE_CERTIFICATE_KEY)
  const publicCertificate = localStorage.getItem(PUBLIC_CERTIFICATE_KEY)
  const alias = localStorage.getItem(ALIAS_KEY)
  const pass = localStorage.getItem(PASS_KEY)
  if (!privateCertificate || !publicCertificate || !alias || !pass) {
    return null
  }
  return getClientObject(privateCertificate, publicCertificate, pass, alias)
}

export async function registerAsClientAsync() {
  const keyPair = createKeyPair()
  const pass = createPass()
  const publicCertificate = keyPair.publicKey
  const privateCertificate = keyPair.privateKey
  const alias = await createClientAsync(pass, publicCertificate)
  const client = getClientObject(privateCertificate, publicCertificate, pass, alias)
  client.save()
  return client
}

function getClientObject(privateCertificate, publicCertificate, pass, alias) {
  function save() {
    localStorage.setItem(PRIVATE_CERTIFICATE_KEY, privateCertificate)
    localStorage.setItem(PUBLIC_CERTIFICATE_KEY, publicCertificate)
    localStorage.setItem(ALIAS_KEY, alias)
    localStorage.setItem(PASS_KEY, pass)
  }
  return {
    alias,
    publicCertificate,
    privateCertificate,
    pass,
    save
  }
}

export function cleanClient() {
  localStorage.clear()
}