import { createElement, html } from "../html.js"
import { header } from "./header.js"
import { sendEncryptedDropAsync } from "../drop.js"
import { getSendersAliases } from "../cache.js"



export function sendMessagePageComponent({ client, onBack }) {

  const aliasInput = html`<input type="text" class="form-control" placeholder="Alias" aria-label="Alias" />`
  const messageInput = html`<textarea class="form-control" rows="5" aria-label="With textarea"></textarea>`
  const deleteOnDisplayInput = html`<input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault" />`
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
    const toAliases = aliasInput.value.split(",").map(alias => alias.trim())
    const message = messageInput.value
    const deleteOnDisplay = deleteOnDisplayInput.checked
    sendEncryptedDropAsync(client, toAliases, message, deleteOnDisplay, (status) => statusSpan.innerHTML = status).then((res) => {
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
      <label class="form-check-label" for="flexSwitchCheckDefault">Delete immediately after retrieval</label>
    </div>
    <br/>
    ${statusSpan}
    ${btnSend}
    ${btnCancel}
    </div>
  </div>`
}