import React from 'react';
import assetlogo from '../assets/images/logo.PNG'; // Using your logo

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const BillTemplate = React.forwardRef(({ trade }, ref) => {
    if (!trade) {
        return null;
    }

    return (
        <div ref={ref} className="bg-white text-gray-900" style={{ width: '21cm', height: '29.7cm', fontFamily: 'Arial, sans-serif', padding: '1cm' }}>
            <header className="flex justify-between items-start pb-4 mb-8 border-b-2 border-gray-200">
                <img src={assetlogo} alt="Trade2Cart Logo" style={{ width: '80px', height: 'auto' }} />
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                    <p className="text-sm text-gray-500 mt-1">Invoice #: {trade.id.slice(-6)}</p>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-8 mb-10">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Billed To</p>
                    <p className="text-base font-bold">{trade.userName || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{trade.address || 'No address provided'}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Collected By</p>
                    <p className="text-base font-bold">{trade.vendorName || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Trade Date: {formatDate(trade.assignedAt)}</p>
                </div>
            </section>

            <section>
                <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th className="p-3 text-left text-sm font-semibold uppercase">Item Description</th>
                            <th className="p-3 text-right text-sm font-semibold uppercase">Qty</th>
                            <th className="p-3 text-right text-sm font-semibold uppercase">Rate</th>
                            <th className="p-3 text-right text-sm font-semibold uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trade.products.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3 text-right">{item.quantity} {item.unit}</td>
                                <td className="p-3 text-right">₹{parseFloat(item.rate).toFixed(2)}</td>
                                <td className="p-3 text-right font-medium">₹{parseFloat(item.total).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <footer className="flex justify-end mt-10">
                <div className="w-1/3">
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Subtotal</span>
                        <span className="text-sm font-medium">₹{parseFloat(trade.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t-2 border-gray-800">
                        <span className="text-lg font-bold">Grand Total</span>
                        <span className="text-lg font-bold">₹{parseFloat(trade.totalAmount).toFixed(2)}</span>
                    </div>
                </div>
            </footer>
            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-xs text-gray-400">Thank you for choosing Trade2Cart!</p>
            </div>
        </div>
    );
});

export default BillTemplate;