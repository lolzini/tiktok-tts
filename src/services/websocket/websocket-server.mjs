import { WebSocketServer } from "ws";
import chalk from "chalk";

let wss;

export function startWebSocketServer(port) {
  wss = new WebSocketServer({ port });
  console.log(chalk.magenta(`WebSocket server started on port ${port}`));

  wss.on("connection", (ws) => {
    console.log(chalk.magenta("WebSocket client connected"));
    ws.on("message", (message) => {
      console.log(chalk.magenta(`Received WebSocket message: ${message}`));
    });
    ws.on("close", () => {
      console.log(chalk.magenta("WebSocket client disconnected"));
    });
    ws.on("error", (error) => {
      console.error(chalk.red("WebSocket error:"), error);
    });
  });

  wss.on("error", (error) => {
    console.error(chalk.red("WebSocket Server Error:"), error);
  });
}

export function broadcastMessage(message) {
  if (!wss) {
    console.warn(
      chalk.yellow(
        "WebSocket server not initialized. Cannot broadcast message."
      )
    );
    return;
  }

  const messageString =
    typeof message === "string" ? message : JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(messageString);
    }
  });
}

export function getWssInstance() {
  return wss;
}
