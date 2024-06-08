import express from "express";
import bodyParser from "body-parser";
const states = {};

const app = express();
app.use(bodyParser.json());

app.post("/save", async (req, res) => {
  const { server } = req.body;
  if (!server) {
    res.status(400);
    res.send({});
    return;
  }

  if (states[server]) {
    res.status(200);
  } else {
    states[server] = await fetch(getEndpoint(server)).then((res) => res.json());
    res.status(201);
  }

  res.send(states[server]);
});

app.post("/restore", async (req, res) => {
  const { server } = req.body;
  if (!server) {
    res.status(400);
    res.send({});
    return;
  }

  if (!states[server]) {
    res.status(404);
    res.send({});
    return;
  }

  const state = await fetch(getEndpoint(server), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(states[server]),
  }).then((res) => res.json());
  delete states[server];

  res.status(200);
  res.send(state);
});

function getEndpoint(server) {
  return server + "/json/state";
}

app.listen(3000);
