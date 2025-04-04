import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { StateCreator } from 'zustand';
import { callNetlifyFunction } from '../lib/supabase';
import { useCartStore } from './cartStore';
import type { AuthState, AuthUser } from '../types/auth';

// Create a browser-specific storage key
const getStorageKey = () => {
  const browserKey = `${navigator.userAgent}-${window.innerWidth}-${window.innerHeight}`;
  return `auth-storage-${btoa(browserKey)}`;
};

type AuthStore = AuthState;
type AuthPersist = (
  config: StateCreator<AuthStore>,
  options: PersistOptions<AuthStore>
) => StateCreator<AuthStore>;

// Define the state setter type
type SetState = (
  partial: AuthStore | Partial<AuthStore> | ((state: AuthStore) => AuthStore | Partial<AuthStore>),
  replace?: boolean | undefined
) => void;

export const useAuthStore = create<AuthStore>(
  (persist as AuthPersist)(
    (set: SetState) => ({
      user: null,
      loading: true,
      error: null,

      initialize: async () => {
        try {
          // Get initial session from Netlify function
          const { data } = await callNetlifyFunction('getSession');
          console.log('Auth store - Raw session data:', data);
          console.log('Auth store - User data from session:', data?.user);
          
          set({ user: data?.user as AuthUser || null, loading: false });
          console.log('Auth store - Set user data:', data?.user);
          
          // Sync cart if user is logged in
          if (data?.user) {
            await useCartStore.getState().syncWithDatabase();
          }

          // Listen for auth changes via polling
          const checkAuth = async () => {
            try {
              const { data } = await callNetlifyFunction('getSession');
              const currentUser = useAuthStore.getState().user;
              
              // Handle user state changes
              if (data?.user?.id !== currentUser?.id) {
                console.log('Auth store - User state changed. New user data:', data?.user);
                set({ user: data?.user as AuthUser || null });
                
                if (data?.user) {
                  // User logged in - sync cart
                  await useCartStore.getState().syncWithDatabase();
                } else {
                  // User logged out - clear cart
                  await useCartStore.getState().clearCart();
                }
              }
            } catch (error) {
              console.error('Error checking auth state:', error);
            }
          };

          // Start polling
          const interval = setInterval(checkAuth, 60 * 1000);
          
          // Return cleanup function without executing it
          return () => clearInterval(interval);
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({ error: error.message, loading: false });
        }
      },

      setUser: (user: AuthUser | null) => {
        console.log('Auth store - Setting user:', user);
        set({ user, loading: false });
        
        // Sync cart when user changes
        if (user) {
          useCartStore.getState().syncWithDatabase();
        } else {
          useCartStore.getState().clearCart();
        }
      }
    }),
    {
      name: getStorageKey(), // Use browser-specific storage key
      partialize: (state: AuthStore) => ({ 
        user: state.user,
        loading: state.loading,
        error: state.error
      }), // Only persist necessary state
      version: 1,
    }
  )
);

// Initialize auth state
useAuthStore.getState().initialize();