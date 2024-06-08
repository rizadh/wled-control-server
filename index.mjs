import express from "express";
import bodyParser from "body-parser";
import randomstring from "randomstring";
import morgan from "morgan";

const PORT = process.env.WLED_CONTROL_SERVER_PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(morgan("dev"));

const servers = {};

app.get("/servers", (_, res) => {
  res.send(Object.keys(servers));
});

app.get("/server/:server/events", (req, res) => {
  const { server } = req.params;

  res.send(servers[server]?.events ?? []);
});

app.post("/server/:server/event", async (req, res) => {
  const { server } = req.body;
  if (!server) {
    res.status(400);
    res.send({ error: "'server' is required" });
    return;
  }

  const key = await createServerEvent(server);

  res.send({ key });
});

app.delete("/server/:server/event/:key", async (req, res) => {
  const { server, key } = req.params;
  if (!server) {
    res.status(400);
    res.send({ error: "'server' is required" });
    return;
  }
  if (!key) {
    res.status(400);
    res.send({ error: "'key' is required" });
    return;
  }

  try {
    const applied = await removeServerEvent(server, key);
    res.send({ applied });
  } catch (error) {
    if (error instanceof ServerNotFoundError) {
      res.status(404);
      res.send({ error: "Server not found" });
      return;
    }

    if (error instanceof EventNotFoundError) {
      res.status(404);
      res.send({ error: "Event not found" });
      return;
    }

    throw error;
  }
});

function getServerState(server) {
  return fetch(`http://${server}/json/state`).then((res) => res.json());
}

function applyServerState(server, state) {
  return fetch(`http://${server}/json/state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(state),
  }).then((res) => res.json());
}

async function createServerEvent(server) {
  servers[server] ??= { events: [] };

  const key = randomstring.generate();
  const state = await getServerState(server);
  servers[server].events.push({ key, state });

  return key;
}

async function removeServerEvent(server, key) {
  if (!servers[server]) throw new ServerNotFoundError();

  const eventIndex = servers[server].events.findIndex(
    (event) => event.key === key
  );

  if (eventIndex === -1) throw new EventNotFoundError();

  const isLastEvent = eventIndex === servers[server].events.length - 1;
  const [event] = servers[server].events.splice(eventIndex, 1);
  if (isLastEvent) {
    await applyServerState(server, event.state);
    return true;
  } else {
    const nextEvent = servers[server].events[eventIndex];
    nextEvent.state = event.state;
    return false;
  }
}

class ServerNotFoundError extends Error {}
class EventNotFoundError extends Error {}

app.listen(PORT);
console.log(`Listening on port ${PORT}`);
