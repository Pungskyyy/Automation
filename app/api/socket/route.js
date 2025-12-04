export const config = {
    runtime: "edge",
  };
  
  let clients = new Map(); // deviceId → websocket
  
  export default async function handler(req) {
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("Not a websocket request", { status: 400 });
    }
  
    const [client, server] = Object.values(new WebSocketPair());
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || crypto.randomUUID();
  
    server.accept();
    clients.set(id, server);
  
    console.log("DEVICE CONNECTED:", id);
  
    server.addEventListener("message", (msg) => {
      // Relay ke dashboard bila perlu
      console.log("FROM DEVICE:", id, msg.data);
    });
  
    server.addEventListener("close", () => {
      clients.delete(id);
      console.log("DISCONNECTED:", id);
    });
  
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
  
  // SEND COMMAND (called from dashboard)
  export async function sendCommandToDevice(deviceId, message) {
    const ws = clients.get(deviceId);
    if (!ws) return false;
  
    ws.send(JSON.stringify(message));
    return true;
  }
  