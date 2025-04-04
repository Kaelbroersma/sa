import { create } from 'zustand';
import { callNetlifyFunction } from '../lib/supabase';
import { useCartStore } from './cartStore';
import type { AuthState, AuthUser } from '../types/auth';

export const useAuthStore = create<AuthState>((set) => ({
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
      };

      // Poll every minute
      const interval = setInterval(checkAuth, 60 * 1000);
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
}));

// Initialize auth state
useAuthStore.getState().initialize();