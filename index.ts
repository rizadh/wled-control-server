import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import Server from "./Server.ts";
import { EventNotFoundError } from "./EventCollection.ts";

const PORT = parseInt(process.env.WLED_CONTROL_SERVER_PORT ?? "3000");

const app = express();
app.use(morgan("short"));
app.use(bodyParser.json());

app.get("/servers", (_, res) => {
  res.send(Server.hosts);
});

app.get("/server/:host/events", (req, res) => {
  const { host } = req.params;
  const server = Server.getByHost(host);
  res.send(server.events);
});

app.delete("/server/:host/events", async (req, res) => {
  const { host } = req.params;

  const server = Server.getByHost(host);
  const applied = await server.deleteAllEvents();

  res.send({ applied });
});

app.post("/server/:host/event", async (req, res) => {
  const { host } = req.params;

  const server = Server.getByHost(host);
  const key = await server.createEvent();

  res.send({ key });
});

app.delete("/server/:host/event/:key", async (req, res) => {
  const { host, key } = req.params;
  const server = Server.getByHost(host);

  try {
    const applied = await server.deleteEvent(key);
    res.send({ applied });
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      res.status(404).send({ error: "Event not found" });
      return;
    }

    throw error;
  }
});

app.listen(PORT);
console.log(`Listening on port ${PORT}`);
