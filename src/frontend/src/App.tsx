// src/frontend/src/App.tsx
import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import Upload from './components/Upload';
import Login from './components/Login';
import Home from './components/Home';
import CreateAccount from './components/CreateAccount';
import Search from './components/Search';
import Update from './components/Update';
import Cost from './components/Cost';
import Reset from './components/Reset';
import './App.css'; // Import the CSS file for styling

const App: React.FC = () => {
  return (
    <div>
      <header className="app-header">
        <nav className="nav-container">
          {/* Home Link - Typically, a logo or brand name can serve this purpose */}
          <Link to="/" className="nav-logo">
            Home
          </Link>
          
          <div className="nav-links">
            <Link to="/login" className="nav-button">
              Login
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/search" element={<Search />} />
          <Route path="/update" element={<Update />} />
          <Route path="/cost" element={<Cost />} />
          <Route path="/reset" element={<Reset />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;