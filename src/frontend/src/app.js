import { render } from './lib/preact.module.js';
import { html } from './html.js';
import { ClientListComponent } from './client.js'

// Initialize htm with Preact

function App(props) {
  return html`<div>
  <h1>Hello ${props.name}!</h1>
  Yo what's up ${props.firstName}
  <${ClientListComponent} >


</div>`;
}

render(html`<${App} name="World" firstName="Gerard" />`, document.body);