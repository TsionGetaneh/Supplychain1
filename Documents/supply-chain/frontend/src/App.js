import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import './styles/main.css';

function App() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (err) {
          console.error("Error checking connection:", err);
        }
        
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0] || null);
        });
      }
    };
    checkConnection();
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar account={account} setAccount={setAccount} />
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard account={account} />} />
            <Route path="/product/:id" element={<ProductDetails account={account} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;