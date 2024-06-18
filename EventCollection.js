import randomstring from "randomstring";

export default class EventCollection {
  #events = [];

  getAll() {
    return this.#events;
  }

  create(state) {
    const key = randomstring.generate();
    const event = { key, state };
    this.#events.push(event);
    return key;
  }

  delete(key) {
    const index = this.#events.findIndex((event) => event.key === key);
    if (index === -1) throw new EventNotFoundError();
    const nextEvent = this.#events[index + 1];
    const [deletedEvent] = this.#events.splice(index, 1);

    if (nextEvent) {
      nextEvent.state = deletedEvent.state;
      return;
    }

    return deletedEvent.state;
  }

  deleteAllEvents() {
    const firstEvent = this.#events[0];
    this.#events = [];
    return firstEvent?.state;
  }
}

export class EventNotFoundError extends Error {}
