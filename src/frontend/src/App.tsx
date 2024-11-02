// src/frontend/src/App.tsx
import React from 'react';
import { Route, Routes, Link } from 'react-router-dom'; // Removed Router import
import UploadFeature from './components/UploadFeature';
import Login from './components/Login';
import Home from './components/Home';
import CreateAccount from './components/CreateAccount';

const App: React.FC = () => {
    return (
      <div>
        <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
          <h1>Package Rating Web Interface</h1>
          <Link to="/login">
            <button style={{ padding: '10px 20px' }} data-testid="header-login-button">Login</button>
          </Link>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload" element={<UploadFeature />} />
          <Route path="/create-account" element={<CreateAccount />} />
        </Routes>
      </div>
    );
  };

export default App;