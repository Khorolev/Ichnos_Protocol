import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';

import {
  addMessage,
  setMessages,
  toggleModal,
  setLoading,
  setError,
  setDailyCount,
  clearError,
} from '../../features/chat/chatSlice';
import { openModal as openContactModal } from '../../features/contact/contactSlice';
import {
  useSendMessageMutation,
  useGetHistoryQuery,
} from '../../features/chat/chatApi';
import { mapHistoryToMessages } from '../../helpers/chatMessageMapper';
import { DAILY_MESSAGE_LIMIT } from '../../constants/chat';
import AuthModal from './AuthModal';
import ChatMessage from '../molecules/ChatMessage';
import ChatInputArea from '../molecules/ChatInputArea';
import Button from '../atoms/Button';

export default function ChatModal() {
  const dispatch = useDispatch();
  const { isOpen, messages, loading, error, dailyCount } = useSelector(
    (state) => state.chat,
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [input, setInput] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [authJustSucceeded, setAuthJustSucceeded] = useState(false);
  const listRef = useRef(null);

  const [sendMessage] = useSendMessageMutation();
  const { data: historyData } = useGetHistoryQuery(undefined, {
    skip: !isAuthenticated || !isOpen,
  });

  useEffect(() => {
    if (isOpen && !isAuthenticated) setAuthModalOpen(true);
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (historyData?.data && isOpen) {
      dispatch(setMessages(mapHistoryToMessages(historyData.data)));
    }
  }, [historyData, isOpen, dispatch]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, loading]);

  useEffect(() => {
    if (authJustSucceeded && isAuthenticated && pendingMessage) {
      const msg = pendingMessage;
      setPendingMessage('');
      setAuthJustSucceeded(false);
      doSend(msg);
    }
  }, [authJustSucceeded, isAuthenticated]);

  const doSend = async (content) => {
    dispatch(addMessage({ role: 'user', content, timestamp: new Date().toISOString() }));
    setInput('');
    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      const result = await sendMessage({ question: content }).unwrap();
      const answer = result?.data?.answer;
      const count = result?.data?.dailyCount;
      if (answer) {
        dispatch(addMessage({ role: 'ai', content: answer, timestamp: new Date().toISOString() }));
      }
      if (count != null) dispatch(setDailyCount(count));
    } catch (err) {
      const status = err?.status;
      if (status === 429) dispatch(setError('rate_limit'));
      else if (status === 503) dispatch(setError('ai_unavailable'));
      else dispatch(setError('generic'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSend = (content = input.trim()) => {
    if (!content) return;

    if (!isAuthenticated) {
      setPendingMessage(content);
      setAuthModalOpen(true);
      return;
    }

    doSend(content);
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    setAuthJustSucceeded(true);
  };

  const handleContactRedirect = () => {
    dispatch(toggleModal());
    dispatch(openContactModal());
  };

  const isRateLimited = error === 'rate_limit';

  return (
    <>
      <Modal show={isOpen} onHide={() => dispatch(toggleModal())} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Chat with Ichnos AI</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column" style={{ height: '60vh' }}>
          <p className="small text-muted mb-2">
            Conversations are stored to improve our service.{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </p>

          <div ref={listRef} className="flex-grow-1 overflow-auto d-flex flex-column mb-2">
            {messages.map((msg, i) => (
              <ChatMessage key={i} {...msg} />
            ))}
            {messages.length > 0 && renderInquiryButton(messages, handleContactRedirect)}
            {loading && (
              <div className="align-self-start mb-2">
                <Spinner animation="border" size="sm" />
              </div>
            )}
            {error === 'rate_limit' && (
              <Alert variant="warning" className="mt-2">
                You have reached your daily message limit. Please try again tomorrow.
              </Alert>
            )}
            {error === 'ai_unavailable' && (
              <Alert variant="warning" className="mt-2">
                Our AI assistant is temporarily unavailable. You can still leave
                your question and we will respond within 24 hours.
                <div className="mt-2">
                  <Button variant="primary" size="sm" onClick={handleContactRedirect}>
                    Leave your question
                  </Button>
                </div>
              </Alert>
            )}
            {error === 'generic' && (
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
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

function renderInquiryButton(messages, onRedirect) {
  const lastAi = [...messages].reverse().find((m) => m.role === 'ai');
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
