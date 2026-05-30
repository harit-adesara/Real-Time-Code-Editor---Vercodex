import express from "express";
import cookieParser from "cookie-parser";
const app = express();
import { router } from "./routes/routes.js";
import cors from "cors";

app.use(
  cors({
    origin: "https://real-time-code-editor-vercodex.vercel.app/",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Live Code Editor");
});

app.use("/vercodex", router);

export { app };
