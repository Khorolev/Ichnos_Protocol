import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';

import AdminLayout from '../templates/AdminLayout';
import AdminKanban from '../organisms/AdminKanban';
import ChatOnlyLeads from '../organisms/ChatOnlyLeads';
import UserTimeline from '../organisms/UserTimeline';
import { selectUser } from '../../features/admin/adminSlice';

export default function AdminPage() {
  const dispatch = useDispatch();
  const selectedUser = useSelector((state) => state.admin.selectedUser);
  const [requestsSubTab, setRequestsSubTab] = useState('inquiries');

  return (
    <AdminLayout>
      <Tabs defaultActiveKey="requests" className="mb-3">
        <Tab eventKey="requests" title="Requests">
          <Nav
            variant="pills"
            activeKey={requestsSubTab}
            onSelect={setRequestsSubTab}
            className="mb-3"
          >
            <Nav.Item>
              <Nav.Link eventKey="inquiries">Inquiries</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="chat-leads">Chat-only Leads</Nav.Link>
            </Nav.Item>
          </Nav>
          {requestsSubTab === 'inquiries' && <AdminKanban />}
          {requestsSubTab === 'chat-leads' && <ChatOnlyLeads />}
        </Tab>
        <Tab eventKey="analytics" title="Analytics">
          <p>Analytics coming soon (D3)</p>
        </Tab>
        <Tab eventKey="settings" title="Settings">
          <p>Settings coming soon (D3)</p>
        </Tab>
      </Tabs>

      <UserTimeline
        userId={selectedUser}
        onClose={() => dispatch(selectUser(null))}
      />
    </AdminLayout>
  );
}
