import React from 'react';

// Helper to format the date
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Use React.forwardRef to allow the component to receive a ref and forward it to a DOM element.
const BillTemplate = React.forwardRef(({ trade }, ref) => {
    // If there's no trade data, render nothing. This prevents errors.
    if (!trade) {
        return null;
    }

    return (
        // Attach the forwarded ref to this main div
        <div ref={ref} className="p-8 bg-white text-gray-800" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'sans-serif' }}>
            <header className="flex justify-between items-center pb-4 border-b-2 border-gray-800">
                <h1 className="text-4xl font-bold text-gray-900">INVOICE</h1>
                <div className="text-right">
                    <p className="text-sm">Invoice #: {trade.id.slice(-6)}</p>
                    <p className="text-sm">Date: {formatDate(trade.assignedAt)}</p>
                </div>
            </header>

            <section className="my-8 grid grid-cols-2 gap-4">
                <div>
                    <h2 className="text-sm font-bold mb-2">BILLED TO:</h2>
                    <p className="font-semibold">{trade.userName || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{trade.address || 'No address provided'}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-sm font-bold mb-2">FROM:</h2>
                    <p className="font-semibold">{trade.vendorName || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Trade2Cart Vendor</p>
                </div>
            </section>

            <section>
                <table className="w-full text-left">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="p-2">ITEM</th>
                            <th className="p-2 text-right">QUANTITY</th>
                            <th className="p-2 text-right">RATE</th>
                            <th className="p-2 text-right">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trade.products.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2 font-medium">{item.name}</td>
                                <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                                <td className="p-2 text-right">₹{parseFloat(item.rate).toFixed(2)}</td>
                                <td className="p-2 text-right">₹{parseFloat(item.total).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <footer className="mt-8 text-right">
                <div className="inline-block p-4 bg-gray-100 rounded-md">
                    <p className="text-sm font-bold">GRAND TOTAL</p>
                    <p className="text-3xl font-bold">₹{parseFloat(trade.totalAmount).toFixed(2)}</p>
                </div>
                <p className="text-xs text-gray-500 mt-4">Thank you for your business!</p>
            </footer>
        </div>
    );
});

export default BillTemplate;