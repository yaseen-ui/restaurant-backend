const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const { processOrder } = require("./orders");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;
let orders = [];
let clients = [];

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  clients.push(ws);
  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
  });
});

const broadcast = (message, type = "orderUpdate") => {
  const broadCastMsg = {
    type,
    data: message,
  };
  clients.forEach((client) => client.send(JSON.stringify(broadCastMsg)));
};

app.post("/api/orders", (req, res) => {
  const { pizza, toppings } = req.body;
  const newOrder = {
    id: orders.length + 1,
    pizza,
    toppings,
    status: "Dough Chef",
    timeStarted: Date.now(),
    timeTaken: null,
  };
  orders.push(newOrder);
  processOrder(newOrder, broadcast);
  res.status(201).json({ message: "Order received", order: newOrder });
});

app.get("/api/orders", (req, res) => {
  res.json(orders);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
