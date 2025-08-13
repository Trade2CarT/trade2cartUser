import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { FaEye, FaDownload, FaSpinner, FaFileInvoiceDollar, FaUser, FaRupeeSign } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import BillTemplate from '../BillTemplate';

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TradeHistorySection = ({ userId, originalUserData, onViewBill }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [billForPdf, setBillForPdf] = useState(null);
    const billTemplateRef = useRef(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchAssignments = async () => {
            setLoading(true);
            try {
                const assignmentsRef = ref(db, 'assignments');
                // --- THIS IS THE FIX ---
                // Changed 'userID' to 'userId' to match the actual data structure.
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

    const handleDownloadBill = async (assignment) => {
        const completeBillData = await fetchBillDetails(assignment);
        if (completeBillData) {
            setBillForPdf(completeBillData);
        }
    };

    useEffect(() => {
        // We still check if the data and the ref are ready
        if (billForPdf && billTemplateRef.current) {

            // --- THIS IS THE FIX ---
            // We wait 100 milliseconds before generating the PDF.
            // This gives the browser a moment to render the bill template, including the logo image.
            const timer = setTimeout(() => {
                html2canvas(billTemplateRef.current, { scale: 2 })
                    .then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                        pdf.save(`invoice-${billForPdf.id.slice(-6)}.pdf`);
                    })
                    .catch(() => toast.error("PDF generation failed."))
                    .finally(() => setBillForPdf(null)); // Reset the state
            }, 100);

            // Cleanup the timer if the component unmounts
            return () => clearTimeout(timer);
        }
    }, [billForPdf]); // This effect still runs when billForPdf changes

    if (loading) {
        return <div className="text-center py-4 text-gray-500">Loading history...</div>;
    }

    return (
        <>
            <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
                <BillTemplate trade={billForPdf} billRef={billTemplateRef} />
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
                                <button onClick={() => handleDownloadBill(assignment)} disabled={!!processingId} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                                    {processingId?.id === assignment.id ? <FaSpinner className="animate-spin" /> : <FaDownload />} Download
                                </button>
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