// src/frontend/src/components/CreateAccount.tsx
import React, { useState } from 'react';
import SHA256 from 'crypto-js/sha256';
import './Login.css';

const CreateAccount: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Hash password function using SHA-256
  const hashPassword = (password: string): string => {
    return SHA256(password).toString();
  };

  // Handle the create account action
  const handleCreateAccount = () => {
    const hashedPassword = hashPassword(password);
    // You could send `username` and `hashedPassword` to the backend here
    console.log('Username:', username);
    console.log('Hashed Password:', hashedPassword);
    //TODO: send username and hashedPassword to the openAPI_controller.ts
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
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="button" onClick={handleCreateAccount}>
          Create Account
        </button>
      </form>
    </div>
  );
};

export default CreateAccount;