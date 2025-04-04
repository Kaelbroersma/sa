import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { callNetlifyFunction } from '../lib/supabase';
import { useCartStore } from './cartStore';
import type { AuthState, AuthUser } from '../types/auth';
import { useAdminStore } from './adminStore';

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

export const useAuthStore = create<AuthState & {
  initialize: () => Promise<void>;
  setUser: (user: AuthUser | null) => Promise<void>;
}>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      error: null,

      initialize: async () => {
        try {
          // Check if we already have a user in state
          const currentUser = get().user;
          
          // Only fetch session if we don't have a user
          if (!currentUser) {
            const { data } = await callNetlifyFunction('getSession');
            
            if (data?.user) {
              const storedFingerprint = localStorage.getItem('browser-fingerprint');
              const currentFingerprint = getBrowserFingerprint();
              
              if (storedFingerprint && storedFingerprint !== currentFingerprint) {
                console.warn('Browser fingerprint mismatch, signing out');
                await callNetlifyFunction('signOut');
                set({ user: null, loading: false });
                return;
              }
              
              localStorage.setItem('browser-fingerprint', currentFingerprint);

              // Ensure is_super_admin is a boolean
              const enrichedUser = {
                ...data.user,
                is_super_admin: Boolean(data.user.is_super_admin)
              };

              set({ user: enrichedUser, loading: false });
              
              // Initialize admin status
              if (enrichedUser.is_super_admin === true) {
                useAdminStore.getState().setAdminStatus(true);
              } else {
                // Check admin status directly to be sure
                await useAdminStore.getState().checkAdminStatus(enrichedUser.id);
              }
              
              await useCartStore.getState().syncWithDatabase();
            } else {
              set({ user: null, loading: false });
            }
          } else {
            set({ loading: false });
            
            // Make sure admin status is set correctly
            if (currentUser.is_super_admin === true) {
              useAdminStore.getState().setAdminStatus(true);
            }
          }

          // Set up auth state polling
          let lastCheck = Date.now();
          const checkAuth = async () => {
            try {
              const now = Date.now();
              // Increase minimum time between checks to 5 minutes (300000ms)
              if (now - lastCheck < 300000) return;
              lastCheck = now;

              const { data } = await callNetlifyFunction('getSession');
              const currentUser = get().user;
              
              // Only sign out if explicitly null and not just a network error
              if (data === null && currentUser) {
                console.log('Session explicitly invalidated');
                set({ user: null });
                await useCartStore.getState().clearCart();
              } else if (data?.user && data.user.id !== currentUser?.id) {
                // User ID changed - genuine user switch
                console.log('User account changed');
                set({ user: data.user });
                
                if (data.user) {
                  await useCartStore.getState().syncWithDatabase();
                } else {
                  await useCartStore.getState().clearCart();
                }
              } else if (data?.user && currentUser) {
                // User exists in both places - refresh any changed properties
                // but don't trigger a complete sign-out
                set({ 
                  user: {
                    ...currentUser,
                    ...data.user,
                    // Ensure these critical fields remain consistent
                    is_super_admin: data.user.is_super_admin === true
                  } 
                });
              }
            } catch (error) {
              // Don't sign out on network errors
              console.error('Error checking auth state:', error);
            }
          };

          // Poll less frequently (every 10 minutes instead of every minute)
          const interval = setInterval(checkAuth, 600000);
          window.addEventListener('beforeunload', () => clearInterval(interval));
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({ error: error.message, loading: false });
        }
      },

      setUser: async (user: AuthUser | null) => {
        if (user) {
          localStorage.setItem('browser-fingerprint', getBrowserFingerprint());
          
          // Set admin status appropriately
          if (user.is_super_admin === true) {
            useAdminStore.getState().setAdminStatus(true);
          } else {
            // Check admin status directly
            await useAdminStore.getState().checkAdminStatus(user.id);
          }
        } else {
          localStorage.removeItem('browser-fingerprint');
          // Clear admin status when user is null
          useAdminStore.getState().setAdminStatus(false);
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        loading: state.loading,
        error: state.error
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Auth store rehydrated from storage');
          
          // If we have a user in storage, assume it's valid and set loading to false
          if (state.user) {
            state.loading = false;
            
            // Ensure admin status is set correctly
            if (state.user.is_super_admin === true) {
              useAdminStore.getState().setAdminStatus(true);
            }
          }
          
          // Initialize in the background but don't block the UI on it
          setTimeout(() => {
            state.initialize().catch(err => {
              console.error('Error during auth initialization:', err);
              // Don't sign out the user on initialization errors
            });
          }, 1000);
          
          window.addEventListener('storage', async (event) => {
            if (event.key === getStorageKey()) {
              const { data } = await callNetlifyFunction('getSession');
              await state.setUser(data?.user || null);
            }
          });
          
          // Return the rehydrated state
          return state;
        }
      }
    }
  )
);

// Initialize auth state - execute but don't wait
useAuthStore.getState().initialize().catch(err => {
  console.error('Error during initial auth initialization:', err);
});