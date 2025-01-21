import express, { json } from "express";

import bodyParser from "body-parser";
import cors from "cors";
// Initialize Express server
const app = express().use(json()).use(cors()).use(bodyParser.json());

// Import environment variables from `.env`
import { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, PORT } from "./config.js";
import axios from "axios";

// Initialize messages array
const messages = [];

/**
 * GET - Webhook verification
 * @param {express.Request} req
 * @param {express.Response} res
 *
 * @returns {void}
 */
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log({ mode, token, challenge });
    console.log("WEBHOOK_VERIFY_TOKEN: ", WEBHOOK_VERIFY_TOKEN);

    if (mode && token) {
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403, "Forbidden");
        }
    }
});

/**
 * POST - Webhook
 * @param {express.Request} req
 * @param {express.Response} res
 *
 * @returns {void}
 */
app.post("/webhook", (req, res) => {
    const body = req.body;
    console.log("Incoming webhook message:", JSON.stringify(body, null, 2));

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const from = body.entry[0].changes[0].value.messages[0].from;
            const message =
                body.entry[0].changes[0].value.messages[0].text.body;
            const id = body.entry[0].changes[0].value.messages[0].id;

            // Send message to Facebook
            axios({
                method: "post",
                url: `https://graph.facebook.com/v11.0/${id}/messages`,
                params: { access_token: GRAPH_API_TOKEN },
                to: from,
                data: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    type: "text",
                    to: from,
                    text: {
                        body: "Hello Nibras",
                    },
                },
                headers: {
                    "Content-Type": "application/json",
                },
            });
            messages.push({ from, text: message, id });

            res.sendStatus(200, "OK");
        } else {
            res.sendStatus(404, "Not Found");
        }
    }
});

/**
 * GET - Messages
 * @param {express.Request} req
 * @param {express.Response} res
 *
 * @returns {void}
 */
app.get("/api/messages", (req, res) => {
    res.json(messages);
});

/**
 * GET - Default route
 * @param {express.Request} req
 * @param {express.Response} res
 *
 * @returns {void}
 */
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Start server
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
