import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../features/admin/adminApi', () => {
  const leadsData = {
    data: [
      {
        userId: 'uid-1',
        name: 'Alice',
        email: 'alice@test.com',
        company: 'Beta',
        totalMessages: 5,
        lastActivity: '2025-02-01',
      },
    ],
  };
  const detailData = {
    data: [
      { question: 'What is Ichnos?', answer: 'A battery passport company.' },
    ],
  };

  return {
    useGetChatLeadsQuery: () => ({ data: leadsData, isLoading: false }),
    useGetChatLeadDetailQuery: () => ({ data: detailData, isLoading: false }),
    adminApi: {
      reducerPath: 'adminApi',
      reducer: (state = {}) => state,
      middleware: () => (next) => (action) => next(action),
    },
  };
});

describe('ChatOnlyLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with leads', async () => {
    const { default: ChatOnlyLeads } = await import('./ChatOnlyLeads');
    render(<ChatOnlyLeads />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('opens Offcanvas when row is clicked', async () => {
    const user = userEvent.setup();
    const { default: ChatOnlyLeads } = await import('./ChatOnlyLeads');
    render(<ChatOnlyLeads />);

    await user.click(screen.getByText('Alice'));
    expect(screen.getByText('Chat History')).toBeInTheDocument();
  });

  it('shows Q&A in Offcanvas', async () => {
    const user = userEvent.setup();
    const { default: ChatOnlyLeads } = await import('./ChatOnlyLeads');
    render(<ChatOnlyLeads />);

    await user.click(screen.getByText('Alice'));
    expect(screen.getByText('Q: What is Ichnos?')).toBeInTheDocument();
    expect(screen.getByText('A: A battery passport company.')).toBeInTheDocument();
  });
});
