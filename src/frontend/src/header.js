import { html } from "./html.js"
export function header(name) {
  return html`
<div class="py-4 d-flex flex-wrap justify-content-center mx-auto">
  <img class="d-flex align-items-center px-3" src="/style/img/logo_small.png" alt="Drop logo"/>
  <span class="d-flex align-items-center display-6 fw-bold">${name}</span>
</div>
`
}