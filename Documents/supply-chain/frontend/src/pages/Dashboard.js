import React, { useState, useEffect } from 'react';
import { getContract, connectWallet } from '../utils/contract';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ account }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // list, create, transfer, update
  
  // Form states
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [transferForm, setTransferForm] = useState({ productId: '', newOwner: '' });
  const [updateForm, setUpdateForm] = useState({ productId: '', status: '1' });
  const [txPending, setTxPending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadProducts = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const contract = await getContract();
      const count = await contract.productCount();
      const items = [];
      for (let i = 1; i <= count; i++) {
        try {
          const p = await contract.products(i);
          items.push({
            id: p.id.toString(),
            name: p.name,
            currentOwner: p.currentOwner,
            status: parseInt(p.status)
          });
        } catch (e) {
          console.log(`Error loading product ${i}:`, e);
        }
      }
      setProducts(items.reverse()); // Newest first
    } catch (err) {
      console.error("Error loading products:", err);
      showMessage('error', 'Failed to load products');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [account]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.description) {
      return showMessage('error', 'Please fill all fields');
    }
    
    setTxPending(true);
    try {
      const contract = await getContract();
      const tx = await contract.createProduct(createForm.name, createForm.description);
      showMessage('info', 'Transaction pending...');
      await tx.wait();
      showMessage('success', 'Product created successfully!');
      setCreateForm({ name: '', description: '' });
      loadProducts();
      setActiveTab('list');
    } catch (err) {
      showMessage('error', err.message || 'Transaction failed');
    }
    setTxPending(false);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTxPending(true);
    try {
      const contract = await getContract();
      const tx = await contract.transferProduct(transferForm.productId, transferForm.newOwner);
      showMessage('info', 'Transfer pending...');
      await tx.wait();
      showMessage('success', 'Product transferred!');
      setTransferForm({ productId: '', newOwner: '' });
      loadProducts();
      setActiveTab('list');
    } catch (err) {
      showMessage('error', err.message || 'Transfer failed');
    }
    setTxPending(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setTxPending(true);
    try {
      const contract = await getContract();
      const tx = await contract.updateStatus(updateForm.productId, updateForm.status);
      showMessage('info', 'Update pending...');
      await tx.wait();
      showMessage('success', 'Status updated!');
      setUpdateForm({ productId: '', status: '1' });
      loadProducts();
      setActiveTab('list');
    } catch (err) {
      showMessage('error', err.message || 'Update failed');
    }
    setTxPending(false);
  };

  const getStatusBadge = (status) => {
    const configs = {
      0: { class: 'status-created', label: 'Created' },
      1: { class: 'status-transit', label: 'In Transit' },
      2: { class: 'status-delivered', label: 'Delivered' }
    };
    const config = configs[status] || configs[0];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  if (!account) {
    return (
      <div className="connect-screen">
        <div className="connect-card">
          <h1>🏭 Supply Chain DApp</h1>
          <p>Track products from manufacturer to consumer on the blockchain</p>
          <button className="connect-btn-large" onClick={async () => {
            try {
              const addr = await connectWallet();
              window.location.reload();
            } catch (err) {
              alert(err.message);
            }
          }}>
            Connect MetaMask to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-number">{products.length}</span>
            <span className="stat-label">Total Products</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{products.filter(p => p.status === 1).length}</span>
            <span className="stat-label">In Transit</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{products.filter(p => p.status === 2).length}</span>
            <span className="stat-label">Delivered</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📦 Products
        </button>
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create
        </button>
        <button 
          className={`tab ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          🔄 Transfer
        </button>
        <button 
          className={`tab ${activeTab === 'update' ? 'active' : ''}`}
          onClick={() => setActiveTab('update')}
        >
          ✏️ Update Status
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'list' && (
          <div className="products-section">
            <button className="refresh-btn" onClick={loadProducts} disabled={loading}>
              {loading ? '⏳' : '🔄'} Refresh
            </button>
            
            {products.length === 0 ? (
              <div className="empty-state">
                <p>No products yet. Create your first product!</p>
                <button className="btn-primary" onClick={() => setActiveTab('create')}>
                  Create Product
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                    <div className="product-header">
                      <h3>#{product.id} {product.name}</h3>
                      {getStatusBadge(product.status)}
                    </div>
                    <div className="product-info">
                      <p className="owner">
                        <strong>Owner:</strong> {product.currentOwner.slice(0, 6)}...{product.currentOwner.slice(-4)}
                      </p>
                    </div>
                    <button className="view-btn">View Details →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="form-section">
            <h2>Create New Product</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Product Name</label>
                <input 
                  type="text" 
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="Enter product description"
                  required
                  rows="4"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={txPending}>
                {txPending ? '⏳ Creating...' : '✅ Create Product'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="form-section">
            <h2>Transfer Product</h2>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label>Product ID</label>
                <input 
                  type="number" 
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({...transferForm, productId: e.target.value})}
                  placeholder="Enter product ID"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Owner Address</label>
                <input 
                  type="text" 
                  value={transferForm.newOwner}
                  onChange={(e) => setTransferForm({...transferForm, newOwner: e.target.value})}
                  placeholder="0x..."
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={txPending}>
                {txPending ? '⏳ Transferring...' : '🔄 Transfer Ownership'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'update' && (
          <div className="form-section">
            <h2>Update Product Status</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Product ID</label>
                <input 
                  type="number" 
                  value={updateForm.productId}
                  onChange={(e) => setUpdateForm({...updateForm, productId: e.target.value})}
                  placeholder="Enter product ID"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Status</label>
                <select 
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                  required
                >
                  <option value="1">🚚 In Transit</option>
                  <option value="2">📦 Delivered</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={txPending}>
                {txPending ? '⏳ Updating...' : '✏️ Update Status'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;