import { createElement, html } from "../html.js"
import { header } from "./header.js"
import { sendEncryptedDropAsync } from "../drop.js"
import { getSendersAliases } from "../cache.js"

export function sendMessagePageComponent({ client, onBack }) {
  const aliasInput = html`<input type="text" class="form-control" placeholder="Alias" aria-label="Alias" />`
  const messageInput = html`<textarea class="form-control" rows="5" aria-label="With textarea"></textarea>`
  const deleteOnDisplayInput = html`<input class="form-check-input" type="checkbox" role="switch" id="deleteOnDisplay" />`
  const deleteOnDisplayHelp = html`<span>
  The message will be deleted from system as soon as it is retrieved. Recipients can still copy and paste it, but it will
  disappear as soon as they refresh the page.
  </span>`
  const sendAnonymouslyInput = html`<input class="form-check-input" type="checkbox" role="switch" id="sendAnonymously" />`
  const sendAnonymouslyHelp = html`<span>
  A one-time-use private key will be used to encrypt KEK, and discarded immediately after you sent the message.
  Your alias will be masked to the recipient. In addition to remaining anonymous, this also means that this message
  can be retrieved only by the recipient.
  </span>`
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
    sendAnonymouslyInput.checked = false
    deleteOnDisplayInput.checked = false
  }

  const sendMessage = () => {
    setState(false)
    const toAliases = aliasInput.value.split(",").map(alias => alias.trim())
    const message = messageInput.value
    const deleteOnDisplay = deleteOnDisplayInput.checked
    const sendAnonymously = sendAnonymouslyInput.checked
    sendEncryptedDropAsync(client, toAliases, message, deleteOnDisplay, sendAnonymously, (status) => statusSpan.innerHTML = status).then((res) => {
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

  const sendersElements = getSendersAliases().map(alias => {
    const selectSender = () => {
      if (aliasInput.value.length > 0) {
        aliasInput.value += ", "
      }
      aliasInput.value += alias
      senders.removeChild(elt)
    }
    const elt = html`<button class="btn badge bg-secondary mx-1" onclick=${selectSender}>${alias}</button>`
    return elt
  })
  const senders = createElement("div", {}, ...sendersElements)
  const btnSend = html`<button type="button" onclick=${sendMessage} class="btn btn-primary mb-3 mx-1">Send</button>`
  const btnCancel = html`<button type="button" onclick=${cancel} class="btn btn-outline-secondary mb-3 mx-1">Cancel</button>`

  return html`
  <div class="px-4 py-5 my-5 text-center container">
    ${header("Send message")}
    <div class="col-md-7 mx-auto ">
      <p class="lead mb-4 pt-4">Recipient's aliases:</p>
      <div class="input-group mb-3">
      ${aliasInput}
    </div>
    ${senders}
    <p class="lead mb-4 pt-4">Your message:</p>
    <div class="input-group">
      ${messageInput}
    </div>
    <div class="form-check form-switch text-start">
      ${deleteOnDisplayInput}
      <label class="form-check-label" for="deleteOnDisplay">Delete immediately after retrieval</label>
    </div>
    <div class="form-check form-switch text-start">
      ${sendAnonymouslyInput}
      <label class="form-check-label" for="sendAnonymously">Send anonymously</label>
    </div>
    <br/>
    ${statusSpan}
    ${btnSend}
    ${btnCancel}
    </div>
  </div>`
}