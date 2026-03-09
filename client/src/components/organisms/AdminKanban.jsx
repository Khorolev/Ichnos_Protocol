import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';

import { setUsers, toggleLane, selectUser } from '../../features/admin/adminSlice';
import { useGetUsersQuery, useGetRequestsQuery, adminApi } from '../../features/admin/adminApi';
import KanbanLane from '../molecules/KanbanLane';

function LaneLoader({ user, isExpanded, onToggle, onSelectUser }) {
  const { data: requests, isLoading } = useGetRequestsQuery(user.userId, {
    skip: !isExpanded,
  });

  return (
    <KanbanLane
      user={user}
      isExpanded={isExpanded}
      onToggle={onToggle}
      onSelectUser={onSelectUser}
      requests={requests?.data || []}
      isLoading={isLoading}
    />
  );
}

export default function AdminKanban() {
  const dispatch = useDispatch();
  const { users, expandedLanes } = useSelector((state) => state.admin);
  const { data, isLoading } = useGetUsersQuery();

  useEffect(() => {
    if (data?.data) {
      dispatch(setUsers(data.data));
    }
  }, [data, dispatch]);

  function handleRefresh() {
    dispatch(adminApi.util.invalidateTags(['AdminUsers', 'AdminRequests']));
  }

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Inquiries Board</h5>
        <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      <Row className="fw-bold border-bottom pb-2 mb-2 d-none d-md-flex">
        <Col>User</Col>
        <Col md={2}>New</Col>
        <Col md={2}>Contacted</Col>
        <Col md={2}>In Progress</Col>
        <Col md={2}>Resolved</Col>
      </Row>

      {users.map((user) => (
        <LaneLoader
          key={user.userId}
          user={user}
          isExpanded={expandedLanes.includes(user.userId)}
          onToggle={(id) => dispatch(toggleLane(id))}
          onSelectUser={(id) => dispatch(selectUser(id))}
        />
      ))}
    </div>
  );
}
