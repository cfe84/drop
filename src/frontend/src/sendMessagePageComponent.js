import { html } from "./html.js"
import { header } from "./header.js"
import { sendEncryptedDropAsync } from "./drop.js"



export function sendMessagePageComponent({ client, onBack }) {

  const aliasInput = html`<input type="text" class="form-control" placeholder="Alias" aria-label="Alias" aria-describedby="basic-addon1" />`
  const messageInput = html`<textarea class="form-control" rows="5" aria-label="With textarea"></textarea>`

  const sendMessage = () => {
    const toAlias = aliasInput.value
    const message = messageInput.value
    sendEncryptedDropAsync(client, toAlias, message).then(() => { onBack() })
  }

  return html`
  <div class="px-4 py-5 my-5 text-center container">
    ${header("Send message")}
    <div class="col-md-7 mx-auto ">
      <div class="input-group mb-3">
        <span class="input-group-text" id="basic-addon1">Alias</span>
        ${aliasInput}
      </div>
      <div class="input-group">
        <span class="input-group-text">Message</span>
        ${messageInput}
      </div>
      <br/>
      <button type="button" onclick=${sendMessage} class="btn btn-primary mb-3">Send</button>
      <span>  </span>
      <button type="button" onclick=${onBack} class="btn btn-outline-secondary mb-3">Cancel</button>
    </div>
  </div>`
}