import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { signOut } from 'firebase/auth';

import { auth } from '../../config/firebase';
import { logout } from '../../features/auth/authSlice';
import {
  useLazyDownloadDataQuery,
  useDeleteAccountMutation,
} from '../../features/gdpr/gdprApi';
import PageTransition from '../templates/PageTransition';
import Button from '../atoms/Button';
import DeleteAccountModal from '../organisms/DeleteAccountModal';

function triggerFileDownload(data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'my-data.json';
  link.click();
  URL.revokeObjectURL(url);
}

export default function PrivacyPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [triggerDownload, { isFetching: isDownloading }] =
    useLazyDownloadDataQuery();
  const [deleteAccount, { isLoading: isDeleting }] =
    useDeleteAccountMutation();

  async function handleDownload() {
    const result = await triggerDownload();
    if (result.data) {
      triggerFileDownload(result.data);
      setDownloadSuccess(true);
    }
  }

  async function handleConfirmDelete() {
    try {
      await deleteAccount().unwrap();
    } catch {
      setDeleteError('Something went wrong. Please try again later.');
      return;
    }

    try {
      await signOut(auth);
    } catch {
      setDeleteError('Account deleted, but sign-out failed. You will be redirected.');
    }

    dispatch(logout());
    navigate('/');
  }

  return (
    <div>
      <Helmet>
        <title>Privacy & Data | Ichnos Protocol</title>
        <meta
          name="description"
          content="Manage your personal data. Download or delete your account."
        />
      </Helmet>

      <PageTransition>
        <header className="text-center py-5">
          <h1 className="mb-3 page-title">Privacy &amp; Data Management</h1>
          <p className="lead section-subtext">
            View, download, or delete your personal data.
          </p>
        </header>

        <Container>
          {deleteError && (
            <Alert variant="danger" dismissible onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          )}

          <section className="mb-5">
            <h2 className="h4 mb-3">Privacy Policy</h2>
            <p>
              Ichnos Protocol collects only the personal data necessary to
              provide our services: your name, email address, and any
              documents you voluntarily upload. We do not sell or share your
              data with third parties for marketing purposes. Data is stored
              securely and retained only as long as needed to fulfill the
              purposes for which it was collected. You may request access,
              correction, or deletion of your data at any time using the
              controls below.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">Cookie Policy</h2>
            <p>
              We use strictly necessary cookies to maintain your
              authentication session and ensure the website functions
              correctly. We do not use tracking or advertising cookies.
              Third-party widgets (e.g., LinkedIn feed) may set their own
              cookies — please refer to the respective provider&apos;s cookie
              policy for details.
            </p>
          </section>

          <section className="text-center mb-5">
            <h2 className="h4 mb-3">Download Your Data</h2>
            <p>
              Export all personal data we hold about you as a JSON file.
            </p>
            {downloadSuccess && (
              <Alert variant="success">Your data has been downloaded.</Alert>
            )}
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                'Download My Data'
              )}
            </Button>
          </section>

          <section className="text-center mb-5">
            <h2 className="h4 mb-3">Delete Your Account</h2>
            <p>
              Permanently remove your contact details and scrub identifiable
              patterns from your questions. This action cannot be undone.
            </p>
            <Button variant="danger" onClick={() => setModalOpen(true)}>
              Delete My Account
            </Button>
          </section>
        </Container>
      </PageTransition>

      <DeleteAccountModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
