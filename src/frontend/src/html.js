import { h } from './lib/preact.module.js';
import htm from './lib/htm.module.js';

function createElement(tag, properties, ...children) {
  const elt = document.createElement(tag)

  if (properties) {
    Object.keys(properties).forEach(key => {
      let targetKey = key
      if (key === "class") {
        targetKey = "className"
      }
      elt[targetKey] = properties[key]
    })
  }
  children.forEach(child => {
    if (typeof (child) === "string") {
      child = document.createTextNode(child)
    }
    elt.appendChild(child)
  })
  return elt
}

export const html = htm.bind(createElement);