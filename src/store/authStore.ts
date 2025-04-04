import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { StateCreator } from 'zustand';
import { callNetlifyFunction } from '../lib/supabase';
import { useCartStore } from './cartStore';
import type { AuthState, AuthUser } from '../types/auth';

// Create a unique browser fingerprint
const getBrowserFingerprint = () => {
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const colorDepth = window.screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform;
  
  return btoa(`${screenRes}-${colorDepth}-${timezone}-${language}-${platform}-${navigator.userAgent}`);
};

// Create a browser-specific storage key
const getStorageKey = () => {
  return `auth-storage-${getBrowserFingerprint()}`;
};

interface AuthStore extends AuthState {
  initialize: () => Promise<void>;
  setUser: (user: AuthUser | null) => Promise<void>;
}

type AuthPersist = (
  config: StateCreator<AuthStore>,
  options: PersistOptions<AuthStore>
) => StateCreator<AuthStore>;

export const useAuthStore = create<AuthStore>(
  (persist as AuthPersist)(
    (set) => ({
      user: null,
      loading: true,
      error: null,

      initialize: async () => {
        try {
          // Get initial session from Netlify function
          const { data } = await callNetlifyFunction('getSession');
          
          // Validate browser fingerprint if user exists
          if (data?.user) {
            const storedFingerprint = localStorage.getItem('browser-fingerprint');
            const currentFingerprint = getBrowserFingerprint();
            
            if (storedFingerprint && storedFingerprint !== currentFingerprint) {
              console.warn('Browser fingerprint mismatch, signing out');
              await callNetlifyFunction('signOut');
              set({ user: null, loading: false });
              return;
            }
            
            // Store current fingerprint
            localStorage.setItem('browser-fingerprint', currentFingerprint);
          }
          
          set({ user: data?.user || null, loading: false });
          
          // Sync cart if user is logged in
          if (data?.user) {
            await useCartStore.getState().syncWithDatabase();
          }

          // Set up auth state polling
          let lastCheck = Date.now();
          const checkAuth = async () => {
            try {
              // Throttle checks to prevent excessive calls
              const now = Date.now();
              if (now - lastCheck < 30000) { // 30 seconds minimum between checks
                return;
              }
              lastCheck = now;

              const { data } = await callNetlifyFunction('getSession');
              const currentUser = useAuthStore.getState().user;
              
              // Handle user state changes
              if (!data?.user && currentUser) {
                console.log('User signed out in another tab/window');
                set({ user: null });
                await useCartStore.getState().clearCart();
              } else if (data?.user?.id !== currentUser?.id) {
                console.log('User state changed');
                set({ user: data?.user || null });
                
                if (data?.user) {
                  await useCartStore.getState().syncWithDatabase();
                } else {
                  await useCartStore.getState().clearCart();
                }
              }
            } catch (error) {
              console.error('Error checking auth state:', error);
            }
          };

          // Start polling with cleanup
          const interval = setInterval(checkAuth, 60000); // Check every minute
          window.addEventListener('beforeunload', () => clearInterval(interval));
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({ error: error.message, loading: false });
        }
      },

      setUser: async (user: AuthUser | null) => {
        if (user) {
          // Store browser fingerprint on login
          localStorage.setItem('browser-fingerprint', getBrowserFingerprint());
        } else {
          // Clear fingerprint on logout
          localStorage.removeItem('browser-fingerprint');
        }
        
        set({ user, loading: false });
        
        if (user) {
          await useCartStore.getState().syncWithDatabase();
        } else {
          await useCartStore.getState().clearCart();
        }
      }
    }),
    {
      name: getStorageKey(),
      partialize: (state: AuthStore) => ({
        user: state.user,
        loading: state.loading,
        error: state.error
      } as Partial<AuthStore>),
      version: 1,
      // Add storage event listener to handle cross-tab synchronization
      onRehydrateStorage: () => (state) => {
        if (state) {
          window.addEventListener('storage', async (event) => {
            if (event.key === getStorageKey()) {
              const { data } = await callNetlifyFunction('getSession');
              state.setUser(data?.user || null);
            }
          });
        }
      }
    }
  )
);

// Initialize auth state
useAuthStore.getState().initialize();