import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/frontend/src/App';
import { AuthContext } from '../src/frontend/src/AuthContext';
import { describe, it, expect, vi } from 'vitest';


describe('App Component', () => {
    const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
        window.history.pushState({}, 'Test page', route);
        return render(ui, { wrapper: MemoryRouter });
    };

    test('renders Home link', () => {
        renderWithRouter(
            <AuthContext.Provider value={{ isLoggedIn: false, isAdmin: false, username: '', logout: vi.fn(), login: vi.fn(), x_authorization: '' }}>
                <App />
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Home/i)).toBeInTheDocument();
    });

    test('renders Login link when not logged in', () => {
        renderWithRouter(
            <AuthContext.Provider value={{ isLoggedIn: false, isAdmin: false, username: '', logout: vi.fn(), login: vi.fn(), x_authorization: '' }}>
                <App />
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });

    test('renders Logout button and username when logged in', () => {
        renderWithRouter(
            <AuthContext.Provider value={{ isLoggedIn: true, isAdmin: false, username: 'testuser', logout: vi.fn(), login: vi.fn(), x_authorization: '' }}>
                <App />
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Logged in as: testuser/i)).toBeInTheDocument();
        expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });

    test('renders Create Account link for admin', () => {
        renderWithRouter(
            <AuthContext.Provider value={{ isLoggedIn: true, isAdmin: true, username: 'adminuser', logout: vi.fn(), login: vi.fn(), x_authorization: '' }}>
                <App />
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
    });

    test('does not render Create Account link for non-admin', () => {
        renderWithRouter(
            <AuthContext.Provider value={{ isLoggedIn: true, isAdmin: false, username: 'testuser', logout: vi.fn(), login: vi.fn(), x_authorization: '' }}>
                <App />
            </AuthContext.Provider>
        );
        expect(screen.queryByText(/Create Account/i)).not.toBeInTheDocument();
    });
});