/**
 * SSE Helpers
 *
 * Utilities for writing Server-Sent Events frames to an HTTP response.
 */

export const TOKEN_EVENT = "token";
export const DONE_EVENT = "done";
export const ERROR_EVENT = "error";

export function setSSEHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

export function writeSSE(res, event, data) {
  if (res.writableFinished || res.destroyed) return false;
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    return false;
  }
  return true;
}

export function endSSE(res) {
  if (res.writableFinished || res.writableEnded || res.destroyed) return;
  try {
    res.end();
  } catch {
    /* silent — response already torn down */
  }
}

export function waitForFinish(res) {
  if (res.writableFinished) return Promise.resolve(true);
  if (res.destroyed) return Promise.resolve(false);

  return new Promise((resolve) => {
    const onFinish = () => { res.off("close", onClose); resolve(true); };
    const onClose = () => { res.off("finish", onFinish); resolve(false); };
    res.once("finish", onFinish);
    res.once("close", onClose);
  });
}
