import { html } from './html.js';
import { loadLocalClient } from './client.js';
import { welcomePageComponent } from './welcomePageComponent.js';
import { homePageComponent } from './homePageComponent.js';
import { sendMessagePageComponent } from './sendMessagePageComponent.js';

function app() {
  let main = null

  function load(component) {
    console.log(component)
    if (main) {
      document.body.removeChild(main)
    }
    main = component
    document.body.appendChild(main)
  }

  function run() {
    const client = loadLocalClient()
    const sendMessagePage = sendMessagePageComponent({ onBack: () => run() })
    const homePage = homePageComponent({ client, onSendMessage: () => { load(sendMessagePage) } })
    const welcomePage = welcomePageComponent({ onRegistered: run, onSendMessage: () => load(sendMessagePage) })
    if (client) {
      load(homePage)
    } else {
      load(welcomePage)
    }
  }

  run()
}


window.onload = () => {
  app()
}
