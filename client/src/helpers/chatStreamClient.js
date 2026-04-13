/**
 * Chat Stream Client
 *
 * Low-level fetch + SSE parser for the streaming chat endpoint.
 * Pure helper — no React dependencies.
 */
import { API_BASE_URL } from "../constants/api";

const TOKEN_EVENT = "token";
const DONE_EVENT = "done";
const ERROR_EVENT = "error";

export async function streamChatMessage(
  question,
  bearerToken,
  { onToken, onDone, onError, signal },
) {
  const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
    signal,
  });

  if (!response.ok) {
    const data = await response.json();
    throw { status: response.status, data };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedTerminal = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop();

    for (const frame of frames) {
      const lines = frame.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.slice(6).trim();
      const data = JSON.parse(dataLine.slice(5).trim());

      if (event === TOKEN_EVENT) onToken(data);
      else if (event === DONE_EVENT) {
        receivedTerminal = true;
        onDone(data);
      } else if (event === ERROR_EVENT) {
        receivedTerminal = true;
        onError(data);
      }
    }
  }

  if (!receivedTerminal) {
    onError({ code: "STREAM_EOF", message: "Stream ended unexpectedly" });
    return;
  }
}
