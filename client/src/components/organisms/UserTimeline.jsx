import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Alert from "react-bootstrap/Alert";
import Offcanvas from "react-bootstrap/Offcanvas";
import ListGroup from "react-bootstrap/ListGroup";
import Spinner from "react-bootstrap/Spinner";

import {
  useGetRequestsQuery,
  useUpdateRequestMutation,
  useDeleteRequestMutation,
} from "../../features/admin/adminApi";
import InquiryStatusBadge from "../atoms/InquiryStatusBadge";
import RequestDetail from "./RequestDetail";

function truncate(text, max = 100) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

function getPreviewText(request) {
  return request.questionPreview || request.question_preview || "";
}

function useDetailState() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [mutationError, setMutationError] = useState(null);

  function closeDetail() {
    setSelectedRequest(null);
    setMutationError(null);
  }

  function openDetail(req) {
    setMutationError(null);
    setSelectedRequest(req);
  }

  return {
    selectedRequest,
    mutationError,
    setMutationError,
    closeDetail,
    openDetail,
  };
}

export default function UserTimeline({ userId, onClose }) {
  const {
    selectedRequest,
    mutationError,
    setMutationError,
    closeDetail,
    openDetail,
  } = useDetailState();
  const users = useSelector((state) => state.admin.users);
  const user = users.find((u) => u.userId === userId);

  useEffect(() => {
    closeDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  const { data, isLoading } = useGetRequestsQuery(userId, { skip: !userId });
  const [updateRequest] = useUpdateRequestMutation();
  const [deleteRequest] = useDeleteRequestMutation();

  const requests = data?.data || [];

  async function handleSave(updates) {
    try {
      await updateRequest({ id: selectedRequest.id, ...updates }).unwrap();
      closeDetail();
    } catch {
      setMutationError("Failed to save changes. Please try again.");
    }
  }

  async function handleDelete() {
    try {
      await deleteRequest(selectedRequest.id).unwrap();
      closeDetail();
    } catch {
      setMutationError("Failed to delete request. Please try again.");
    }
  }

  return (
    <Offcanvas
      show={!!userId}
      placement="end"
      data-testid="timeline-drawer"
      onHide={() => {
        closeDetail();
        onClose();
      }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {user?.name || "User"}
          <div className="small text-muted">{user?.email}</div>
          {user?.company && (
            <div className="small text-muted">{user.company}</div>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {isLoading && <Spinner animation="border" />}

        {!isLoading && !selectedRequest && (
          <ListGroup>
            {requests.map((req) => (
              <ListGroup.Item
                key={req.id}
                action
                onClick={() => openDetail(req)}
              >
                <div className="d-flex justify-content-between">
                  <span>{truncate(getPreviewText(req))}</span>
                  <InquiryStatusBadge status={req.status} />
                </div>
                <small className="text-muted">{req.created_at}</small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        {selectedRequest && (
          <>
            {mutationError && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setMutationError(null)}
              >
                {mutationError}
              </Alert>
            )}
            <RequestDetail
              request={selectedRequest}
              onBack={closeDetail}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
