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
            className="p-8 bg-white text-gray-800"
            style={{ width: '210mm', minHeight: '297mm' }} // A4 paper size
        >
            <header className="flex justify-between items-center pb-4 border-b-2 border-gray-200">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-gray-900">Tax Invoice</h1>
                    <p className="text-sm text-gray-500">Invoice ID: {trade.id.slice(-8)}</p>
                    <p className="text-sm text-gray-500">Date: {tradeDate}</p>
                </div>
                <img src={assetlogo} alt="Trade2Cart Logo" className="h-16 w-auto" />
            </header>

            <section className="my-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Billed To</h2>
                        <p className="font-bold text-gray-900">{trade.userName || 'Valued Customer'}</p>
                        <p className="text-gray-600">{trade.address || 'User Address Not Provided'}</p>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">From</h2>
                        <p className="font-bold text-gray-900">{trade.vendorName || 'Assigned Vendor'}</p>
                        <p className="text-gray-600">Trade2Cart Platform</p>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-semibold border-b pb-2 mb-2">Order Summary</h3>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2">Item</th>
                            <th className="p-2 text-center">Weight</th>
                            <th className="p-2 text-center">Rate</th>
                            <th className="p-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2">{item.name}</td>
                                <td className="p-2 text-center">{item.quantity} {item.unit}</td>
                                <td className="p-2 text-center">₹{item.rate}</td>
                                <td className="p-2 text-right">₹{item.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="mt-8 flex justify-end">
                <div className="w-1/2">
                    <div className="flex justify-between border-t pt-2">
                        <p className="font-semibold">Subtotal</p>
                        <p>₹{trade.totalAmount}</p>
                    </div>
                    <div className="flex justify-between mt-2 bg-gray-200 p-2 rounded-lg">
                        <p className="text-xl font-bold">Total Amount</p>
                        <p className="text-xl font-bold">₹{trade.totalAmount}</p>
                    </div>
                </div>
            </section>

            <footer className="mt-16 pt-4 border-t text-center text-xs text-gray-500">
                <p>Thank you for choosing Trade2Cart!</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
            </footer>
        </div>
    );
};

export default BillTemplate;