/**
 * Contact Controller
 *
 * Thin HTTP handlers for contact endpoints.
 * Delegates all business logic to contactService.
 */
import * as contactService from "../services/contactService.js";
import { formatResponse } from "../helpers/formatResponse.js";

export async function submitRequest(req, res, next) {
  try {
    const { uid } = req.user;

    const result = await contactService.submitContactRequest(uid, req.body);

    res.status(201).json(formatResponse(result, "Contact request submitted"));
  } catch (error) {
    next(error);
  }
}

export async function getMyRequests(req, res, next) {
  try {
    const { uid } = req.user;

    const requests = await contactService.getMyRequests(uid);

    res.status(200).json(formatResponse(requests, "Requests retrieved"));
  } catch (error) {
    next(error);
  }
}

export async function addQuestion(req, res, next) {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res
        .status(400)
        .json({ data: null, error: "Invalid question: must be a non-empty string", message: null });
    }

    const requestId = parseInt(id, 10);

    if (Number.isNaN(requestId) || requestId <= 0) {
      return res
        .status(400)
        .json({ data: null, error: "Invalid request ID", message: null });
    }

    const result = await contactService.addQuestion(
      uid,
      requestId,
      question,
    );

    res.status(201).json(formatResponse(result, "Question added"));
  } catch (error) {
    next(error);
  }
}
