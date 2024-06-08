import express from "express";
import bodyParser from "body-parser";

const PORT = process.env.WLED_CONTROL_SERVER_PORT || 3000;

const app = express();
app.use(bodyParser.json());

const states = {};

app.get("/", (_, res) => {
  res.send({ states });
});

app.post("/save", async (req, res) => {
  const { server } = req.body;
  if (!server) {
    res.status(400);
    res.send({ error: "server is required" });
    return;
  }

  if (!(server in states)) {
    states[server] = await fetch(`http://${server}/json/state`).then((res) =>
      res.json()
    );
    res.status(201);
  }

  res.send({ result: states[server] });
});

app.post("/restore", async (req, res) => {
  const { server } = req.body;
  if (!server) {
    res.status(400);
    res.send({ error: "server is required" });
    return;
  }

  if (!states[server]) {
    res.status(404);
    res.send({ error: "no state saved for server" });
    return;
  }

  const wledResponse = await fetch(`http://${server}/json/state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(states[server]),
  }).then((res) => res.json());
  delete states[server];

  res.status(200);
  res.send({ result: wledResponse });
});

app.listen(PORT);
console.log(`Listening on port ${PORT}`);
