    import React from 'react';
    import { render, screen, fireEvent } from '@testing-library/react';
    import { BrowserRouter as Router } from 'react-router-dom';
    import App from '../src/frontend/src/App';
    import '@testing-library/jest-dom';
    import { AuthContext } from '../src/frontend/src/AuthContext';

    const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
        window.history.pushState({}, 'Test page', route);
        return render(ui, { wrapper: Router });
    };

    const mockAuthContext = (isLoggedIn: boolean, isAdmin: boolean, username: string) => ({
        isLoggedIn,
        isAdmin,
        username,
        login: vi.fn(),
        logout: vi.fn(),
    });

    test('renders Home component on / route', () => {
        renderWithRouter(
            <AuthContext.Provider value={mockAuthContext(false, false, '')}>
                <App />
            </AuthContext.Provider>,
            { route: '/' }
        );
        expect(screen.getByText(/Home/i)).toBeInTheDocument();
    });

    test('renders Login component on /login route', () => {
        renderWithRouter(
            <AuthContext.Provider value={mockAuthContext(false, false, '')}>
                <App />
            </AuthContext.Provider>,
            { route: '/login' }
        );
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    test('renders CreateAccount component on /create-account route for admin', () => {
        renderWithRouter(
            <AuthContext.Provider value={mockAuthContext(true, true, 'admin')}>
                <App />
            </AuthContext.Provider>,
            { route: '/create-account' }
        );
        expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    // test('renders Upload component on /upload route', () => {
    //     renderWithRouter(
    //         <AuthContext.Provider value={mockAuthContext(true, false, 'user')}>
    //             <App />
    //         </AuthContext.Provider>,
    //         { route: '/upload' }
    //     );
    //     expect(screen.getByText(/Upload/i)).toBeInTheDocument();
    // });

    test('username and password inputs update their values correctly', () => {
        renderWithRouter(
            <AuthContext.Provider value={mockAuthContext(false, false, '')}>
                <App />
            </AuthContext.Provider>,
            { route: '/login' }
        );
        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

        expect((usernameInput as HTMLInputElement).value).toBe('testuser');
        expect((passwordInput as HTMLInputElement).value).toBe('testpassword');
    });

    test('renders navigation links correctly when logged in as admin', () => {
        renderWithRouter(
            <AuthContext.Provider value={mockAuthContext(true, true, 'admin1')}>
                <App />
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Logged in as: admin1/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Admin/i).length).toBeGreaterThan(1)
        expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
        expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });

    test('renders navigation links correctly when logged in as non-admin', () => {
        renderWithRouter(
            <AuthContext.Provider value={mockAuthContext(true, false, 'user')}>
                <App />
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Logged in as: user/i)).toBeInTheDocument();
        expect(screen.getByText(/Not Admin/i)).toBeInTheDocument();
        expect(screen.queryByText(/Create Account/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });

    test('renders navigation links correctly when not logged in', () => {
        renderWithRouter(
            <AuthContext.Provider value={mockAuthContext(false, false, '')}>
                <App />
            </AuthContext.Provider>
        );
        expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });


    /*
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
  
//   test('renders Upload component on /upload route', () => {
//     window.history.pushState({}, 'Upload Page', '/upload');
//     render(<App />);
//     const uploadElement = screen.getByText(/Upload/i); // Adjust based on the actual text in Upload
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
    */