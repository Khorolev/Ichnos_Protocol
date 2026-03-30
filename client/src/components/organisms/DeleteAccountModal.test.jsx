import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

import { renderWithProviders, screen } from '../../test-utils';
import DeleteAccountModal from './DeleteAccountModal';

describe('DeleteAccountModal', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when show is true', () => {
    renderWithProviders(
      <DeleteAccountModal show onClose={onClose} onConfirm={onConfirm} isLoading={false} />,
    );

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not render when show is false', () => {
    renderWithProviders(
      <DeleteAccountModal show={false} onClose={onClose} onConfirm={onConfirm} isLoading={false} />,
    );

    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
  });

  it('has Delete Account button disabled initially', () => {
    renderWithProviders(
      <DeleteAccountModal show onClose={onClose} onConfirm={onConfirm} isLoading={false} />,
    );

    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeDisabled();
  });

  it('keeps Delete Account disabled with partial confirmation text', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DeleteAccountModal show onClose={onClose} onConfirm={onConfirm} isLoading={false} />,
    );

    await user.type(screen.getByPlaceholderText('DELETE MY ACCOUNT'), 'DELETE MY');

    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeDisabled();
  });

  it('enables Delete Account button after typing exact confirmation phrase', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DeleteAccountModal show onClose={onClose} onConfirm={onConfirm} isLoading={false} />,
    );

    await user.type(screen.getByPlaceholderText('DELETE MY ACCOUNT'), 'DELETE MY ACCOUNT');

    expect(screen.getByRole('button', { name: 'Delete Account' })).toBeEnabled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DeleteAccountModal show onClose={onClose} onConfirm={onConfirm} isLoading={false} />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onConfirm when Delete Account is clicked after typing confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DeleteAccountModal show onClose={onClose} onConfirm={onConfirm} isLoading={false} />,
    );

    await user.type(screen.getByPlaceholderText('DELETE MY ACCOUNT'), 'DELETE MY ACCOUNT');
    await user.click(screen.getByRole('button', { name: 'Delete Account' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('shows spinner when isLoading is true', () => {
    renderWithProviders(
      <DeleteAccountModal show onClose={onClose} onConfirm={onConfirm} isLoading />,
    );

    expect(document.querySelector('.spinner-border')).toBeInTheDocument();
  });

  it('displays the confirmation phrase instruction', () => {
    renderWithProviders(
      <DeleteAccountModal show onClose={onClose} onConfirm={onConfirm} isLoading={false} />,
    );

    expect(screen.getByText('DELETE MY ACCOUNT')).toBeInTheDocument();
    expect(screen.getByText(/Type/)).toBeInTheDocument();
  });
});
