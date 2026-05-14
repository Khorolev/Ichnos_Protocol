import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ProfileCompletionForm from './ProfileCompletionForm';

const defaultProps = {
  completionFields: { name: 'John', surname: 'Doe' },
  onFieldChange: vi.fn(),
  canonicalEmail: 'test@example.com',
  loading: false,
  onSubmit: vi.fn((e) => e.preventDefault()),
  onLogout: vi.fn(),
};

function renderForm(overrides = {}) {
  return render(<ProfileCompletionForm {...defaultProps} {...overrides} />);
}

describe('ProfileCompletionForm', () => {
  it('renders Name, Surname, and disabled Email fields with correct values', () => {
    renderForm();

    expect(screen.getByLabelText('Name')).toHaveValue('John');
    expect(screen.getByLabelText('Surname')).toHaveValue('Doe');
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('displays canonicalEmail and email field is disabled', () => {
    renderForm({ canonicalEmail: 'custom@mail.com' });

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveValue('custom@mail.com');
    expect(emailInput).toBeDisabled();
  });

  it('calls onFieldChange when Name input changes', async () => {
    const onFieldChange = vi.fn();
    const user = userEvent.setup();
    renderForm({ onFieldChange, completionFields: { name: '', surname: '' } });

    await user.type(screen.getByLabelText('Name'), 'A');

    expect(onFieldChange).toHaveBeenCalledWith({ name: 'A', surname: '' });
  });

  it('calls onFieldChange when Surname input changes', async () => {
    const onFieldChange = vi.fn();
    const user = userEvent.setup();
    renderForm({ onFieldChange, completionFields: { name: '', surname: '' } });

    await user.type(screen.getByLabelText('Surname'), 'B');

    expect(onFieldChange).toHaveBeenCalledWith({ name: '', surname: 'B' });
  });

  it('calls onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    const user = userEvent.setup();
    renderForm({ onSubmit });

    const submitBtn = screen.getByRole('button', { name: /Continue/i });
    await user.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('calls onLogout when Logout button is clicked', async () => {
    const onLogout = vi.fn();
    const user = userEvent.setup();
    renderForm({ onLogout });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('shows spinner and disables Continue button when loading is true', () => {
    renderForm({ loading: true });

    const submitBtn = screen.getByRole('button', { name: /Continue/i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId('auth-submit-spinner')).toBeInTheDocument();
  });
});
