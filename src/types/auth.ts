import { User } from '@supabase/supabase-js';

// Extend the base User type from Supabase
export interface AuthUser extends Omit<User, 'user_metadata'> {
  /**
   * Flag indicating if the user has super admin privileges.
   * This is a boolean value stored in the 'is_super_admin' column of the users table.
   */
  is_super_admin: boolean;
  /**
   * The user's role in the system (e.g., 'customer', 'admin', etc.)
   */
  user_role: string;
  /**
   * The user's account status (e.g., 'active', 'inactive', etc.)
   */
  account_status: string;
  /**
   * Additional metadata about the user.
   */
  user_metadata: {
    first_name?: string;
    last_name?: string;
    acceptMarketing?: boolean;
    acceptedTerms?: boolean;
  };
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  acceptedTerms: boolean;
  acceptMarketing?: boolean;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OrderLinkData {
  orderId: string;
  userId: string;
}