import React from 'react';
import { Link } from 'react-router-dom';
import { connectWallet } from '../utils/contract';

const Navbar = ({ account, setAccount }) => {
  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setAccount(addr);
    } catch (err) {
      alert(err.message);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const disconnect = () => {
    setAccount(null);
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="logo-link">
          <span className="logo-icon">⛓️</span>
          <span>SupplyChain</span>
        </Link>
      </div>
      
      <div className="nav-right">
        {account ? (
          <div className="wallet-info">
            <div className="network-badge">
              <span className="status-dot"></span>
              Hardhat Local
            </div>
            <div className="address-badge" onClick={disconnect} title="Click to disconnect">
              <span className="wallet-icon">🦊</span>
              <span className="address-text">{formatAddress(account)}</span>
            </div>
          </div>
        ) : (
          <button className="connect-btn" onClick={handleConnect}>
            <span className="wallet-icon">🦊</span>
            Connect MetaMask
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;