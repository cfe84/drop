import { html } from "./html.js"

export function sendMessagePageComponent({ onBack }) {
  return html`<span>Send message</span>`
  return html`<div class="px-4 py-5 my-5 text-center">
    <img class="d-block mx-auto mb-4" src="/style/img/logo_medium.png" alt="Drop logo" />
    <h1 class="display-5 fw-bold">Send a message</h1>
    <div class="col-lg-6 mx-auto">
      <p class="lead mb-4">Your messages:</p>
      <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
        <input class="form-control" id="floatingInput" placeholder="alias">
        <button type="button" onclick=${onBack} class="btn btn-primary btn-lg px-4 gap-3">Send a message</button>
      </div>
    </div>
  </div>`
}