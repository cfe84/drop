import { ApiConnector } from "./apiConnector.js";
import { Component } from "./lib/preact.module.js"
import { html } from "./html.js"

export class Client {
  alias
  publicCertificate
}

export class ClientListComponent extends Component {
  state = { customers: [] };
  apiConnector = new ApiConnector();

  componentDidMount() {
    console.log(`Trying to get state`)
    getClientsAsync(this.apiConnector).then(clients => {
      console.log(`Got state`)
      this.setState({ customers: clients })
    })
  }

  render() {
    const customers = this.state.customers.map(customer => {
      return html`<span>${customer.alias}</span>`
    })
    return html`<div>${customers}</span>`
  }
}

export async function getClientsAsync(apiConnector) {
  const clients = await apiConnector.sendQueryAsync("clients")
  return clients
}