import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockAnalyzeTopics = vi.fn();
let mockTopicsData = { data: [] };
let mockIsLoading = false;
let mockIsAnalyzing = false;

vi.mock('../../features/admin/adminApi', () => ({
  useGetTopicsQuery: () => ({ data: mockTopicsData, isLoading: mockIsLoading }),
  useAnalyzeTopicsMutation: () => [
    mockAnalyzeTopics,
    { isLoading: mockIsAnalyzing },
  ],
}));

describe('TopicAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTopicsData = { data: [] };
    mockIsLoading = false;
    mockIsAnalyzing = false;
    mockAnalyzeTopics.mockReturnValue({ unwrap: () => Promise.resolve({ data: { processed: 0, skipped: 0 } }) });
  });

  it('renders heading and recompute button', async () => {
    const { default: TopicAnalytics } = await import('./TopicAnalytics');
    render(<TopicAnalytics />);

    expect(screen.getByText('Topic Analytics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recompute Topics' })).toBeInTheDocument();
  });

  it('shows "No topics found" when data is empty', async () => {
    const { default: TopicAnalytics } = await import('./TopicAnalytics');
    render(<TopicAnalytics />);

    expect(screen.getByText('No topics found')).toBeInTheDocument();
  });

  it('renders topics in a table', async () => {
    mockTopicsData = {
      data: [
        { topic: 'battery', count: 10, avg_confidence: '0.85' },
        { topic: 'regulation', count: 5, avg_confidence: null },
      ],
    };
    const { default: TopicAnalytics } = await import('./TopicAnalytics');
    render(<TopicAnalytics />);

    expect(screen.getByText('battery')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('0.85')).toBeInTheDocument();
    expect(screen.getByText('regulation')).toBeInTheDocument();
  });

  it('shows spinner when loading', async () => {
    mockIsLoading = true;
    const { default: TopicAnalytics } = await import('./TopicAnalytics');
    render(<TopicAnalytics />);

    expect(screen.queryByText('No topics found')).not.toBeInTheDocument();
  });

  it('calls analyzeTopics on recompute click', async () => {
    const user = userEvent.setup();
    mockAnalyzeTopics.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { processed: 3, skipped: 1 } }),
    });

    const { default: TopicAnalytics } = await import('./TopicAnalytics');
    render(<TopicAnalytics />);

    await user.click(screen.getByRole('button', { name: 'Recompute Topics' }));

    expect(mockAnalyzeTopics).toHaveBeenCalled();
  });
});
