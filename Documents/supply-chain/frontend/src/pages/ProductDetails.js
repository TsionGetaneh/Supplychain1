import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContract } from '../utils/contract';

const ProductDetails = ({ account }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!account) return;
      try {
        const contract = await getContract();
        const p = await contract.getProduct(id);
        const h = await contract.getProductHistory(id);
        
        setProduct({
          id: p[0].toString(),
          name: p[1],
          description: p[2],
          currentOwner: p[3],
          status: parseInt(p[4]),
          createdAt: new Date(p[5] * 1000).toLocaleString()
        });

        const historyData = h[0].map((addr, idx) => ({
          address: addr,
          timestamp: new Date(h[1][idx] * 1000).toLocaleString(),
          step: idx === 0 ? 'Created' : idx === h[0].length - 1 ? 'Delivered' : 'Transfer'
        }));
        setHistory(historyData);
      } catch (err) {
        console.error(err);
        alert('Product not found');
        navigate('/');
      }
      setLoading(false);
    };

    loadProduct();
  }, [id, account, navigate]);

  const getStatusBadge = (status) => {
    const configs = {
      0: { class: 'status-created', label: 'Created' },
      1: { class: 'status-transit', label: 'In Transit' },
      2: { class: 'status-delivered', label: 'Delivered' }
    };
    const config = configs[status] || configs[0];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="error">Product not found</div>;

  const isOwner = product.currentOwner.toLowerCase() === account?.toLowerCase();

  return (
    <div className="product-details-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Dashboard</button>
      
      <div className="product-detail-card">
        <div className="detail-header">
          <h1>#{product.id} {product.name}</h1>
          {getStatusBadge(product.status)}
        </div>
        
        <div className="detail-section">
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Current Owner</label>
            <div className="address-box">
              {product.currentOwner}
              {isOwner && <span className="you-badge">YOU</span>}
            </div>
          </div>
          <div className="detail-item">
            <label>Created At</label>
            <p>{product.createdAt}</p>
          </div>
        </div>

        {isOwner && (
          <div className="owner-actions">
            <p className="owner-notice">✅ You are the current owner of this product</p>
          </div>
        )}
      </div>

      <div className="history-section">
        <h2>📜 Product History</h2>
        <div className="timeline">
          {history.map((item, idx) => (
            <div key={idx} className={`timeline-item ${idx === history.length - 1 ? 'latest' : ''}`}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-step">{item.step}</span>
                  <span className="timeline-time">{item.timestamp}</span>
                </div>
                <div className="timeline-address">{item.address}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;