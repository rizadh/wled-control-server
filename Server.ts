import { Mutex } from "async-mutex";
import EventCollection from "./EventCollection.ts";

type WledState = unknown;

export default class Server {
  static #instances: Record<string, Server | undefined> = {};
  #mutex = new Mutex();
  #events = new EventCollection();
  #host: string;

  static get hosts() {
    return Object.keys(this.#instances);
  }

  static getByHost(host: string) {
    return (this.#instances[host] ??= new Server(host));
  }

  constructor(host: string) {
    this.#host = host;
  }

  get events() {
    return this.#events.getAll();
  }

  #getState() {
    return fetch(`http://${this.#host}/json/state`).then((res) => res.json());
  }

  #applyState(state: WledState) {
    return fetch(`http://${this.#host}/json/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).then((res) => res.json());
  }

  async createEvent() {
    return this.#mutex.runExclusive(async () => {
      const state = await this.#getState();
      const key = this.#events.create(state);

      console.log("Event created", key, state);

      return key;
    });
  }

  async deleteEvent(key: string) {
    return this.#mutex.runExclusive(async () => {
      const state = this.#events.delete(key);
      if (state) await this.#applyState(state);

      console.log("Event deleted", key, state);

      return !!state;
    });
  }

  async deleteAllEvents() {
    return this.#mutex.runExclusive(async () => {
      const state = this.#events.deleteAllEvents();
      if (state) await this.#applyState(state);

      console.log("All events deleted", state);

      return !!state;
    });
  }
}
