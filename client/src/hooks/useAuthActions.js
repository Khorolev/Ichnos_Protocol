import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  setUser, setAdmin, setProfileState, logout, openAuthModal,
  forceCloseAuthModal, setAuthSuccess, setEnforcedLogout,
} from '../features/auth/authSlice';
import { formatFirebaseError, formatSyncError } from '../helpers/firebaseErrors';
import { isCompletionRequired, clearCompletionShown } from '../helpers/profileCompletion';
import { buildSignupSyncPayload, buildCompletionSyncPayload } from '../helpers/authSubmit';

export function useAuthActions({
  dispatch,
  syncProfile,
  form,
  currentUser,
  canonicalEmail,
}) {
  const syncAndDispatch = async (data) => {
    const result = await syncProfile(data).unwrap();
    dispatch(setUser(result.data?.user || data));
    dispatch(setAdmin(result.data?.isAdmin || false));
    const profile = result.data?.profileState;
    if (profile) dispatch(setProfileState(profile));
    return profile;
  };

  const completeAuth = () => {
    dispatch(setAuthSuccess(true));
    form.resetState();
    dispatch(forceCloseAuthModal());
  };

  const executeAuthFlow = async (firebaseFn, buildPayload) => {
    form.setError('');
    form.setLoading(true);
    let fbUser;
    try {
      fbUser = (await firebaseFn()).user;
    } catch (err) {
      form.setError(formatFirebaseError(err));
      form.setLoading(false);
      return;
    }
    try {
      const profile = await syncAndDispatch(buildPayload(fbUser));
      if (isCompletionRequired(profile)) {
        dispatch(openAuthModal('complete-profile'));
      } else {
        completeAuth();
      }
    } catch (err) {
      form.setError(formatSyncError(err));
    } finally {
      form.setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const { email, password } = form.loginFields;
    executeAuthFlow(
      () => signInWithEmailAndPassword(auth, email, password),
      (u) => ({ firebaseUid: u.uid, email: u.email }),
    );
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const { email, password } = form.signupFields;
    executeAuthFlow(
      () => createUserWithEmailAndPassword(auth, email, password),
      (u) => buildSignupSyncPayload(form.signupFields, u),
    );
  };

  const handleCompletion = async (e) => {
    e.preventDefault();
    form.setError('');
    form.setLoading(true);
    try {
      const payload = buildCompletionSyncPayload(
        currentUser,
        canonicalEmail,
        form.completionFields,
      );
      const profile = await syncAndDispatch(payload);
      if (!isCompletionRequired(profile)) completeAuth();
    } catch (err) {
      form.setError(formatSyncError(err));
    } finally {
      form.setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(setEnforcedLogout(true));
    dispatch(setAuthSuccess(false));
    dispatch(forceCloseAuthModal());
    clearCompletionShown();
    form.resetState();
    signOut(auth).catch(() => {});
  };

  return { handleLogin, handleSignup, handleCompletion, handleLogout };
}
