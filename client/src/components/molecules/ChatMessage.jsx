export default function ChatMessage({ role, content, timestamp }) {
  const isUser = role === 'user';
  const alignment = isUser ? 'align-self-end' : 'align-self-start';
  const bg = isUser ? 'bg-primary text-white' : 'bg-light';

  return (
    <div className={`${alignment} mb-2`} style={{ maxWidth: '80%' }}>
      <div className={`${bg} rounded p-2`}>{content}</div>
      {timestamp && (
        <small className="text-muted">
          {new Date(timestamp).toLocaleTimeString()}
        </small>
      )}
    </div>
  );
}
