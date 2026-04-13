/**
 * useChatStream Hook
 *
 * Wraps the streaming chat client with lifecycle management
 * and Redux integration for incremental rendering.
 */
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
    async (question) => {
      const { auth } = await import("../config/firebase");
      const token = await auth.currentUser.getIdToken();

      setStreamingText("");
      streamingTextRef.current = "";
      setIsStreaming(true);
      dispatch(setLoading(true));
      dispatch(clearError());

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
            dispatch(
              addMessage({
                role: "ai",
                content: streamingTextRef.current,
                timestamp: new Date().toISOString(),
              }),
            );
            dispatch(setDailyCount(dailyCount));
            dispatch(setLoading(false));
            setIsStreaming(false);
            setStreamingText("");
            dispatch(chatApi.util.invalidateTags(["ChatHistory"]));
          },
          onError: ({ code }) => {
            let errorType;
            if (code === "RATE_LIMIT") errorType = "rate_limit";
            else if (code === "STREAM_ERROR") errorType = "ai_unavailable";
            else errorType = "generic";
            dispatch(setError(errorType));
            dispatch(setLoading(false));
            setIsStreaming(false);
            setStreamingText("");
          },
          signal: abortController.signal,
        });
      } catch (err) {
        if (err?.name === "AbortError") {
          outcome = "aborted";
          dispatch(setLoading(false));
          setIsStreaming(false);
          setStreamingText("");
          return outcome;
        }
        const status = err?.status;
        if (status === 429) dispatch(setError("rate_limit"));
        else if (status === 503) dispatch(setError("ai_unavailable"));
        else dispatch(setError("generic"));
        dispatch(setLoading(false));
        setIsStreaming(false);
        setStreamingText("");
      }

      return outcome;
    },
    [dispatch],
  );

  return { streamingText, isStreaming, sendStreamMessage, cancelStream };
}
