import { createElement, html } from "./html.js"
import { header } from "./header.js"
import { cleanClient } from "./client.js"
import { getDecryptedDropsAsync } from "./drop.js"

function dropComponent({ fromAlias, decryptedContent }) {
  return html`
<div class="text-start list-group-item list-group-item-action py-3 lh-tight">
    <div><strong class="mb-1">From ${fromAlias}</strong>:</div>
    <div><small>${decryptedContent}</small></div>
</div>
`
}

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

  let itemContainer = html`<div></div>`
  const list = html`<div>${itemContainer}</div>`

  getDecryptedDropsAsync(client).then(drops => {
    const content = drops.map(drop => dropComponent(drop))

    const newContainer = createElement("div", { class: "list-group list-group-flush border-bottom scrollarea" }, ...content);

    list.removeChild(itemContainer)
    itemContainer = newContainer
    list.appendChild(itemContainer)
  })

  const copyAliasBtn = html`<button class="btn btn-outline-secondary" type="button" id="button-addon2">Copy</button>`
  copyAliasBtn.onclick = () => window.clipboardData.setData("Text", client.alias);

  return html`
<div class="col-lg-6 mx-auto px-4 my-5 text-center">
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
    <p class="lead mb-4 pt-4">Your messages:</p>
    ${list}
    <div class="d-grid gap-2 py-4 d-sm-flex justify-content-sm-center">
      <button type="button" onclick=${onDeregisterConfirm} class="btn btn-outline-danger btn-lg px-4 gap-3">De-register</button>
    </div>
  </div>
</div>
`
}