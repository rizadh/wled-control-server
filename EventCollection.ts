import randomstring from "randomstring";

type Event<S> = {
  key: string;
  state: S;
};

export default class EventCollection<S> {
  #events: Event<S>[] = [];

  getAll() {
    return this.#events;
  }

  create(state: S) {
    const key = randomstring.generate();
    const event = { key, state };
    this.#events.push(event);
    return key;
  }

  delete(key: string) {
    const index = this.#events.findIndex((event) => event.key === key);
    if (index === -1) throw new EventNotFoundError();
    const nextEvent = this.#events[index + 1];
    const [deletedEvent] = this.#events.splice(index, 1);

    console.log("Events", this.#events);
    console.log("Index", index);
    console.log("Deleted event", deletedEvent);
    console.log("Next event", nextEvent);

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
