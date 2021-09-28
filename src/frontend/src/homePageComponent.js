import { html } from "./html.js"
import { cleanClient } from "./client.js"
import { getDecryptedDropsAsync } from "./drop.js"

export function homePageComponent({ client, onSendMessage, onDeregistered }) {
  function onDeregisterConfirm() {
    if (confirm(`This will destroy your alias for ever! Are you sure?`)) {
      cleanClient()
      onDeregistered()
    }
  }

  function send() {
    onSendMessage()
  }

  const list = html`<div></div>`


  getDecryptedDropsAsync(client).then(drops => {
    list.childNodes.forEach(c => list.removeChild(c))
    drops.forEach(drop => {
      list.appendChild(html`<div>${drop}</div>`)
    })
  })

  return html`<div class="px-4 py-5 my-5 text-center">
    <img class="d-block mx-auto mb-4" src="/style/img/logo_medium.png" alt="Drop logo" />
    <h1 class="display-5 fw-bold">Drop</h1>
    <em>Your alias: ${client.alias}</em>
    <div class="col-lg-6 mx-auto">
      <p class="lead mb-4">Your messages:</p>
      ${list}
      <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
        <button type="button" onclick=${() => { send() }} class="btn btn-primary btn-lg px-4 gap-3">Send a message</button>
        <button type="button" onclick=${onDeregisterConfirm} class="btn btn-outline-danger btn-lg px-4 gap-3">De-register</button>
      </div>
    </div>
  </div>`
}