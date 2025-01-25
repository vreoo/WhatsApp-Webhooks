import express, { json } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { PORT } from "./config/index.js";
import webhookRoutes from "./api/routes/webhookRoutes.js";
import logger from "./config/logger.js";

const app = express().use(json()).use(cors()).use(bodyParser.json());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

app.use("/", webhookRoutes);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
