export class ApiConnector {
  sendQueryAsync(url, method = "GET", headers = {}, body = undefined) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.onreadystatechange = function () {
        if (this.readyState === 4) {
          const response = JSON.parse(this.responseText)
          return response
        }
      }
      Object.keys(headers).forEach(header => {
        request.setRequestHeader(header, headers[header])
      })
      request.open(method, `http://localhost:8000/api/v1.0/${url}`, true)
      request.send(body)
    })
  }
}