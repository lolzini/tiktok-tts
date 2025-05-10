import WebSocket from "ws";

const CENTRAL_WEBSOCKET_URL = "ws://localhost:8081";

console.log(
  `Attempting to connect to WebSocket server at ${CENTRAL_WEBSOCKET_URL}...`
);

const client = new WebSocket(CENTRAL_WEBSOCKET_URL);

client.on("open", () => {
  console.log("[Client] Connected to WebSocket server!");
  // You could send a test message to the server if needed, e.g.:
  // client.send('Hello from test client!');
});

client.on("message", (message) => {
  console.log("[Client] Received message:");
  try {
    // Attempt to parse as JSON, as our server sends stringified JSON
    const parsedMessage = JSON.parse(message.toString());
    console.dir(parsedMessage, { depth: null }); // Pretty print the object
  } catch (e) {
    // If it's not JSON, log as raw string
    console.log(message.toString());
  }
});

client.on("error", (error) => {
  console.error("[Client] WebSocket error:", error.message);
});

client.on("close", (code, reason) => {
  console.log(
    `[Client] WebSocket connection closed. Code: ${code}, Reason: ${
      reason ? reason.toString() : "N/A"
    }`
  );
  console.log("Client shutting down.");
});

// Keep the client running until explicitly closed or server closes connection
// This simple client doesn't have a keep-alive mechanism beyond the WebSocket protocol itself.
// If the server closes the connection, the 'close' event will trigger.

// To manually close the client after some time (for testing purposes):
// setTimeout(() => {
//   console.log('[Client] Manually closing client after 30 seconds...');
//   client.close();
// }, 30000);
