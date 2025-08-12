import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Make sure this path is correct
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { FaFileInvoiceDollar } from 'react-icons/fa';

// Helper function to format date
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const TradeHistorySection = ({ originalUserData, onViewBill }) => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Ensure we have user data before fetching trades
        if (!originalUserData || !originalUserData.id) {
            setLoading(false);
            return;
        }

        const fetchTrades = async () => {
            try {
                // Query the 'trades' node where the 'userId' matches the current user's ID
                const tradesRef = ref(db, 'trades');
                const tradesQuery = query(tradesRef, orderByChild('userId'), equalTo(originalUserData.id));

                const snapshot = await get(tradesQuery);

                if (snapshot.exists()) {
                    const tradesData = [];
                    snapshot.forEach(childSnapshot => {
                        tradesData.push({ id: childSnapshot.key, ...childSnapshot.val() });
                    });
                    // Sort trades by date, newest first
                    tradesData.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
                    setTrades(tradesData);
                } else {
                    // No trades found for this user
                    setTrades([]);
                }
            } catch (err) {
                console.error("Error fetching trade history:", err);
                setError('Could not load trade history.');
            } finally {
                setLoading(false);
            }
        };

        fetchTrades();
    }, [originalUserData]); // Rerun when user data is available

    if (loading) {
        return <p className="text-center text-gray-500">Loading history...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500">{error}</p>;
    }

    if (trades.length === 0) {
        return (
            <div className="text-center py-8">
                <FaFileInvoiceDollar className="mx-auto text-4xl text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">No History Found</h3>
                <p className="text-sm text-gray-500">You have not completed any trades yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {trades.map((trade) => (
                <div key={trade.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                    <div>
                        <p className="font-bold text-gray-800">vs. {trade.vendorName || 'Vendor'}</p>
                        <p className="text-sm text-gray-500">{formatDate(trade.assignedAt)}</p>
                        <p className="text-lg font-semibold text-green-600 mt-1">₹{trade.totalAmount || '0.00'}</p>
                    </div>
                    <button
                        onClick={() => onViewBill(trade)}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View Bill
                    </button>
                </div>
            ))}
        </div>
    );
};

export default TradeHistorySection;