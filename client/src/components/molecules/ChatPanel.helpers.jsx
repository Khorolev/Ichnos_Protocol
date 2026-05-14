import Button from "../atoms/Button";
import { setMessages } from "../../features/chat/chatSlice";
import { mapHistoryToMessages } from "../../helpers/chatMessageMapper";

export function renderInquiryButton(messages, onRedirect) {
  const lastAi = [...messages].reverse().find((m) => m.role === "ai");
  if (!lastAi || !/submit a formal inquiry/i.test(lastAi.content)) return null;
  return (
    <div className="align-self-start mb-2">
      <Button variant="outline-primary" size="sm" onClick={onRedirect}>Submit inquiry</Button>
    </div>
  );
}

export async function refreshHistorySafely(triggerHistory, fetchGenRef, dispatch) {
  const gen = ++fetchGenRef.current;
  try {
    const r = await triggerHistory().unwrap();
    if (fetchGenRef.current === gen) dispatch(setMessages(mapHistoryToMessages(r.data)));
  } catch { /* keep optimistic */ }
}
