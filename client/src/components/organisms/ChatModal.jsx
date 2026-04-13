import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "react-bootstrap/Modal";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";

import {
  addMessage,
  setMessages,
  toggleModal,
  clearError,
} from "../../features/chat/chatSlice";
import { openModal as openContactModal } from "../../features/contact/contactSlice";
import { useLazyGetHistoryQuery } from "../../features/chat/chatApi";
import { mapHistoryToMessages } from "../../helpers/chatMessageMapper";
import { useChatStream } from "../../hooks/useChatStream";
import { DAILY_MESSAGE_LIMIT } from "../../constants/chat";
import {
  openAuthModal,
  setAuthSuccess,
} from "../../features/auth/authSlice";
import ChatMessage from "../molecules/ChatMessage";
import ChatInputArea from "../molecules/ChatInputArea";
import Button from "../atoms/Button";

export default function ChatModal() {
  const dispatch = useDispatch();
  const { isOpen, messages, loading, error, dailyCount } = useSelector(
    (state) => state.chat,
  );
  const { isAuthenticated, authSuccess, enforcedLogout } = useSelector(
    (state) => state.auth,
  );

  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const listRef = useRef(null);
  const sendPendingRef = useRef(false);
  const fetchGenRef = useRef(0);

  const { streamingText, isStreaming, sendStreamMessage, cancelStream } =
    useChatStream();
  const [triggerHistory] = useLazyGetHistoryQuery();

  useEffect(() => {
    if (!isOpen && isStreaming) cancelStream();
  }, [isOpen, isStreaming, cancelStream]);

  useEffect(() => {
    if (enforcedLogout) {
      setPendingMessage("");
      return;
    }
    if (isOpen && !isAuthenticated) {
      dispatch(openAuthModal('login'));
    }
    if (isOpen && isAuthenticated && !sendPendingRef.current) {
      const gen = ++fetchGenRef.current;
      triggerHistory()
        .unwrap()
        .then((result) => {
          if (fetchGenRef.current === gen && !sendPendingRef.current) {
            dispatch(setMessages(mapHistoryToMessages(result.data)));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, isAuthenticated, enforcedLogout, dispatch, triggerHistory]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, loading, streamingText]);

  useEffect(() => {
    if (enforcedLogout) return;
    if (authSuccess && pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage("");
      dispatch(setAuthSuccess(false));
      doSend(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSuccess, enforcedLogout]);

  const doSend = async (content) => {
    sendPendingRef.current = true;
    dispatch(
      addMessage({
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      }),
    );
    setInput("");
    dispatch(clearError());
    const outcome = await sendStreamMessage(content);

    if (outcome === "completed") {
      const gen = ++fetchGenRef.current;
      try {
        const result = await triggerHistory().unwrap();
        if (fetchGenRef.current === gen) {
          dispatch(setMessages(mapHistoryToMessages(result.data)));
        }
      } catch {
        /* history refresh failed — keep optimistic conversation */
      }
      sendPendingRef.current = false;
    } else {
      sendPendingRef.current = false;
    }
  };

  const handleSend = (content = input.trim()) => {
    if (!content) return;

    if (!isAuthenticated) {
      setPendingMessage(content);
      dispatch(openAuthModal('login'));
      return;
    }

    doSend(content);
  };

  const handleContactRedirect = () => {
    dispatch(toggleModal());
    dispatch(openContactModal());
  };

  const isRateLimited = error === "rate_limit";

  return (
    <Modal
      show={isOpen}
      onHide={() => dispatch(toggleModal())}
      size="lg"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>Chat with Ichnos AI</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-column" style={{ height: "60vh" }}>
        <p className="small text-muted mb-2">
          Conversations are stored to improve our service.{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </p>

        <div
          ref={listRef}
          className="flex-grow-1 overflow-auto d-flex flex-column mb-2"
        >
          {messages.map((msg, i) => (
            <ChatMessage key={i} {...msg} />
          ))}
          {isStreaming && streamingText && (
            <ChatMessage role="ai" content={streamingText} />
          )}
          {messages.length > 0 &&
            renderInquiryButton(messages, handleContactRedirect)}
          {loading && !isStreaming && (
            <div className="align-self-start mb-2">
              <Spinner animation="border" size="sm" />
            </div>
          )}
          {error === "rate_limit" && (
            <Alert variant="warning" className="mt-2">
              You have reached your daily message limit. Please try again
              tomorrow.
            </Alert>
          )}
          {error === "ai_unavailable" && (
            <Alert variant="warning" className="mt-2">
              Our AI assistant is temporarily unavailable. You can still leave
              your question and we will respond within 24 hours.
              <div className="mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleContactRedirect}
                >
                  Leave your question
                </Button>
              </div>
            </Alert>
          )}
          {error === "generic" && (
            <Alert variant="danger" className="mt-2">
              Something went wrong. Please try again.
            </Alert>
          )}
        </div>

        <Badge bg="secondary" className="align-self-start mb-2">
          Messages today: {dailyCount} / {DAILY_MESSAGE_LIMIT}
        </Badge>

        {!isRateLimited && (
          <ChatInputArea
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            disabled={loading}
          />
        )}
      </Modal.Body>
    </Modal>
  );
}

function renderInquiryButton(messages, onRedirect) {
  const lastAi = [...messages].reverse().find((m) => m.role === "ai");
  if (!lastAi) return null;
  if (!/submit a formal inquiry/i.test(lastAi.content)) return null;

  return (
    <div className="align-self-start mb-2">
      <Button variant="outline-primary" size="sm" onClick={onRedirect}>
        Submit inquiry
      </Button>
    </div>
  );
}
