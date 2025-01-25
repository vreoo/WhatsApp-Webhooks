import { messages } from "../services/messageService.js";
import { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN } from "../../config/index.js";
import logger from "../../config/logger.js";
import axios from "axios";

export const verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
            logger.info("Webhook verified successfully");
            res.status(200).send(challenge);
        } else {
            logger.error(
                "Webhook verification failed. Make sure the token is correct"
            );
            res.sendStatus(403, "Forbidden");
        }
    }
};

export const handleWebhook = (req, res) => {
    const body = req.body;
    logger.info(`Received a new webhook event: ${JSON.stringify(body)}`);

    if (body.object) {
        body.entry.forEach((entry) => {
            const { id, changes } = entry;
            changes.forEach((change) => {
                const { field, value } = change;

                switch (field) {
                    case "messages":
                        if (value.messages) {
                            const message = value.messages[0];
                            const from = message.from;
                            const text = message.text.body;
                            const id = message.id;
                            messages.push({ from, text, id });

                            logger.info(`New message from ${from}: ${text}`);
                        }
                        break;
                    case "statuses":
                        if (value.statuses) {
                            const status = value.statuses[0];
                            const messageId = status.id;
                            const statusText = status.status;
                            const timestamp = status.timestamp;

                            logger.info(
                                `Message ID ${messageId} status: ${statusText} at ${timestamp}`
                            );
                        }
                        break;

                    case "photos":
                        const { vreb, object_id: objectId } = value;

                        logger.info(
                            `Photo event: ${vreb} with object ID ${objectId}`
                        );
                        break;

                    default:
                        logger.warn(`Unknown field: ${field}`);
                        break;
                }
            });
            logger.info(`Processed entry with ID: ${id}`);
        });

        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

export const getMessages = (req, res) => {
    logger.info("Fetching all messages");
    res.json(messages);
};

export const sendMessage = async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        logger.error("Missing 'to' or 'message' in the request body");
        res.sendStatus(400, "Bad Request");
    }

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v20.0/343588285509039/messages?access_token=${GRAPH_API_TOKEN}`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: {
                    preview_url: false,
                    body: message,
                },
            }
        );
        logger.info(JSON.stringify(response));
        if (response.status === 200) {
            logger.info(`Message sent to ${to}: ${message}`);
            res.sendStatus(200, "OK");
        } else {
            logger.error(
                `Failed to send message to ${to}: ${response.statusText}`
            );
            return res.status(response.status).send("Failed to send message");
        }
    } catch (error) {
        logger.error(`Failed to send message to ${to}: ${error.message}`);
        return res.status(500).send("Internal Server Error");
    }
};
