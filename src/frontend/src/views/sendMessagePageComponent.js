import { html } from "../html.js"
import { header } from "./header.js"
import { sendEncryptedDropAsync } from "../drop.js"



export function sendMessagePageComponent({ client, onBack }) {

  const aliasInput = html`<input type="text" class="form-control" placeholder="Alias" aria-label="Alias" />`
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
        <p class="lead mb-4 pt-4">Recipient's alias:</p>
        <div class="input-group mb-3">
        ${aliasInput}
      </div>
        <p class="lead mb-4 pt-4">Your message:</p>
        <div class="input-group">
        ${messageInput}
      </div>
      <br/>
      ${statusSpan}
      ${btnSend}
      ${btnCancel}
    </div>
  </div>`
}