import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { auth } from '../config/firebase';
import { useSyncProfileMutation } from '../features/auth/authApi';
import { closeAuthModal } from '../features/auth/authSlice';
import { useAuthFormState } from './useAuthFormState';
import { useAuthActions } from './useAuthActions';

export function useAuthModal() {
  const dispatch = useDispatch();
  const modalMode = useSelector((s) => s.auth.modalMode);
  const currentUser = useSelector((s) => s.auth.user);
  const [syncProfile] = useSyncProfileMutation();
  const form = useAuthFormState();
  const { setActiveTab } = form;

  const isCompletion = modalMode === 'complete-profile';
  const isLogin = form.activeTab === 'login' && !isCompletion;
  const show = modalMode !== null;
  const canonicalEmail =
    auth.currentUser?.email || currentUser?.email || '';

  useEffect(() => {
    if (modalMode === 'login' || modalMode === 'signup') {
      setActiveTab(modalMode);
    }
  }, [modalMode, setActiveTab]);

  const handleClose = () => {
    form.resetState();
    dispatch(closeAuthModal());
  };

  const handleTabSwitch = (tab) => {
    if (isCompletion) return;
    form.setError('');
    form.setActiveTab(tab);
  };

  const { handleLogin, handleSignup, handleCompletion, handleLogout } =
    useAuthActions({
      dispatch,
      syncProfile,
      form,
      canonicalEmail,
    });

  return {
    activeTab: form.activeTab,
    loginFields: form.loginFields,
    signupFields: form.signupFields,
    completionFields: form.completionFields,
    error: form.error,
    loading: form.loading,
    isCompletion,
    isLogin,
    show,
    canonicalEmail,
    setLoginFields: form.setLoginFields,
    setSignupFields: form.setSignupFields,
    setCompletionFields: form.setCompletionFields,
    handleClose,
    handleTabSwitch,
    handleLogin,
    handleSignup,
    handleCompletion,
    handleLogout,
  };
}
