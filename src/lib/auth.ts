
import { supabase } from './supabase';

interface User {
  id: string;
  email: string;
  name: string;
}

export const signup = async (email: string, password: string, name: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    console.error('Signup API Error:', error);
    throw new Error(error.message || 'Failed to sign up');
  }

  if (!data.user) {
    throw new Error('User not created');
  }

  return {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata.full_name || '',
  };
};

export const login = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login API Error:', error);
    throw new Error(error.message || 'Failed to log in');
  }

  if (!data.user) {
    throw new Error('User not found');
  }

  return {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata.full_name || '',
  };
};

export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout API Error:', error);
    throw new Error(error.message || 'Failed to log out');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata.full_name || '',
  };
};
