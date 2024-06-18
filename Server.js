import { Mutex } from "async-mutex";
import EventCollection from "./EventCollection.js";

export default class Server {
  static instances = {};
  #mutex = new Mutex();
  #events = new EventCollection();

  static get hosts() {
    return Object.keys(this.instances);
  }

  static getByHost(host) {
    return (this.instances[host] ??= new Server(host));
  }

  constructor(host) {
    this.host = host;
  }

  get events() {
    return this.#events.getAll();
  }

  #getState() {
    return this.#mutex.runExclusive(() =>
      fetch(`http://${this.host}/json/state`).then((res) => res.json())
    );
  }

  #applyState(state) {
    return this.#mutex.runExclusive(() =>
      fetch(`http://${this.host}/json/state`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state),
      }).then((res) => res.json())
    );
  }

  async createEvent() {
    return this.#events.create(await this.#getState());
  }

  async deleteEvent(key) {
    const state = this.#events.delete(key);
    if (state) await this.#applyState(state);
    return !!state;
  }

  async deleteAllEvents() {
    const state = this.#events.deleteAllEvents();
    if (state) await this.#applyState(state);
    return !!state;
  }
}
