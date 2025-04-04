import { create } from 'zustand';
import { callNetlifyFunction } from '../lib/supabase';

interface AdminState {
  isAdmin: boolean;
  isChecking: boolean;
  error: string | null;
  checkAdminStatus: (userId: string) => Promise<boolean>;
  setAdminStatus: (status: boolean) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isAdmin: false,
  isChecking: false,
  error: null,

  checkAdminStatus: async (userId: string) => {
    try {
      if (!userId) {
        set({ isAdmin: false, isChecking: false, error: 'No user ID provided' });
        return false;
      }

      set({ isChecking: true, error: null });
      
      const { data, error } = await callNetlifyFunction('checkAdminStatus', { userId });
      
      if (error) {
        console.error('Error checking admin status:', error);
        set({ isAdmin: false, isChecking: false, error: error.message });
        return false;
      }
      
      const isAdmin = data?.isAdmin === true;
      set({ isAdmin, isChecking: false });
      return isAdmin;
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      set({ isAdmin: false, isChecking: false, error: error.message });
      return false;
    }
  },

  setAdminStatus: (status: boolean) => {
    set({ isAdmin: status });
  }
})); 