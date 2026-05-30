import dotenv, { config } from "dotenv";
dotenv.config({
  path: "./.env",
});
import { app } from "./app.js";
import { connectDB } from "./db/index.js";
import { initSocket } from "./socket/index.js";
import http from "http";
import "./utils/worker.js";

const port = process.env.PORT || 4000;

const server = http.createServer(app);

console.log(process.env.GMAIL_PORT);

initSocket(server);

connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`app is litening on http://localhost:${port}`);
    });
  })
  .catch(() => {
    console.log("Not connected to DB");
    process.exit(1);
  });
