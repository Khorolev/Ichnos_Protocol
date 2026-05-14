import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";

import { addMessage, setMessages, toggleModal, clearError } from "../../features/chat/chatSlice";
import { openModal as openContactModal } from "../../features/contact/contactSlice";
import { useLazyGetHistoryQuery } from "../../features/chat/chatApi";
import { openAuthModal, setAuthSuccess } from "../../features/auth/authSlice";
import { mapHistoryToMessages } from "../../helpers/chatMessageMapper";
import { useChatStream } from "../../hooks/useChatStream";
import { DAILY_MESSAGE_LIMIT } from "../../constants/chat";
import Button from "../atoms/Button";
import { renderInquiryButton, refreshHistorySafely } from "./ChatPanel.helpers";

const WELCOME_TEXT = "Hi — tell me about your battery program. I can help with EU 2023/1542, MS 2818, FMEA, mechanical design, or anything else.";
const DISCLAIMER_TEXT = "Responses are AI-generated. We follow up personally on every conversation that becomes a lead.";

export default function ChatPanel({ mode, persistState }) {
  const dispatch = useDispatch();
  const reduxChat = useSelector((s) => s.chat);
  const { isAuthenticated, authSuccess, enforcedLogout } = useSelector((s) => s.auth);
  const [localMessages, setLocalMessages] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [localDailyCount, setLocalDailyCount] = useState(0);
  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const listRef = useRef(null);
  const sendPendingRef = useRef(false);
  const fetchGenRef = useRef(0);
  const { streamingText, isStreaming, sendStreamMessage, cancelStream } = useChatStream();
  const [triggerHistory] = useLazyGetHistoryQuery();
  const isModal = mode === "modal";
  const isOpen = reduxChat.isOpen;
  const panelActive = isModal ? isOpen : true;
  const messages = persistState ? reduxChat.messages : localMessages;
  const loading = persistState ? reduxChat.loading : localLoading;
  const error = persistState ? reduxChat.error : localError;
  const dailyCount = persistState ? reduxChat.dailyCount : localDailyCount;

  useEffect(() => { if (isModal && !isOpen && isStreaming) cancelStream(); }, [isOpen, isStreaming, cancelStream, isModal]);
  useEffect(() => {
    if (enforcedLogout) { setPendingMessage(""); return; }
    if (panelActive && !isAuthenticated && isModal) dispatch(openAuthModal("login"));
    if (!panelActive || !isAuthenticated || !persistState || sendPendingRef.current) return;
    const gen = ++fetchGenRef.current;
    triggerHistory().unwrap().then((r) => {
      if (fetchGenRef.current === gen && !sendPendingRef.current) dispatch(setMessages(mapHistoryToMessages(r.data)));
    }).catch(() => {});
  }, [panelActive, isAuthenticated, enforcedLogout, isModal, persistState, dispatch, triggerHistory]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages.length, loading, streamingText]);
  useEffect(() => {
    if (enforcedLogout || !persistState || !authSuccess || !pendingMessage) return;
    const msg = pendingMessage; setPendingMessage(""); dispatch(setAuthSuccess(false)); doSend(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSuccess, enforcedLogout]);

  const doSend = async (content) => {
    sendPendingRef.current = true;
    const userMsg = { role: "user", content, timestamp: new Date().toISOString() };
    if (persistState) { dispatch(addMessage(userMsg)); dispatch(clearError()); }
    else { setLocalMessages((p) => [...p, userMsg]); setLocalError(null); }
    setInput("");
    const outcome = persistState
      ? await sendStreamMessage(content)
      : await sendStreamMessage(content, { persistMessages: false, onAiMessage: (m) => setLocalMessages((p) => [...p, m]), onLoadingChange: setLocalLoading, onError: setLocalError, onDailyCount: setLocalDailyCount });
    if (outcome === "completed" && persistState) await refreshHistorySafely(triggerHistory, fetchGenRef, dispatch);
    sendPendingRef.current = false;
  };
  const handleSend = (content = input.trim()) => {
    if (!content) return;
    if (!isAuthenticated) { if (persistState) setPendingMessage(content); dispatch(openAuthModal("login")); return; }
    doSend(content);
  };
  const handleContactRedirect = () => { if (isModal) dispatch(toggleModal()); dispatch(openContactModal()); };
  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const bubbleClass = (role) => `chat-panel__bubble chat-panel__bubble--${role === "user" ? "user" : "bot"}`;
  const bubbleTestId = (role) => (role === "user" ? "chat-bubble-user" : "chat-bubble-bot");

  return (
    <div data-testid="chat-panel" className={`chat-panel ${isModal ? "chat-panel--modal" : "chat-panel--inline"}`}>
      <div ref={listRef} data-testid="chat-messages" className="chat-panel__messages">
        <div data-testid="chat-bubble-bot" className="chat-panel__bubble chat-panel__bubble--bot">{WELCOME_TEXT}</div>
        {messages.map((m, i) => (
          <div key={i} data-testid={bubbleTestId(m.role)} className={bubbleClass(m.role)}>{m.content}</div>
        ))}
        {isStreaming && streamingText && (
          <div data-testid="chat-bubble-bot" className="chat-panel__bubble chat-panel__bubble--bot">{streamingText}</div>
        )}
        {messages.length > 0 && renderInquiryButton(messages, handleContactRedirect)}
        {loading && !isStreaming && <div className="chat-panel__loading"><Spinner animation="border" size="sm" /></div>}
        {error === "rate_limit" && <Alert variant="warning" className="mt-2">You have reached your daily message limit. Please try again tomorrow.</Alert>}
        {error === "ai_unavailable" && (
          <Alert variant="warning" className="mt-2">Our AI assistant is temporarily unavailable. You can still leave your question and we will respond within 24 hours.
            <div className="mt-2"><Button variant="primary" size="sm" onClick={handleContactRedirect}>Leave your question</Button></div>
          </Alert>
        )}
        {error === "generic" && <Alert variant="danger" className="mt-2">Something went wrong. Please try again.</Alert>}
      </div>
      <Badge bg="secondary" className="chat-panel__count">Messages today: {dailyCount} / {DAILY_MESSAGE_LIMIT}</Badge>
      {error !== "rate_limit" && (
        <div className="chat-panel__input-row">
          <Form.Control data-testid="chat-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message…" disabled={loading} className="chat-panel__input" />
          <Button data-testid="chat-send-btn" variant="primary" onClick={() => handleSend()} disabled={loading || !input.trim()} className="chat-panel__send-btn" aria-label="Send message">
            <i className="bi bi-send-fill" aria-hidden="true" />
          </Button>
        </div>
      )}
      <p data-testid="chat-panel-disclaimer" className="chat-panel__disclaimer">{DISCLAIMER_TEXT}</p>
    </div>
  );
}
