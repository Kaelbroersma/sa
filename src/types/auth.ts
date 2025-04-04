import { User } from '@supabase/supabase-js';

// Extend the base User type from Supabase
export interface AuthUser extends Omit<User, 'user_metadata'> {
  is_super_admin: boolean;
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