// src/frontend/src/components/Login.tsx
import React, { useState } from 'react';
import SHA256 from 'crypto-js/sha256';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Hash password function using SHA-256
  const hashPassword = (password: string): string => {
    return SHA256(password).toString();
  };

  // Handle the login action
  const handleLogin = () => {
    const hashedPassword = hashPassword(password);
    // You could send `username` and `hashedPassword` to the backend here
    console.log('Username:', username);
    console.log('Hashed Password:', hashedPassword);
    //TODO: send username and hashedPassword to the openAPI_controller.ts
  };

  // Handle the make an account action
  const handleMakeAccount = () => {
    if (isAdmin) {
      navigate('/create-account');
    } else {
      alert('Admin privileges are required to create an account.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={(e) => e.preventDefault()}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginLeft: '10px' }}
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginLeft: '13px' }}
          />
        </label>
        <button type="button" onClick={handleLogin}>
          Login
        </button>
        <div style={{ margin: '10px 0' }}></div>
        <button type="button" onClick={handleMakeAccount}>
          Make an account
        </button>
      </form>
    </div>
  );
};

export default Login;