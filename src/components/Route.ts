import { customElement, html, property } from "lit-element";
import { on, fire } from "../util";
import { match, MatchFunction, Match, pathToRegexp } from 'path-to-regexp';
import observeAnchors from "./observeAnchors";
import TurboComponent from "./TurboComponent";

@customElement('tb-route')
export default class Route extends TurboComponent {

  @property()
  path: string|undefined;

  @property()
  action: string|undefined;

  private matchFn: MatchFunction|undefined;

  private match: Match|false = false;

  private fireAction () {
    if (this.action && this.match) {
      fire(`${this.stateName}-action`, {
        data: {
          params: this.match.params
        },
        actionName: this.action,
        model: this.fullModelPath
      });
    }
  }

  private get pagePath () {
    return location.pathname;
  };

  private onPageChange = async () => {
    this.match = this.matchFn ? this.matchFn(this.pagePath) : false;
    if (this.isConnected) {
      this.fireAction();
      this.requestUpdate();
    }
  }

  attributeChangedCallback (name: string, old: string, value: string) {
    super.attributeChangedCallback(name, old, value);
    if (name == 'path') {
      // TODO fix the issue of all routes matching to one pattern
      this.matchFn = match(value, { end: false });
    }
  }

  disconnectedCallback () {
    // TODO: fix removeEventListener to work properly
    super.disconnectedCallback();
    window.removeEventListener('popstate', this.onPageChange);
    document.removeEventListener('page-change', this.onPageChange);
  }

  connectedCallback () {
    on(`${this.stateName}-state-started`, () => {
      this.onPageChange();
    });
    this.onPageChange();
    window.addEventListener('popstate', this.onPageChange);
    on('page-change', this.onPageChange);
    super.connectedCallback();
  }

  updated (changedProps: any) {
    super.updated(changedProps);

    if (this.shadowRoot) {
      observeAnchors(this.shadowRoot);
    }
  }

  /**
   * this method is used by tb-switch to cancel subsequent tb-routes when the first
   * one is matched
   */
  cancelMatch () {
    this.match = false;
    this.requestUpdate();
  }

  render () {
    if (this.match !== false) {
      this.dispatchEvent(new CustomEvent('match'));
    }
    return this.match == false
      ? html``
      : html`<slot></slot>`;
  }
}