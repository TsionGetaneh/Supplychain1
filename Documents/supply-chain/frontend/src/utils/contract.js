import { ethers } from 'ethers';
import SupplyChain from '../SupplyChain.json';

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const getContract = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed! Please install MetaMask.");
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  return new ethers.Contract(CONTRACT_ADDRESS, SupplyChain.abi, signer);
};

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask!");
  }
  
  const accounts = await window.ethereum.request({ 
    method: 'eth_requestAccounts' 
  });
  
  return accounts[0];
};

export const getAccount = async () => {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
};