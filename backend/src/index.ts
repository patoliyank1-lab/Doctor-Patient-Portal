import express from "express";
import { Logger, winLogger } from "./utils/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import Router from "./api"
import cookieParser from "cookie-parser";
const app = express();

const port = process.env.PORT ?? 4000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", true);

app.use(winLogger);

app.use("/api/v1", Router);

app.get("/", (req, res) => {
  res.send("Welcome to typescript backend!");
});
app.use(errorHandler);

// Server setup

app.listen(port, function (err) {
  if (err) Logger.error(err);
  Logger.info(`Server is ruining on : http://localhost:${port}/`);
});

export { app };
