import { describe, it, expect } from 'vitest';

import ApiSanityWarning from './ApiSanityWarning';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from '../../test-utils';

describe('ApiSanityWarning', () => {
  it('renders warning when provided', () => {
    renderWithProviders(<ApiSanityWarning warning="API unreachable" />);

    expect(screen.getByText('API unreachable')).toBeInTheDocument();
    expect(
      screen.getByText('API Configuration Warning'),
    ).toBeInTheDocument();
  });

  it('does not render when warning is null', () => {
    const { container } = renderWithProviders(
      <ApiSanityWarning warning={null} />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('can be dismissed', async () => {
    renderWithProviders(<ApiSanityWarning warning="API unreachable" />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText('API unreachable'),
      ).not.toBeInTheDocument();
    });
  });
});
