import React from 'react';

const Timeline = ({ history }) => {
    const formatTime = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const getStatusLabel = (index, total) => {
        if (index === 0) return 'Created';
        if (index === total - 1) return 'Delivered';
        return 'In Transit';
    };

    return (
        <div className="timeline">
            <h3>Product Journey</h3>
            <div className="timeline-container">
                {history.owners.map((owner, idx) => (
                    <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <div className="timeline-header">
                                <span className="timeline-action">{getStatusLabel(idx, history.owners.length)}</span>
                                <span className="timeline-time">{formatTime(history.times[idx])}</span>
                            </div>
                            <div className="timeline-address">
                                {owner.slice(0, 6)}...{owner.slice(-4)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Timeline;