import Form from 'react-bootstrap/Form';
import Button from '../atoms/Button';

export default function ChatInputArea({ value, onChange, onSend, disabled }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="d-flex gap-2 mt-2">
      <Form.Control
        as="textarea"
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
      />
      <Button
        variant="primary"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="align-self-end"
      >
        Send
      </Button>
    </div>
  );
}
