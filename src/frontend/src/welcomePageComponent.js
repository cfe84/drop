import { html } from "./html.js"
import { registerAsClientAsync } from "./client.js"

export function welcomePageComponent({ onRegistered, onSendMessage }) {


  function onRegisterClick() {
    registerAsClientAsync().then((client) => { onRegistered(client) })
  }

  return html`<div class="px-4 py-5 my-5 text-center">
    <img class="d-block mx-auto mb-4" src="/style/img/logo_medium.png" alt="Drop logo" />
    <h1 class="display-5 fw-bold">Drop</h1>
    <div class="col-lg-6 mx-auto">
      <p class="lead mb-4">Drop is an encrypted and anonymous dead-drop. Go ahead and register this
      browser as a new Drop client, and give your alias to anyone for them to securely send you
      messages anonymously. Registering is a simple click of a button. We don't ask any questions.
      You can also just send an encrypted message to someone by using their alias.</p>
      <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
        <button type="button" onclick=${onRegisterClick} class="btn btn-primary btn-lg px-4 gap-3">Register as client</button>
        <button type="button" disabled onclick=${onSendMessage} class="btn btn-outline-secondary btn-lg px-4">Send message</button>
      </div>
    </div>
  </div>`
}