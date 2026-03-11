import { useState } from 'react';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

import {
  useGetTopicsQuery,
  useAnalyzeTopicsMutation,
} from '../../features/admin/adminApi';

export default function TopicAnalytics() {
  const { data: topicsResponse, isLoading } = useGetTopicsQuery();
  const [analyzeTopics, { isLoading: isAnalyzing }] =
    useAnalyzeTopicsMutation();
  const [feedback, setFeedback] = useState(null);

  const topics = topicsResponse?.data ?? [];

  async function handleRecompute() {
    setFeedback(null);
    try {
      const result = await analyzeTopics().unwrap();
      const d = result.data;
      setFeedback({
        type: 'success',
        message: `Processed ${d.processed} questions, skipped ${d.skipped}.`,
      });
    } catch {
      setFeedback({ type: 'danger', message: 'Topic analysis failed.' });
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Topic Analytics</h5>
        <Button
          variant="outline-primary"
          size="sm"
          disabled={isAnalyzing}
          onClick={handleRecompute}
        >
          {isAnalyzing ? 'Analyzing...' : 'Recompute Topics'}
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} dismissible onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" />
        </div>
      ) : (
        <Table striped hover responsive size="sm">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Count</th>
              <th>Avg Confidence</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.topic}>
                <td>{t.topic}</td>
                <td>{t.count}</td>
                <td>{t.avg_confidence ? Number(t.avg_confidence).toFixed(2) : '-'}</td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted">
                  No topics found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
