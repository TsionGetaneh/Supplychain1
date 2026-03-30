import React from 'react';

const getStatusBadge = (status) => {
    const styles = {
        0: { bg: '#6c757d', label: 'Created' },
        1: { bg: '#ffc107', label: 'In Transit' },
        2: { bg: '#28a745', label: 'Delivered' }
    };
    return <span className="status-badge" style={{background: styles[status].bg}}>{styles[status].label}</span>;
};

const ProductTable = ({ products, onViewDetails }) => {
    return (
        <table className="product-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Current Owner</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {products.map(p => (
                    <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.currentOwner.slice(0, 6)}...{p.currentOwner.slice(-4)}</td>
                        <td>{getStatusBadge(p.status)}</td>
                        <td>
                            <button className="action-btn view" onClick={() => onViewDetails(p.id)}>
                                View Details
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ProductTable;