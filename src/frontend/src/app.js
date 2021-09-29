import { html } from './html.js';
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

  function loader(component) {
    return () => load(component)
  }

  function run() {
    const client = loadLocalClient()
    if (client) {
      const sendMessagePage = sendMessagePageComponent({ fromAlias: client.alias, onBack: run })
      const homePage = homePageComponent({ client, onSendMessage: loader(sendMessagePage), onDeregistered: run })
      load(homePage)
    } else {
      const welcomePage = welcomePageComponent({ onRegistered: run, onSendMessage: loader(sendMessagePageComponent({ fromAlias: "(anonymous)", onBack: run })) })
      load(welcomePage)
    }
  }

  run()
}


window.onload = () => {
  app()
}
