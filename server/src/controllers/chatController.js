/**
 * Chat Controller
 *
 * Thin HTTP handlers for chat endpoints.
 * Delegates all business logic to chatService.
 */
import * as chatService from "../services/chatService.js";
import { formatResponse } from "../helpers/formatResponse.js";

export async function sendMessage(req, res, next) {
  try {
    const { question } = req.body;
    const { uid } = req.user;

    const result = await chatService.sendMessage(uid, question);

    res.status(200).json(formatResponse(result, "Message sent"));
  } catch (error) {
    next(error);
  }
}

export async function getChatHistory(req, res, next) {
  try {
    const { uid } = req.user;

    const history = await chatService.getChatHistory(uid);

    res
      .status(200)
      .json(formatResponse(history, "Chat history retrieved"));
  } catch (error) {
    next(error);
  }
}
