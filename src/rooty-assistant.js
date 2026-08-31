export class RootyAssistant extends HTMLElement {}

if (!customElements.get("rooty-assistant")) {
  customElements.define("rooty-assistant", RootyAssistant);
}
