import Alert from 'react-bootstrap/Alert';

export default function ApiSanityWarning({ warning }) {
  if (!warning) return null;

  return (
    <Alert variant="warning" dismissible className="mb-0">
      <Alert.Heading as="h6" className="mb-1">
        API Configuration Warning
      </Alert.Heading>
      {warning}
    </Alert>
  );
}
