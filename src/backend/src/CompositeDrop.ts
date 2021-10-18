export interface CompositeDrop {
  dropId: string,
  fromAlias: string,
  encryptedKey: string,
  encryptedText: string,
  publicKey?: string,
  createdDate: Date,
  deleteOnDisplay: boolean
}