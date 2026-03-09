export function mapHistoryToMessages(history) {
  const messages = [];
  for (const entry of history) {
    messages.push({
      role: 'user',
      content: entry.question,
      timestamp: entry.created_at,
    });
    messages.push({
      role: 'ai',
      content: entry.answer,
      timestamp: entry.created_at,
    });
  }
  return messages;
}
