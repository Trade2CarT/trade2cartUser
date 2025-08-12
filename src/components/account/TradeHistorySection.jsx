import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { FaEye, FaDownload, FaSpinner, FaFileInvoiceDollar, FaUser, FaBoxOpen, FaRupeeSign } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import BillTemplate from '../BillTemplate';

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TradeHistorySection = ({ userMobile, originalUserData, onViewBill }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [billForPdf, setBillForPdf] = useState(null);
    const billTemplateRef = useRef(null);

    useEffect(() => {
        if (!userMobile) {
            setLoading(false);
            return;
        }

        const fetchAssignments = async () => {
            setLoading(true);
            try {
                const assignmentsRef = ref(db, 'assignments');
                const historyQuery = query(assignmentsRef, orderByChild('mobile'), equalTo(userMobile));
                const snapshot = await get(historyQuery);

                if (snapshot.exists()) {
                    const assignmentsData = [];
                    snapshot.forEach(child => {
                        if (child.val().status?.toLowerCase() === 'completed') {
                            assignmentsData.push({ id: child.key, ...child.val() });
                        }
                    });
                    assignmentsData.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
                    setAssignments(assignmentsData);
                }
            } catch (error) {
                toast.error("Could not fetch history.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [userMobile]);

    const fetchBillDetails = async (assignment) => {
        // ✨ DEBUG: Log the ID we are searching for
        console.log(`Searching for bill with assignmentID: ${assignment.id}`);

        try {
            const billsRef = ref(db, 'bills');
            const billQuery = query(billsRef, orderByChild('assignmentID'), equalTo(assignment.id));
            const snapshot = await get(billQuery);

            // ✨ DEBUG: Log whether we found a matching bill
            console.log(`Did a bill snapshot exist? ${snapshot.exists()}`);

            if (!snapshot.exists()) {
                toast.error("Bill details not found for this trade.");
                return null;
            }

            let billDetails = null;
            snapshot.forEach(child => { billDetails = child.val(); });

            const completeBill = {
                id: assignment.id,
                assignedAt: assignment.assignedAt,
                vendorName: assignment.vendorName,
                userName: originalUserData?.name,
                address: originalUserData?.address,
                totalAmount: billDetails.totalBill,
                products: billDetails.billItems.map(item => ({
                    name: item.item,
                    quantity: item.weight,
                    unit: item.unit || 'kg',
                    rate: item.rate,
                    total: item.total
                }))
            };

            // ✨ DEBUG: Log the final combined bill data
            console.log("Successfully constructed bill data:", completeBill);
            return completeBill;

        } catch (error) {
            toast.error("Could not retrieve bill details.");
            console.error("Error in fetchBillDetails:", error);
            return null;
        }
    };

    const handleViewBill = async (assignment) => {
        // ✨ DEBUG: Log that the view button was clicked
        console.log("View button clicked for assignment:", assignment);
        setProcessingId({ id: assignment.id, type: 'view' });
        const completeBillData = await fetchBillDetails(assignment);
        if (completeBillData) {
            onViewBill(completeBillData);
        }
        setProcessingId(null);
    };

    const handleDownloadBill = async (assignment) => {
        // ✨ DEBUG: Log that the download button was clicked
        console.log("Download button clicked for assignment:", assignment);
        setProcessingId({ id: assignment.id, type: 'download' });
        const completeBillData = await fetchBillDetails(assignment);
        if (completeBillData) {
            setBillForPdf(completeBillData);
        } else {
            setProcessingId(null);
        }
    };

    useEffect(() => {
        if (billForPdf && billTemplateRef.current) {
            setTimeout(() => {
                html2canvas(billTemplateRef.current, { scale: 2 })
                    .then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                        pdf.save(`invoice-${billForPdf.id.slice(-6)}.pdf`);
                    })
                    .catch(() => toast.error("PDF generation failed."))
                    .finally(() => {
                        setBillForPdf(null);
                        setProcessingId(null);
                    });
            }, 300);
        }
    }, [billForPdf]);


    if (loading) {
        return <p className="text-center text-gray-500 py-4">Loading history...</p>;
    }

    return (
        <>
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
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
                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaUser className="text-gray-400" />
                                    <p className="text-sm text-gray-700">Vendor: <span className="font-bold">{assignment.vendorName}</span></p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <FaRupeeSign className="text-green-600" />
                                    <p className="text-lg font-bold text-green-600">{assignment.totalAmount || '...'}</p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <button onClick={() => handleViewBill(assignment)} disabled={!!processingId} className="flex items-center gap-2 bg-gray-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-gray-700 disabled:bg-gray-400">
                                        {processingId?.id === assignment.id && processingId.type === 'view' ? <FaSpinner className="animate-spin" /> : <FaEye />} View
                                    </button>
                                    <button onClick={() => handleDownloadBill(assignment)} disabled={!!processingId} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                                        {processingId?.id === assignment.id && processingId.type === 'download' ? <FaSpinner className="animate-spin" /> : <FaDownload />} Download
                                    </button>
                                </div>
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