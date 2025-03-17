import { loadLocalClient, registerAsClientAsync } from './client.js';
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

  function getSendToParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sendTo');
  }

  async function run() {
    let client = loadLocalClient();
    if (!client) {
      await registerAsClientAsync();
      client = loadLocalClient();
    }

    const socket = connectSocket(client.alias, client.pass);
    const onSendMessage = (sendTo = "") => {
      const sendMessagePage = sendMessagePageComponent({
        client,
        sendTo,
        onBack: () => {
          load(homePage)
        }
      })
      load(sendMessagePage)
    };
    const homePage = homePageComponent({
      client,
      onSendMessage,
      onDeregistered: run,
      socket
    });
    const sendTo = getSendToParameter();
    if (sendTo) {
      onSendMessage(sendTo);
    } else {
      load(homePage);
    }
  }

  run().then();
}


window.onload = () => {
  app()
}
