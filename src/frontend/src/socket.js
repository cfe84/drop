function tryConnect(alias, pass, obj) {
  let shouldReconnect = true
  console.log(`Attempt reconnecting to websocket...`)
  const url = window.location.href.replace(/http?/, "ws")
  try {
    const socket = new WebSocket(url)
    socket.onmessage = ((msg) => {
      if (obj.ondrop) {
        obj.ondrop(JSON.parse(msg.data))
      }
    })
    obj.disconnect = () => {
      console.log(`Disconnecting socket`)
      shouldReconnect = false
      socket.close()
    }
    socket.onopen = () => {
      console.log(`Socket got connected`)
      socket.send(JSON.stringify({ alias, pass }))
    }
    socket.onclose = () => {
      console.log(`Socket got disconnected`)
      if (shouldReconnect) {
        setTimeout(() => {
          tryConnect(alias, pass, obj)
        }, 2500)
      }
    }
  } catch (err) {
    console.log(`Failed connecting: ${err.message}`)
  }

}

export function connectSocket(alias, pass) {
  const obj = {
    ondrop: () => { },
    disconnect: () => { }
  }

  tryConnect(alias, pass, obj)

  return obj
}