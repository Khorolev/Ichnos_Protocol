import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RequestDetail from './RequestDetail';

const mockRequest = {
  id: '1',
  status: 'new',
  adminNotes: 'Some notes',
  questionPreview: 'What is Ichnos?',
  questions: [{ text: 'What is Ichnos?' }, { text: 'How does it work?' }],
};

describe('RequestDetail', () => {
  const onBack = vi.fn();
  const onSave = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders status dropdown with current status', () => {
    render(
      <RequestDetail request={mockRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );
    const select = screen.getByLabelText('Status');
    expect(select.value).toBe('new');
  });

  it('renders admin notes textarea', () => {
    render(
      <RequestDetail request={mockRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );
    const textarea = screen.getByLabelText('Admin Notes');
    expect(textarea.value).toBe('Some notes');
  });

  it('renders questions', () => {
    render(
      <RequestDetail request={mockRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );
    expect(screen.getByText('What is Ichnos?')).toBeInTheDocument();
    expect(screen.getByText('How does it work?')).toBeInTheDocument();
  });

  it('calls onSave with updated values', async () => {
    const user = userEvent.setup();
    render(
      <RequestDetail request={mockRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ status: 'new', adminNotes: 'Some notes' });
  });

  it('calls onDelete after confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <RequestDetail request={mockRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('does not call onDelete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <RequestDetail request={mockRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('renders backend-shaped question objects with q.question', () => {
    const backendRequest = {
      ...mockRequest,
      questions: [
        { question: 'Backend question one', answer: 'Answer one', source: 'chat' },
        { question: 'Backend question two', answer: 'Answer two', source: 'form' },
      ],
    };
    render(
      <RequestDetail request={backendRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );
    expect(screen.getByText('Backend question one')).toBeInTheDocument();
    expect(screen.getByText('Backend question two')).toBeInTheDocument();
  });

  it('renders plain string questions', () => {
    const stringRequest = {
      ...mockRequest,
      questions: ['String question one', 'String question two'],
    };
    render(
      <RequestDetail request={stringRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );
    expect(screen.getByText('String question one')).toBeInTheDocument();
    expect(screen.getByText('String question two')).toBeInTheDocument();
  });

  it('calls onBack when Back is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RequestDetail request={mockRequest} onBack={onBack} onSave={onSave} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalled();
  });
});
