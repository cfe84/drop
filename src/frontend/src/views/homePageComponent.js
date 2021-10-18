import { createElement, html } from "../html.js"
import { header } from "./header.js"
import { cleanClient } from "../client.js"
import { getDecryptedDropsAsync } from "../drop.js"
import { deleteClientAsync, deleteDropAsync } from "../apiConnector.js"

export function homePageComponent({ client, onSendMessage, onDeregistered }) {

  function dropComponent({ dropId, deleteOnDisplay, fromAlias, decryptedContent }) {
    const ondelete = () => {
      deleteDropAsync({ alias: client.alias, pass: client.pass, dropId }).then(() => {
        refresh()
      })
    }

    decryptedContent = decryptedContent.replace(/\n/, "<br/>")
    const content = createElement("small")
    content.innerHTML = decryptedContent
    const displayOnceWarning = deleteOnDisplay
      ? html`<span class="badge rounded-pill bg-danger">Displayed only once</span>`
      : html`<span></span>`

    return html`
      <div class="text-start py-3 lh-tight row">
        <div class="col-10">
          <div><strong class="mb-1">From ${fromAlias}</strong>: ${displayOnceWarning}</div>
          <div>${content}</div>
        </div>
        <div class="col align-middle">
          <button class="btn btn-outline-danger" onclick=${ondelete}>❌</button>
        </div>
      </div>
  `
  }

  function onDeregisterConfirm() {
    if (confirm(`This will destroy your alias for ever! Are you sure?`)) {
      deleteClientAsync(client).then(() => {
        cleanClient()
        onDeregistered()
      })
    }
  }

  function send() {
    onSendMessage()
  }

  let itemContainer = html`<div></div>`
  const list = html`<div class="container">${itemContainer}</div>`
  let containsDisplayOnce = false

  function refresh() {
    if (containsDisplayOnce && !confirm(`Some messages are displayed only once and will forever disappear. Are you sure?`)) {
      return
    }
    getDecryptedDropsAsync(client).then(drops => {
      const content = drops.map(drop => dropComponent(drop))
      containsDisplayOnce = !!drops.find(drop => drop.deleteOnDisplay)
      const newContainer = createElement("div", { class: "list-group list-group-flush border-bottom scrollarea" }, ...content);

      list.removeChild(itemContainer)
      itemContainer = newContainer
      list.appendChild(itemContainer)
    })
  }

  refresh()

  const copyAliasBtn = html`<button class="btn btn-outline-secondary" type="button" id="button-addon2">Copy</button>`
  copyAliasBtn.onclick = () => navigator.clipboard.writeText(client.alias);

  return html`
<div class="col-lg-8 mx-auto px-4 my-5 text-center">
  ${header("Drop")}
  <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
    <button type="button" onclick=${() => { send() }} class="btn btn-primary btn-lg px-4 gap-3">Send a message</button>
  </div>
  <p class="lead mb-4 pt-4">This browser's alias:</p>
  <div class="input-group">
    <input type="text" class="form-control text-center" readonly aria-describedby="button-addon2" value=${client.alias}/>
    ${copyAliasBtn}
  </div>
  <div>
    <p class="lead mb-4 pt-4">Your messages: <button class="btn btn-outline-secondary" onclick=${refresh}>⭮</button></p>
    ${list}
    <div class="d-grid gap-2 py-4 d-sm-flex justify-content-sm-center">
      <button type="button" onclick=${onDeregisterConfirm} class="btn btn-outline-danger btn-lg px-4 gap-3">De-register</button>
    </div>
  </div>
</div>
`
}