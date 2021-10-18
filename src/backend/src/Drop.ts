export interface Drop {
  id: string,
  fromAlias: string,
  publicKey?: string,
  toAlias: string,
  encryptedKey: string,
  cypherId: string,
  deleteOnDisplay: boolean,
}