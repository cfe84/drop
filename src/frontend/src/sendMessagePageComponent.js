import { html } from "./html.js"
import { header } from "./header.js"
import { sendEncryptedDropAsync } from "./drop.js"
import { cleanClient } from "./client.js"



export function sendMessagePageComponent({ client, onBack }) {

  const aliasInput = html`<input type="text" class="form-control" placeholder="Alias" aria-label="Alias" aria-describedby="basic-addon1" />`
  const messageInput = html`<textarea class="form-control" rows="5" aria-label="With textarea"></textarea>`
  const statusSpan = html`<div></div>`

  const setState = (enabled) => {
    btnCancel.disabled = !enabled
    btnSend.disabled = !enabled
    aliasInput.disabled = !enabled
    messageInput.disabled = !enabled
  }

  const clean = () => {
    aliasInput.value = ""
    messageInput.value = ""
    statusSpan.innerHTML = ""
  }

  const sendMessage = () => {
    setState(false)
    const toAlias = aliasInput.value
    const message = messageInput.value
    sendEncryptedDropAsync(client, toAlias, message, (status) => statusSpan.innerHTML = status).then((res) => {
      setState(true)
      if (res.result === "success") {
        clean()
        onBack()
      }
    })
  }

  const cancel = () => {
    clean()
    onBack()
  }

  const btnSend = html`<button type="button" onclick=${sendMessage} class="btn btn-primary mb-3">Send</button>`
  const btnCancel = html`<button type="button" onclick=${cancel} class="btn btn-outline-secondary mb-3">Cancel</button>`

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
      ${statusSpan}
      ${btnSend}
      ${btnCancel}
    </div>
  </div>`
}