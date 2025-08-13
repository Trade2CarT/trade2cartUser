import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { FaEye, FaSpinner, FaFileInvoiceDollar, FaUser, FaRupeeSign, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TradeHistorySection = ({ userId, originalUserData, onViewBill }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchAssignments = async () => {
            setLoading(true);
            try {
                const assignmentsRef = ref(db, 'assignments');
                const historyQuery = query(assignmentsRef, orderByChild('userId'), equalTo(userId));
                const snapshot = await get(historyQuery);

                if (snapshot.exists()) {
                    const assignmentsData = [];
                    snapshot.forEach(child => {
                        const assignment = { id: child.key, ...child.val() };
                        if (assignment.status?.toLowerCase() === 'completed') {
                            assignmentsData.push(assignment);
                        }
                    });
                    assignmentsData.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
                    setAssignments(assignmentsData);
                }
            } catch (error) {
                toast.error("Could not fetch trade history.");
                console.error("History fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [userId]);

    const fetchBillDetails = async (assignment) => {
        setProcessingId({ id: assignment.id, type: 'bill' });
        try {
            const billsRef = ref(db, 'bills');
            const billQuery = query(billsRef, orderByChild('assignmentID'), equalTo(assignment.id));
            const snapshot = await get(billQuery);

            if (!snapshot.exists()) {
                toast.error("Bill details not found for this trade.");
                return null;
            }

            let billDetails = null;
            snapshot.forEach(child => { billDetails = child.val(); });

            if (!billDetails || !Array.isArray(billDetails.billItems)) {
                toast.error("Bill data is malformed and cannot be displayed.");
                return null;
            }

            return {
                id: assignment.id,
                assignedAt: assignment.assignedAt,
                vendorName: assignment.vendorName,
                userName: originalUserData?.name,
                address: originalUserData?.address,
                totalAmount: billDetails.totalBill,
                products: billDetails.billItems.map(item => ({
                    name: item.item || item.name,
                    quantity: item.weight,
                    unit: item.unit || 'kg',
                    rate: item.rate,
                    total: item.total
                }))
            };
        } catch (error) {
            toast.error("Could not retrieve bill details.");
            return null;
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewBill = async (assignment) => {
        const completeBillData = await fetchBillDetails(assignment);
        if (completeBillData) {
            onViewBill(completeBillData);
        }
    };

    if (loading) {
        return <div className="text-center py-4 text-gray-500">Loading history...</div>;
    }

    return (
        <>
            {/* --- NEW WARNING MESSAGE --- */}
            <div className="p-3 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 flex items-center gap-3 rounded-r-lg">
                <FaInfoCircle />
                <p className="text-xs font-medium">Trade history is automatically deleted after 7 days.</p>
            </div>

            {assignments.length > 0 ? (
                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-3 bg-gray-50 flex justify-between items-center">
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Completed</span>
                                <p className="text-xs text-gray-500 font-medium">{formatDate(assignment.assignedAt)}</p>
                            </div>
                            <div className="p-4 grid grid-cols-2 items-center">
                                <div className="flex items-center gap-3">
                                    <FaUser className="text-gray-400" />
                                    <p className="text-sm text-gray-700">Vendor: <span className="font-bold">{assignment.vendorName}</span></p>
                                </div>
                                <div className="flex items-center gap-1 justify-end">
                                    <FaRupeeSign className="text-green-600" />
                                    <p className="text-lg font-bold text-green-600">{assignment.totalAmount || '...'}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 border-t flex justify-end items-center gap-2 sm:gap-4">
                                <button onClick={() => handleViewBill(assignment)} disabled={!!processingId} className="flex items-center gap-2 bg-gray-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-gray-700 disabled:bg-gray-400">
                                    {processingId?.id === assignment.id ? <FaSpinner className="animate-spin" /> : <FaEye />} View
                                </button>
                                {/* --- DOWNLOAD BUTTON REMOVED --- */}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <FaFileInvoiceDollar className="mx-auto text-4xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">No History Found</h3>
                    <p className="text-sm text-gray-500">You have not completed any trades yet.</p>
                </div>
            )}
        </>
    );
};

export default TradeHistorySection;