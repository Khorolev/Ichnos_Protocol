import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../config/firebase';
import { authApi } from '../features/auth/authApi';
import {
  setUser,
  setAdmin,
  logout,
  setLoading,
  setProfileState,
  openAuthModal,
} from '../features/auth/authSlice';
import {
  isCompletionRequired,
  markCompletionShown,
  wasCompletionShown,
  clearCompletionShown,
} from '../helpers/profileCompletion';

export const useAuthInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const result = dispatch(authApi.endpoints.getMe.initiate());
          const { data, error } = await result;
          result.unsubscribe();

          if (!error && data) {
            dispatch(setUser(data.data.user));
            dispatch(setAdmin(data.data.isAdmin || false));

            const profile = data.data.profileState;
            if (profile) {
              dispatch(setProfileState(profile));
            }

            const isAdminRoute =
              window.location.pathname.startsWith('/admin');

            if (
              !isAdminRoute &&
              isCompletionRequired(profile) &&
              !wasCompletionShown()
            ) {
              dispatch(openAuthModal('complete-profile'));
              markCompletionShown();
            }
          } else {
            dispatch(logout());
            clearCompletionShown();
          }
        } catch {
          dispatch(logout());
          clearCompletionShown();
        }
      } else {
        dispatch(logout());
        clearCompletionShown();
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);
};
