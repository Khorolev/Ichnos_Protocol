import { useState } from 'react';
import Table from 'react-bootstrap/Table';
import Offcanvas from 'react-bootstrap/Offcanvas';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';

import {
  useGetChatLeadsQuery,
  useGetChatLeadDetailQuery,
} from '../../features/admin/adminApi';

export default function ChatOnlyLeads() {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { data, isLoading } = useGetChatLeadsQuery();
  const { data: detail, isLoading: detailLoading } = useGetChatLeadDetailQuery(
    selectedUserId,
    { skip: !selectedUserId },
  );

  const leads = data?.data || [];
  const conversations = detail?.data || [];

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <Table hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Total Messages</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.userId}
              role="button"
              onClick={() => setSelectedUserId(lead.userId)}
            >
              <td>{lead.name}</td>
              <td>{lead.email}</td>
              <td>{lead.company}</td>
              <td>{lead.totalMessages}</td>
              <td>{lead.lastActivity}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Offcanvas
        show={!!selectedUserId}
        placement="end"
        data-testid="chat-drawer"
        onHide={() => setSelectedUserId(null)}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Chat History</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {detailLoading && <Spinner animation="border" />}
          {!detailLoading && (
            <ListGroup>
              {conversations.map((item, i) => (
                <ListGroup.Item key={`${item.question}-${i}`}>
                  <div className="fw-bold">Q: {item.question}</div>
                  <div className="text-muted">A: {item.answer}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
