import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FaExclamationTriangle, FaDownload, FaSpinner, FaUser, FaBoxOpen, FaRupeeSign } from 'react-icons/fa';
import { db, firebaseObjectToArray } from '../../firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BillTemplate from '../BillTemplate';
import { toast } from 'react-hot-toast';

const StatusBadge = ({ status }) => {
    // This will always show "Completed" now, but is kept for consistency
    return (
        <div className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
            Completed
        </div>
    );
};

const TradeHistorySection = ({ userMobile, originalUserData }) => {
    const [userHistory, setUserHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [billData, setBillData] = useState(null);
    const [isDownloading, setIsDownloading] = useState(null);
    const billTemplateRef = useRef(null);

    useEffect(() => {
        if (!userMobile) return;
        const fetchHistory = async () => {
            setHistoryLoading(true);
            try {
                const assignmentsRef = ref(db, 'assignments');
                const historyQuery = query(assignmentsRef, orderByChild('mobile'), equalTo(userMobile));
                const snapshot = await get(historyQuery);
                setUserHistory(firebaseObjectToArray(snapshot));
            } finally {
                setHistoryLoading(false);
            }
        };
        fetchHistory();
    }, [userMobile]);

    const processedUserHistory = useMemo(() => {
        const now = new Date();
        const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
        return userHistory
            .map(entry => {
                if (!entry.assignedAt) return null;
                const assignedDate = new Date(entry.assignedAt);
                if (isNaN(assignedDate.getTime())) return null;
                const expiryDate = new Date(assignedDate.getTime() + SEVEN_DAYS_IN_MS);
                const remainingTime = expiryDate.getTime() - now.getTime();
                if (remainingTime < 0) return null;
                const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
                return { ...entry, remainingDays };
            })
            .filter(Boolean) // Removes expired entries
            // --- NEW: Only include trades with a 'completed' status ---
            .filter(entry => entry.status && entry.status.toLowerCase() === 'completed')
            .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
    }, [userHistory]);

    const handleDownloadBill = async (tradeEntry) => {
        const assignmentId = tradeEntry.id;
        setIsDownloading(assignmentId);
        try {
            const billsRef = ref(db, 'bills');
            const billQuery = query(billsRef, orderByChild('assignmentID'), equalTo(assignmentId));
            const snapshot = await get(billQuery);

            if (!snapshot.exists()) {
                toast.error("Bill details not found.");
                setIsDownloading(null);
                return;
            }

            const billDetails = firebaseObjectToArray(snapshot)[0];
            const completeBillData = {
                id: assignmentId,
                assignedAt: tradeEntry.assignedAt,
                vendorName: tradeEntry.vendorName,
                userName: originalUserData?.name,
                address: originalUserData?.address,
                totalAmount: billDetails.totalBill,
                products: billDetails.billItems.map(item => ({
                    name: item.name,
                    quantity: item.weight,
                    unit: 'kg',
                    rate: item.rate,
                    total: item.total
                }))
            };

            setBillData(completeBillData);

            setTimeout(() => {
                const input = billTemplateRef.current;
                if (input) {
                    html2canvas(input, { scale: 2 }).then((canvas) => {
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                        pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                        pdf.save(`invoice-${assignmentId.slice(-6)}.pdf`);
                    }).finally(() => {
                        setBillData(null);
                        setIsDownloading(null);
                    });
                } else {
                    setIsDownloading(null);
                }
            }, 500);
        } catch (error) {
            toast.error("Could not download bill.");
            setIsDownloading(null);
        }
    };

    return (
        <>
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <BillTemplate trade={billData} billRef={billTemplateRef} />
            </div>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 rounded-md mb-4 text-sm" role="alert">
                <div className="flex items-center gap-2"><FaExclamationTriangle /> <p>Completed trade history is deleted after 7 days.</p></div>
            </div>

            {historyLoading ? <p>Loading history...</p> : processedUserHistory.length > 0 ? (
                <div className="space-y-4">
                    {processedUserHistory.map((entry) => (
                        <div key={entry.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-3 bg-gray-50 flex justify-between items-center">
                                <StatusBadge status={entry.status} />
                                <p className="text-xs text-gray-500 font-medium">{new Date(entry.assignedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3"><FaUser className="text-gray-400" /><p className="text-sm text-gray-700">Vendor: <span className="font-bold">{entry.vendorName}</span></p></div>
                                <div className="flex items-center gap-3"><FaBoxOpen className="text-gray-400" /><p className="text-sm text-gray-700">Products: <span className="font-semibold">{entry.products}</span></p></div>
                            </div>
                            <div className="p-3 bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center gap-1"><FaRupeeSign className="text-green-600" /><p className="text-lg font-bold text-green-600">{entry.totalAmount}</p></div>

                                {/* --- MODIFIED: Shows both countdown and button --- */}
                                <div className="flex items-center gap-4">
                                    <p className="text-xs text-red-600 font-medium">Deletes in {entry.remainingDays} {entry.remainingDays > 1 ? 'days' : 'day'}</p>
                                    <button onClick={() => handleDownloadBill(entry)} disabled={isDownloading === entry.id} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                                        {isDownloading === entry.id ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                                        {isDownloading === entry.id ? 'Preparing...' : 'Download Bill'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500">No completed trades found.</div>
            )}
        </>
    );
};

export default TradeHistorySection;