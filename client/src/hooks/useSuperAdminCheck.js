import { useState, useEffect } from 'react';

export function useSuperAdminCheck() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let unsubscribe;

    async function subscribe() {
      const { auth } = await import('../config/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setIsSuperAdmin(false);
          return;
        }

        const result = await user.getIdTokenResult();
        setIsSuperAdmin(result.claims.superAdmin === true);
      });
    }

    subscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return isSuperAdmin;
}
