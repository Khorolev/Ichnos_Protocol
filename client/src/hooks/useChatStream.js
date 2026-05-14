// useChatStream: wraps the streaming chat client with lifecycle/Redux glue.
// sendStreamMessage(question, opts?) — opts.persistMessages=false suppresses
// all chat-slice side effects (addMessage, setLoading, clearError, setError,
// setDailyCount, cache invalidation). Non-persistent surfaces wire local
// state via callbacks: onAiMessage, onLoadingChange, onError, onDailyCount.
import { useState, useRef, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

import { streamChatMessage } from "../helpers/chatStreamClient";
import {
  addMessage,
  setDailyCount,
  setError,
  setLoading,
  clearError,
} from "../features/chat/chatSlice";
import { chatApi } from "../features/chat/chatApi";

export function useChatStream() {
  const dispatch = useDispatch();
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);
  const streamingTextRef = useRef("");

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamingText("");
    dispatch(setLoading(false));
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const sendStreamMessage = useCallback(
    async (question, opts = {}) => {
      const {
        persistMessages = true,
        onAiMessage,
        onLoadingChange,
        onError: onErrorCallback,
        onDailyCount,
      } = opts;
      const emitLoading = (v) => {
        if (persistMessages) dispatch(setLoading(v));
        onLoadingChange?.(v);
      };
      const emitClearError = () => {
        if (persistMessages) dispatch(clearError());
        onErrorCallback?.(null);
      };
      const emitError = (t) => {
        if (persistMessages) dispatch(setError(t));
        onErrorCallback?.(t);
      };
      const emitDailyCount = (c) => {
        if (persistMessages) dispatch(setDailyCount(c));
        onDailyCount?.(c);
      };

      const { auth } = await import("../config/firebase");
      const token = await auth.currentUser.getIdToken();

      setStreamingText("");
      streamingTextRef.current = "";
      setIsStreaming(true);
      emitLoading(true);
      emitClearError();

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let outcome = "failed";

      try {
        await streamChatMessage(question, token, {
          onToken: ({ delta }) => {
            streamingTextRef.current += delta;
            setStreamingText(streamingTextRef.current);
          },
          onDone: ({ dailyCount }) => {
            outcome = "completed";
            const aiMsg = { role: "ai", content: streamingTextRef.current, timestamp: new Date().toISOString() };
            if (persistMessages) {
              dispatch(addMessage(aiMsg));
              dispatch(chatApi.util.invalidateTags(["ChatHistory"]));
            }
            onAiMessage?.(aiMsg);
            emitDailyCount(dailyCount);
            emitLoading(false);
            setIsStreaming(false);
            setStreamingText("");
          },
          onError: ({ code }) => {
            let errorType;
            if (code === "RATE_LIMIT") errorType = "rate_limit";
            else if (code === "STREAM_ERROR") errorType = "ai_unavailable";
            else errorType = "generic";
            emitError(errorType);
            emitLoading(false);
            setIsStreaming(false);
            setStreamingText("");
          },
          signal: abortController.signal,
        });
      } catch (err) {
        if (err?.name === "AbortError") {
          outcome = "aborted";
          emitLoading(false);
          setIsStreaming(false);
          setStreamingText("");
          return outcome;
        }
        const status = err?.status;
        if (status === 429) emitError("rate_limit");
        else if (status === 503) emitError("ai_unavailable");
        else emitError("generic");
        emitLoading(false);
        setIsStreaming(false);
        setStreamingText("");
      }

      return outcome;
    },
    [dispatch],
  );

  return { streamingText, isStreaming, sendStreamMessage, cancelStream };
}
