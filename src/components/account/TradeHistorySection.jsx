import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { FaEye, FaSpinner, FaFileInvoiceDollar, FaUser, FaRupeeSign, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';

const STR = {
    English: {
        fetchFailed: "Could not fetch trade history.",
        billNotFound: "Bill details not found.",
        privacyNote: "For your privacy and security, trade history and digital receipts are automatically cleared after 7 days.",
        completed: "Completed",
        handledBy: "Handled By",
        totalEarned: "Total Earned",
        loadingReceipt: "Loading Receipt...",
        viewReceipt: "View Digital Receipt",
        noTrades: "No Recent Trades",
        noTradesDesc: "Your completed scrap pickups will appear here."
    },
    Tamil: {
        fetchFailed: "பரிவர்த்தனை வரலாற்றைப் பெற முடியவில்லை.",
        billNotFound: "பில் விவரங்கள் கிடைக்கவில்லை.",
        privacyNote: "உங்கள் தனியுரிமை மற்றும் பாதுகாப்பிற்காக, பரிவர்த்தனை வரலாறு மற்றும் டிஜிட்டல் ரசீதுகள் 7 நாட்களுக்குப் பிறகு தானாக அழிக்கப்படும்.",
        completed: "முடிந்தது",
        handledBy: "கையாண்டவர்",
        totalEarned: "மொத்த வருமானம்",
        loadingReceipt: "ரசீது ஏற்றப்படுகிறது...",
        viewReceipt: "டிஜிட்டல் ரசீதைப் பார்க்கவும்",
        noTrades: "சமீபத்திய பரிவர்த்தனைகள் இல்லை",
        noTradesDesc: "முடிந்த ஸ்கிராப் பிக்-அப்கள் இங்கே தோன்றும்."
    }
};

// ✅ NEW: Ghost Loader for History
const HistorySkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded-md"></div>
                </div>
                <div className="w-1/2 h-5 bg-gray-200 rounded-md mb-2"></div>
                <div className="w-1/3 h-8 bg-gray-200 rounded-md mb-4"></div>
                <div className="w-full h-10 bg-gray-200 rounded-xl"></div>
            </div>
        ))}
    </div>
);

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TradeHistorySection = ({ userId, originalUserData, onViewBill }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const { language } = useSettings();
    const t = STR[language] || STR.English;

    // EXACT FIREBASE LOGIC PRESERVED
    useEffect(() => {
        if (!userId) { setLoading(false); return; }
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
                        if (assignment.status?.toLowerCase() === 'completed') assignmentsData.push(assignment);
                    });
                    assignmentsData.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
                    setAssignments(assignmentsData);
                }
            } catch {
                toast.error(t.fetchFailed);
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
            if (!snapshot.exists()) { toast.error(t.billNotFound); return null; }

            let billDetails = null;
            snapshot.forEach(child => { billDetails = child.val(); });
            if (!billDetails || !Array.isArray(billDetails.billItems)) return null;

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
        } catch {
            return null;
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewBill = async (assignment) => {
        const completeBillData = await fetchBillDetails(assignment);
        if (completeBillData) onViewBill(completeBillData);
    };

    if (loading) return <HistorySkeleton />;

    return (
        <div className="mt-2">
            <div className="p-4 mb-6 bg-brand-50/50 border border-brand-100 text-brand-800 flex items-start gap-3 rounded-2xl shadow-sm">
                <FaInfoCircle className="mt-0.5 text-brand-500 flex-shrink-0" size={16} />
                <p className="text-xs font-medium leading-relaxed">{t.privacyNote}</p>
            </div>

            {assignments.length > 0 ? (
                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">

                            {/* Card Header */}
                            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full border border-green-200">
                                    <FaCheckCircle className="text-green-600 text-xs" />
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-800">{t.completed}</span>
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{formatDate(assignment.assignedAt)}</p>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{t.handledBy}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center shadow-inner"><FaUser size={12} /></div>
                                        <p className="text-sm font-extrabold text-gray-900">{assignment.vendorName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{t.totalEarned}</p>
                                    <p className="text-2xl font-black text-green-600 tracking-tight">₹{assignment.totalAmount || '0'}</p>
                                </div>
                            </div>

                            {/* Card Footer / Action */}
                            <div className="px-5 pb-5">
                                <button
                                    onClick={() => handleViewBill(assignment)}
                                    disabled={!!processingId}
                                    className="w-full flex justify-center items-center gap-2 bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {processingId?.id === assignment.id ? (
                                        <><FaSpinner className="animate-spin" /> {t.loadingReceipt}</>
                                    ) : (
                                        <><FaFileInvoiceDollar /> {t.viewReceipt}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <FaFileInvoiceDollar className="text-3xl text-gray-300" />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-800 mb-1">{t.noTrades}</h3>
                    <p className="text-sm text-gray-500 font-medium">{t.noTradesDesc}</p>
                </div>
            )}
        </div>
    );
};

export default TradeHistorySection;