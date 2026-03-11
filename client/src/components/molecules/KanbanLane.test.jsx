import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import KanbanLane from './KanbanLane';

const mockUser = {
  userId: 'uid-1',
  name: 'Jane Doe',
  email: 'jane@test.com',
  company: 'Acme',
  totalRequests: 3,
  lastActivity: '2025-01-15',
};

const mockRequests = [
  { id: '1', status: 'new', questionPreview: 'Question one', created_at: '2025-01-10' },
  { id: '2', status: 'resolved', questionPreview: 'Question two', created_at: '2025-01-12' },
];

describe('KanbanLane', () => {
  const onToggle = vi.fn();
  const onSelectUser = vi.fn();

  it('renders user name, email, and company', () => {
    render(
      <KanbanLane
        user={mockUser}
        isExpanded={false}
        onToggle={onToggle}
        onSelectUser={onSelectUser}
        requests={[]}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    expect(screen.getByText('(Acme)')).toBeInTheDocument();
  });

  it('calls onToggle when chevron is clicked', async () => {
    const user = userEvent.setup();
    render(
      <KanbanLane
        user={mockUser}
        isExpanded={false}
        onToggle={onToggle}
        onSelectUser={onSelectUser}
        requests={[]}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(onToggle).toHaveBeenCalledWith('uid-1');
  });

  it('shows cards in correct columns when expanded', () => {
    render(
      <KanbanLane
        user={mockUser}
        isExpanded={true}
        onToggle={onToggle}
        onSelectUser={onSelectUser}
        requests={mockRequests}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Question one')).toBeInTheDocument();
    expect(screen.getByText('Question two')).toBeInTheDocument();
  });

  it('calls onSelectUser when card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <KanbanLane
        user={mockUser}
        isExpanded={true}
        onToggle={onToggle}
        onSelectUser={onSelectUser}
        requests={mockRequests}
        isLoading={false}
      />,
    );

    await user.click(screen.getByText('Question one'));
    expect(onSelectUser).toHaveBeenCalledWith('uid-1');
  });

  it('does not show cards when collapsed', () => {
    render(
      <KanbanLane
        user={mockUser}
        isExpanded={false}
        onToggle={onToggle}
        onSelectUser={onSelectUser}
        requests={mockRequests}
        isLoading={false}
      />,
    );
    expect(screen.queryByText('Question one')).not.toBeInTheDocument();
  });
});
