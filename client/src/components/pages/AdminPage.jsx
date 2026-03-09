import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';

import AdminLayout from '../templates/AdminLayout';
import AdminKanban from '../organisms/AdminKanban';
import ChatOnlyLeads from '../organisms/ChatOnlyLeads';
import UserTimeline from '../organisms/UserTimeline';
import TopicAnalytics from '../organisms/TopicAnalytics';
import { selectUser } from '../../features/admin/adminSlice';
import {
  useLazyExportCSVQuery,
  useManageAdminsMutation,
} from '../../features/admin/adminApi';
import { useSuperAdminCheck } from '../../hooks/useSuperAdminCheck';

export default function AdminPage() {
  const dispatch = useDispatch();
  const selectedUser = useSelector((state) => state.admin.selectedUser);
  const [requestsSubTab, setRequestsSubTab] = useState('inquiries');

  const [triggerExport] = useLazyExportCSVQuery();
  const [exportError, setExportError] = useState(null);

  const isSuperAdmin = useSuperAdminCheck();
  const [manageAdmins] = useManageAdminsMutation();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminFeedback, setAdminFeedback] = useState(null);

  async function handleExport() {
    setExportError(null);
    try {
      const csvText = await triggerExport().unwrap();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('CSV export failed.');
    }
  }

  async function handleManageAdmin(action) {
    setAdminFeedback(null);
    try {
      await manageAdmins({ action, email: adminEmail }).unwrap();
      setAdminFeedback({
        type: 'success',
        message: `Admin ${action === 'add' ? 'added' : 'removed'}: ${adminEmail}`,
      });
      setAdminEmail('');
    } catch {
      setAdminFeedback({ type: 'danger', message: 'Failed to update admin.' });
    }
  }

  return (
    <AdminLayout>
      <Tabs defaultActiveKey="requests" className="mb-3">
        <Tab eventKey="requests" title="Requests">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Nav
              variant="pills"
              activeKey={requestsSubTab}
              onSelect={setRequestsSubTab}
            >
              <Nav.Item>
                <Nav.Link eventKey="inquiries">Inquiries</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="chat-leads">Chat-only Leads</Nav.Link>
              </Nav.Item>
            </Nav>
            <Button variant="success" size="sm" onClick={handleExport}>
              Export CSV
            </Button>
          </div>
          {exportError && (
            <Alert variant="danger" dismissible onClose={() => setExportError(null)}>
              {exportError}
            </Alert>
          )}
          {requestsSubTab === 'inquiries' && <AdminKanban />}
          {requestsSubTab === 'chat-leads' && <ChatOnlyLeads />}
        </Tab>
        <Tab eventKey="analytics" title="Analytics">
          <TopicAnalytics />
        </Tab>
        {isSuperAdmin && (
          <Tab eventKey="settings" title="Settings">
            <AdminSettingsTab
              adminEmail={adminEmail}
              setAdminEmail={setAdminEmail}
              adminFeedback={adminFeedback}
              onManageAdmin={handleManageAdmin}
              onDismissFeedback={() => setAdminFeedback(null)}
            />
          </Tab>
        )}
      </Tabs>

      <UserTimeline
        userId={selectedUser}
        onClose={() => dispatch(selectUser(null))}
      />
    </AdminLayout>
  );
}

function AdminSettingsTab({
  adminEmail,
  setAdminEmail,
  adminFeedback,
  onManageAdmin,
  onDismissFeedback,
}) {
  return (
    <div style={{ maxWidth: 400 }}>
      <h5 className="mb-3">Manage Admins</h5>
      {adminFeedback && (
        <Alert variant={adminFeedback.type} dismissible onClose={onDismissFeedback}>
          {adminFeedback.message}
        </Alert>
      )}
      <Form.Control
        type="email"
        placeholder="Admin email"
        value={adminEmail}
        onChange={(e) => setAdminEmail(e.target.value)}
        className="mb-2"
      />
      <div className="d-flex gap-2">
        <Button variant="primary" size="sm" onClick={() => onManageAdmin('add')}>
          Add Admin
        </Button>
        <Button variant="outline-danger" size="sm" onClick={() => onManageAdmin('remove')}>
          Remove Admin
        </Button>
      </div>
    </div>
  );
}
