import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '../src/frontend/src/App';
import '@testing-library/jest-dom';

test('renders Login component on /login route', () => {
    window.history.pushState({}, 'Login Page', '/login');
    render(
        <Router>
            <App />
        </Router>
    );
    const loginElements = screen.getAllByText(/Login/i);
    expect(loginElements.length).toBeGreaterThan(0);
});
  
//   test('renders UploadFeature component on /upload route', () => {
//     window.history.pushState({}, 'Upload Page', '/upload');
//     render(<App />);
//     const uploadElement = screen.getByText(/Upload/i); // Adjust based on the actual text in UploadFeature
//     expect(uploadElement).toBeInTheDocument();
//   });
  
  test('renders CreateAccount component on /create-account route', () => {
    window.history.pushState({}, 'Create Account Page', '/create-account');
    render(
        <Router>
            <App />
        </Router>
    );
    const createAccountElement = screen.getAllByText(/Create Account/i); // Adjust based on the actual text in CreateAccount
    expect(createAccountElement.length).toBeGreaterThan(0);
  });
  
  test('Login component renders correctly', () => {
    window.history.pushState({}, 'Login Page', '/login');
    render(
        <Router>
            <App />
        </Router>
    );
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    const loginElements = screen.getAllByText(/Login/i);
    expect(loginElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Make an account/i)).toBeInTheDocument();
  });
  
  test('handleLogin is called when Login button is clicked', () => {
    window.history.pushState({}, 'Login Page', '/login');
    render(
        <Router>
            <App />
        </Router>
    );
    const loginButtons = screen.getAllByText(/Login/i);
    const loginButton = loginButtons.find(button => button.closest('form')); // Select the "Login" button inside the form
    fireEvent.click(loginButton!);
    // Add assertions to verify the handleLogin function behavior
    // For example, you can mock the console.log and check if it was called
  });
  
  test('handleMakeAccount navigates to /create-account when user is admin', () => {
    window.history.pushState({}, 'Login Page', '/login');
    render(
        <Router>
            <App />
        </Router>
    );
    const makeAccountButton = screen.getByText(/Make an account/i);
    fireEvent.click(makeAccountButton);
    // Add assertions to verify the navigation behavior
    // For example, you can mock the navigate function and check if it was called with the correct argument
  });
  
  test('handleMakeAccount shows alert when user is not admin', () => {
    window.history.pushState({}, 'Login Page', '/login');
    render(
        <Router>
            <App />
        </Router>
    );
    const makeAccountButton = screen.getByText(/Make an account/i);
    fireEvent.click(makeAccountButton);
    // Add assertions to verify the alert behavior
    // For example, you can mock the alert function and check if it was called with the correct message
  });

  test('username and password inputs update their values correctly', () => {
    window.history.pushState({}, 'Create Account Page', '/create-account');
    render(
        <Router>
            <App />
        </Router>
    );
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
  
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
  
    expect((usernameInput as HTMLInputElement).value).toBe('testuser');
    expect((passwordInput as HTMLInputElement).value).toBe('testpassword');
  });