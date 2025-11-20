import http from "http";
import app from "./app.js";
import init from "./startup/init.js";
import { initSocket } from "./startup/socket.js";

const start = async () => {
    await init(); // DB + other initialization

    const server = http.createServer(app);

    // 🔥 Initialize Socket.IO
    initSocket(server);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

start();
