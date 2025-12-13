import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    currentUser: null,
    loading: false,
    signInWithGoogle: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('uuid', () => ({ v4: () => 'test-id' }));

test('shows login prompt when user is not authenticated', () => {
  render(<App />);
  expect(screen.getByText(/sign in to sync your data/i)).toBeInTheDocument();
});
