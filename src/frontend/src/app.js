import { loadLocalClient } from './client.js';
import { welcomePageComponent } from './views/welcomePageComponent.js';
import { homePageComponent } from './views/homePageComponent.js';
import { sendMessagePageComponent } from './views/sendMessagePageComponent.js';
import { connectSocket } from './socket.js';

function app() {
  const container = document.getElementById("container")
  let main = null

  function load(component) {
    if (main) {
      container.removeChild(main)
    }
    main = component
    container.appendChild(main)
  }

  function run() {
    const client = loadLocalClient()

    if (client) {
      const socket = connectSocket(client.alias, client.pass)
      const homePage = homePageComponent({
        client,
        onSendMessage: () => {
          const sendMessagePage = sendMessagePageComponent({
            client,
            onBack: () => {
              load(homePage)
            }
          })
          load(sendMessagePage)
        },
        onDeregistered: run,
        socket
      })
      load(homePage)
    } else {
      const welcomePage = welcomePageComponent({ onRegistered: run })
      load(welcomePage)
    }
  }

  run()
}


window.onload = () => {
  app()
}
