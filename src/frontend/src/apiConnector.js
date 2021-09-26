export function apiConnector() {
  function sendQueryAsync(url, method = "GET", body = undefined, headers = {}) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.onreadystatechange = function () {
        if (this.readyState === 4) {
          const response = JSON.parse(this.responseText)
          if (response.result === "success") {
            resolve(response.data)
          } else {
            reject(response.error)
          }
        }
      }
      request.open(method, `http://localhost:8000/api/${url}`, true)
      Object.keys(headers).forEach(header => {
        console.log(`Header: ${header}`)
        request.setRequestHeader(header, headers[header])
      })
      if (body) {
        request.setRequestHeader("content-type", "application/json")
      }
      request.send(body ? JSON.stringify(body) : undefined)
    })
  }

  async function createClientAsync(publicKey) {
    const res = await sendQueryAsync("clients", "POST", {
      publicKey
    })
    const alias = res.alias
    return alias
  }

  return {
    createClientAsync
  }
}