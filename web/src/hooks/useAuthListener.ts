import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { userRepository } from '@/repositories/UserRepository';

export function useAuthListener() {
  const { setUser, setLoading, setError } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Get user profile from Firestore
            const profile = await userRepository.getById(firebaseUser.uid);
            
            if (profile) {
              setUser(profile);
            } else {
              // If no profile yet (e.g. midway through registration), we don't set user
              // AuthService will handle setting the profile immediately after auth completes
              setUser(null); 
            }

            // Sync token to cookie for Middleware
            const token = await firebaseUser.getIdToken();
            document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;
          } catch {
            setError('Failed to fetch user profile.');
            setUser(null);
            document.cookie = '__session=; path=/; max-age=0';
          }
        } else {
          setUser(null);
          // Clear cookie
          document.cookie = '__session=; path=/; max-age=0';
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [setUser, setLoading, setError]);
}
