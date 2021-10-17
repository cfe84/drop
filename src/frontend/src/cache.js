const SENDERS_CACHE_KEY = "drop.cache.senders"

export function saveSenderAlias(alias) {
  let senders = getSendersAliases()
  if (senders.indexOf(alias) >= 0) {
    return
  }
  senders.push(alias)
  senders = senders.sort()
  localStorage.setItem(SENDERS_CACHE_KEY, JSON.stringify(senders))
}

export function getSendersAliases() {
  let senders = localStorage.getItem(SENDERS_CACHE_KEY)
  if (!senders) {
    return []
  } else {
    return JSON.parse(senders)
  }
}