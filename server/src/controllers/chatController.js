/**
 * Chat Controller
 *
 * Thin HTTP handlers for chat endpoints.
 * Delegates all business logic to chatService.
 */
import { waitUntil } from "@vercel/functions";
import { prepareChat, persistChat, XAI_TIMEOUT_MS } from "../services/chatService.js";
import * as chatService from "../services/chatService.js";
import { formatResponse } from "../helpers/formatResponse.js";
import { createXaiStream } from "../helpers/xaiStreamAdapter.js";
import {
  setSSEHeaders,
  writeSSE,
  endSSE,
  TOKEN_EVENT,
  DONE_EVENT,
  ERROR_EVENT,
} from "../helpers/sseHelpers.js";
import { enqueueRetry } from "../helpers/persistenceRetryQueue.js";

export async function sendMessage(req, res, next) {
  const { question } = req.body;
  const { uid } = req.user;

  const abortController = new AbortController();
  let interrupted = false;

  const markInterrupted = () => {
    interrupted = true;
    abortController.abort();
  };

  req.on("close", markInterrupted);
  req.on("abort", markInterrupted);
  res.on("close", markInterrupted);

  let messages, dailyCount;
  try {
    ({ messages, dailyCount } = await prepareChat(uid, question));
  } catch (error) {
    req.off("close", markInterrupted);
    req.off("abort", markInterrupted);
    res.off("close", markInterrupted);
    return next(error);
  }

  if (interrupted || req.aborted || res.destroyed) {
    console.info("[STREAM_INTERRUPTED]", { uid, phase: "pre_stream" });
    req.off("close", markInterrupted);
    req.off("abort", markInterrupted);
    res.off("close", markInterrupted);
    return;
  }

  setSSEHeaders(res);

  let fullAnswer = "";
  try {
    const stream = createXaiStream(messages, XAI_TIMEOUT_MS, {
      signal: abortController.signal,
    });
    for await (const { delta } of stream) {
      if (interrupted) break;
      fullAnswer += delta;
      writeSSE(res, TOKEN_EVENT, { delta });
    }

    if (interrupted) {
      console.info("[STREAM_INTERRUPTED]", { uid, answeredLength: fullAnswer.length });
      return endSSE(res);
    }

    try {
      const { messageId } = await persistChat(uid, question, fullAnswer);
      writeSSE(res, DONE_EVENT, { messageId, dailyCount: dailyCount + 1 });
      console.info("[PERSIST_OK]", { uid, dailyCount: dailyCount + 1 });
    } catch (persistError) {
      console.error("Post-stream persistence failed:", persistError.message);
      writeSSE(res, ERROR_EVENT, {
        code: "PERSIST_ERROR",
        message: "Failed to save conversation",
      });
      const retryPromise = enqueueRetry(
        () => persistChat(uid, question, fullAnswer),
        { userId: uid, question: question.slice(0, 50) },
      );
      waitUntil(retryPromise);
    }
    endSSE(res);
  } catch (error) {
    if (!interrupted) {
      console.error("Stream error:", error.message);
      writeSSE(res, ERROR_EVENT, {
        code: "STREAM_ERROR",
        message: "AI temporarily unavailable",
      });
    }
    endSSE(res);
  } finally {
    req.off("close", markInterrupted);
    req.off("abort", markInterrupted);
    res.off("close", markInterrupted);
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
