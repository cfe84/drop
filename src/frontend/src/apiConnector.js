function sendQueryAsync(url, method = "GET", body = undefined, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        try {
          const response = JSON.parse(this.responseText)
          if (response.result === "success") {
            resolve(response.data)
          } else {
            reject(Error(response.error))
          }
        } catch (err) {
          reject(Error(this.responseText))
        }
      }
    }
    request.open(method, `/api/${url}`, true)
    Object.keys(headers).forEach(header => {
      request.setRequestHeader(header, headers[header])
    })
    if (body) {
      request.setRequestHeader("content-type", "application/json")
    }
    request.send(body ? JSON.stringify(body) : undefined)
  })
}

export async function createClientAsync(pass, publicKey) {
  const res = await sendQueryAsync("clients", "POST", {
    publicKey,
    pass
  })
  const alias = res.alias
  return alias
}

export async function getAliasAsync(alias) {
  const client = await sendQueryAsync(`alias`, "GET")
  return client
}

export async function getClientAsync(alias) {
  const client = await sendQueryAsync(`clients/${alias}`, "GET")
  return client
}

export async function createDropAsync({ fromAlias, toAliases, deleteOnDisplay, encryptedContent }) {
  const dropContent = {
    fromAlias: fromAlias,
    encryptedText: encryptedContent,
    toAliases, // {alias, encryptedText}
    deleteOnDisplay
  }
  const drop = await sendQueryAsync(`drops`, "POST", dropContent)
  return drop
}

export async function getDropsAsync({ alias, pass }) {
  const drops = await sendQueryAsync(`clients/${alias}/drops`, "GET", undefined, {
    authorization: `Password ${pass}`
  })
  return drops
}

export async function deleteDropAsync({ alias, pass, dropId }) {
  await sendQueryAsync(`clients/${alias}/drops/${dropId}`, "DELETE", undefined, {
    authorization: `Password ${pass}`
  })
}