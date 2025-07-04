'use client';

import { createContext, useContext } from 'react';

export type Role =
  | 'employee'
  | 'manager'
  | 'hr'
  | 'admin'
  | 'shareholder'
  | 'owner'
  | 'delivery-agent';

export type User = {
  name: string;
  email: string;
  avatar: string;
  role: Role;
};

export const mockUsers: Record<Role, User> = {
  owner: {
    name: 'Victoria Sterling',
    email: 'owner@sparkle.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'owner',
  },
  admin: {
    name: 'Arthur Pendelton',
    email: 'admin@sparkle.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'admin',
  },
  manager: {
    name: 'Eleanor Vance',
    email: 'manager@sparkle.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'manager',
  },
  hr: {
    name: 'Henry Roberts',
    email: 'hr@sparkle.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'hr',
  },
  employee: {
    name: 'Isla Mae',
    email: 'employee@sparkle.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'employee',
  },
  shareholder: {
    name: 'Julian Croft',
    email: 'shareholder@sparkle.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'shareholder',
  },
  'delivery-agent': {
    name: 'Dash Delivero',
    email: 'delivery@sparkle.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'delivery-agent',
  },
};

export const findRoleByEmail = (email: string): Role | undefined => {
  for (const role in mockUsers) {
    if (mockUsers[role as Role].email === email) {
      return role as Role;
    }
  }
  // Default to employee if no specific role email is entered
  if (email.includes('@')) {
    return 'employee';
  }
  return undefined;
};

export interface AuthContextType {
  user: User | null;
  login: (email: string) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
