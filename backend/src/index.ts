import express from "express";
import { Logger, winLogger } from "./utils/logger.js";
const app = express();

const port = process.env.PORT ?? 4000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(winLogger);

app.get("/", (req, res) => {
  res.send("Welcome to typescript backend!");
});

app.listen(port, function (err) {
  if (err) Logger.error(err);
  Logger.info(`Server is ruining on : http://localhost:${port}/`);
});

