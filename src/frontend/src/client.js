import { LocalClientNotInitializedError } from "./errors.js"
import { apiConnector } from "./apiConnector.js";

const PRIVATE_CERTIFICATE_KEY = "drop.privateCertificate"
const PUBLIC_CERTIFICATE_KEY = "drop.publicCertificate"
const ALIAS_KEY = "drop.alias"

export function loadLocalClient() {
  const privateCertificate = localStorage.getItem(PRIVATE_CERTIFICATE_KEY)
  const publicCertificate = localStorage.getItem(PUBLIC_CERTIFICATE_KEY)
  const alias = localStorage.getItem(ALIAS_KEY)
  if (!privateCertificate || !publicCertificate || !alias) {
    return null
  }
  return createClient(privateCertificate, publicCertificate, alias)
}

export async function registerAsClientAsync() {
  const connector = apiConnector()
  const publicCertificate = "My certificate"
  const privateCertificate = "Private cert"
  const alias = await connector.createClientAsync(publicCertificate)
  const client = createClient(privateCertificate, publicCertificate, alias)
  client.save()
  return client
}

export function createClient(privateCertificate, publicCertificate, alias) {
  function save() {
    localStorage.setItem(PRIVATE_CERTIFICATE_KEY, privateCertificate)
    localStorage.setItem(PUBLIC_CERTIFICATE_KEY, publicCertificate)
    localStorage.setItem(ALIAS_KEY, alias)
  }
  return {
    alias,
    publicCertificate,
    save
  }
}