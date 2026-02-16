import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../config/firebase';
import { authApi } from '../features/auth/authApi';
import { setUser, setAdmin, logout, setLoading } from '../features/auth/authSlice';

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
          } else {
            dispatch(logout());
          }
        } catch {
          dispatch(logout());
        }
      } else {
        dispatch(logout());
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);
};
