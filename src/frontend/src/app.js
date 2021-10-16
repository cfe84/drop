import { loadLocalClient } from './client.js';
import { welcomePageComponent } from './welcomePageComponent.js';
import { homePageComponent } from './homePageComponent.js';
import { sendMessagePageComponent } from './sendMessagePageComponent.js';

function app() {
  let main = null

  function load(component) {
    if (main) {
      document.body.removeChild(main)
    }
    main = component
    document.body.appendChild(main)
  }

  function run() {
    const client = loadLocalClient()
    if (client) {
      const homePage = homePageComponent({
        client, onSendMessage: () => {
          const sendMessagePage = sendMessagePageComponent({ client, onBack: run })
          load(sendMessagePage)
        }, onDeregistered: run
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
