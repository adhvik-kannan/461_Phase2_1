// src/frontend/src/AuthContext.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../src/frontend/src/AuthContext';

describe('AuthContext', () => {
    it('should have default values', () => {
        render(
            <AuthProvider>
                <AuthContext.Consumer>
                    {({ isLoggedIn, isAdmin, username }) => (
                        <>
                            <div data-testid="isLoggedIn">{isLoggedIn.toString()}</div>
                            <div data-testid="isAdmin">{isAdmin.toString()}</div>
                            <div data-testid="username">{username}</div>
                        </>
                    )}
                </AuthContext.Consumer>
            </AuthProvider>
        );

        expect(screen.getByTestId('isLoggedIn').textContent).toBe('false');
        expect(screen.getByTestId('isAdmin').textContent).toBe('false');
        expect(screen.getByTestId('username').textContent).toBe('');
    });

    it('should login correctly', () => {
        render(
            <AuthProvider>
                <AuthContext.Consumer>
                    {({ isLoggedIn, isAdmin, username, login }) => (
                        <>
                            <div data-testid="isLoggedIn">{isLoggedIn.toString()}</div>
                            <div data-testid="isAdmin">{isAdmin.toString()}</div>
                            <div data-testid="username">{username}</div>
                            <button onClick={() => login(true, 'testuser')}>Login</button>
                        </>
                    )}
                </AuthContext.Consumer>
            </AuthProvider>
        );

        fireEvent.click(screen.getByText('Login'));

        expect(screen.getByTestId('isLoggedIn').textContent).toBe('true');
        expect(screen.getByTestId('isAdmin').textContent).toBe('true');
        expect(screen.getByTestId('username').textContent).toBe('testuser');
    });

    it('should logout correctly', () => {
        render(
            <AuthProvider>
                <AuthContext.Consumer>
                    {({ isLoggedIn, isAdmin, username, login, logout }) => (
                        <>
                            <div data-testid="isLoggedIn">{isLoggedIn.toString()}</div>
                            <div data-testid="isAdmin">{isAdmin.toString()}</div>
                            <div data-testid="username">{username}</div>
                            <button onClick={() => login(true, 'testuser')}>Login</button>
                            <button onClick={logout}>Logout</button>
                        </>
                    )}
                </AuthContext.Consumer>
            </AuthProvider>
        );

        fireEvent.click(screen.getByText('Login'));
        fireEvent.click(screen.getByText('Logout'));

        expect(screen.getByTestId('isLoggedIn').textContent).toBe('false');
        expect(screen.getByTestId('isAdmin').textContent).toBe('false');
        expect(screen.getByTestId('username').textContent).toBe('');
    });
});