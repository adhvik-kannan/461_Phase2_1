// src/frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './frontend/src/App';
import { AuthProvider } from './frontend/src/AuthContext'; // Import AuthProvider

ReactDOM.render(
    <React.StrictMode>
      <AuthProvider>
        <Router>
          <App />
        </Router>
      </AuthProvider>
    </React.StrictMode>,
    document.getElementById('root')
  );