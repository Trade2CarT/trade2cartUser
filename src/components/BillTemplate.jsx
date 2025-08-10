import React from 'react';
import assetlogo from '../assets/images/logo.PNG';

const BillTemplate = ({ trade, billRef }) => {
    if (!trade) return null;

    const items = Array.isArray(trade.products) ? trade.products : [];
    const tradeDate = new Date(trade.assignedAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div
            ref={billRef}
            id={`bill-${trade.id}`}
            className="bg-white text-gray-800"
            style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm',
                fontFamily: 'Arial, sans-serif',
                boxSizing: 'border-box'
            }}
        >
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '4px' }}>Tax Invoice</h1>
                    <p style={{ fontSize: '12px', color: '#555' }}>Invoice ID: {trade.id.slice(-8)}</p>
                    <p style={{ fontSize: '12px', color: '#555' }}>Date: {tradeDate}</p>
                </div>
                <img src={assetlogo} alt="Trade2Cart Logo" style={{ height: '60px', width: 'auto' }} />
            </header>

            {/* Customer & Vendor Info */}
            <section style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                    <div>
                        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '4px' }}>Billed To</h2>
                        <p style={{ fontWeight: 'bold' }}>{trade.userName || 'Valued Customer'}</p>
                        <p style={{ fontSize: '12px', color: '#555' }}>{trade.address || 'User Address Not Provided'}</p>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '4px' }}>From</h2>
                        <p style={{ fontWeight: 'bold' }}>{trade.vendorName || 'Assigned Vendor'}</p>
                        <p style={{ fontSize: '12px', color: '#555' }}>Trade2Cart Platform</p>
                    </div>
                </div>
            </section>

            {/* Order Table */}
            <section>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px' }}>Order Summary</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f8f8', borderBottom: '1px solid #ccc' }}>
                            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Item</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc' }}>Weight</th>
                            <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc' }}>Rate</th>
                            <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{item.name}</td>
                                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc' }}>{item.quantity} {item.unit}</td>
                                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #ccc' }}>₹{item.rate}</td>
                                <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc' }}>₹{item.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Totals */}
            <section style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '50%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
                        <p style={{ fontWeight: 'bold' }}>Subtotal</p>
                        <p>₹{trade.totalAmount}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '6px', marginTop: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold' }}>Total Amount</p>
                        <p style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{trade.totalAmount}</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ marginTop: '40px', paddingTop: '10px', borderTop: '1px solid #ccc', textAlign: 'center', fontSize: '10px', color: '#777' }}>
                <p>Thank you for choosing Trade2Cart!</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
            </footer>
        </div>
    );
};

export default BillTemplate;
