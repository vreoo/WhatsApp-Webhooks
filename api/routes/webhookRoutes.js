import express from "express";

import {
    verifyWebhook,
    handleWebhook,
    getMessages,
    sendMessage,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/webhook", verifyWebhook);
router.post("/webhook", handleWebhook);
router.get("/api/messages", getMessages);
router.post("/api/messages", sendMessage);

export default router;
