import dotenv from "dotenv";

dotenv.config();

export const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
export const GRAPH_API_TOKEN = process.env.GRAPH_API_TOKEN;
export const PORT = process.env.PORT || 8080;
