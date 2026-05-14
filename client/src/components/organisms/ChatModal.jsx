import { useSelector, useDispatch } from "react-redux";
import Modal from "react-bootstrap/Modal";

import { toggleModal } from "../../features/chat/chatSlice";
import ChatPanel from "../molecules/ChatPanel";

export default function ChatModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.chat.isOpen);

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
      <Modal.Body className="d-flex flex-column">
        <ChatPanel mode="modal" persistState={true} />
      </Modal.Body>
    </Modal>
  );
}
