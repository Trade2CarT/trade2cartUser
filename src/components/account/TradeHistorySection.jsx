import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase'; // Ensure this path is correct
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { FaEye, FaDownload, FaSpinner, FaFileInvoiceDollar, FaUser, FaBoxOpen, FaRupeeSign } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import BillTemplate from '../BillTemplate'; // Your existing bill template

// Helper to format dates
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
    const [processingId, setProcessingId] = useState(null); // Tracks which button is clicked
    const [billForPdf, setBillForPdf] = useState(null); // Holds data for the PDF generator
    const billTemplateRef = useRef(null);

    // 1. Fetch trade history using the reliable 'userId'
    useEffect(() => {
        if (!originalUserData?.id) return;

        const fetchTrades = async () => {
            setLoading(true);
            try {
                const tradesRef = ref(db, 'trades');
                const tradesQuery = query(tradesRef, orderByChild('userId'), equalTo(originalUserData.id));
                const snapshot = await get(tradesQuery);

                if (snapshot.exists()) {
                    const tradesData = [];
                    snapshot.forEach(child => {
                        // Only include completed trades
                        if (child.val().status?.toLowerCase() === 'completed') {
                            tradesData.push({ id: child.key, ...child.val() });
                        }
                    });
                    tradesData.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
                    setTrades(tradesData);
                }
            } catch (error) {
                toast.error("Could not fetch trade history.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrades();
    }, [originalUserData]);

    // 2. Generate PDF when the 'billForPdf' state is set
    useEffect(() => {
        if (billForPdf && billTemplateRef.current) {
            // Use a timeout to ensure the component has rendered with the new data
            setTimeout(() => {
                html2canvas(billTemplatereF.current, { scale: 2 })
                    .then((canvas) => {
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                        const pdfWidth = pdf.internal.pageSize.getWidth();
                        const pdfHeight = pdf.internal.pageSize.getHeight();
                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                        pdf.save(`invoice-${billForPdf.id.slice(-6)}.pdf`);
                    })
                    .catch(() => toast.error("Failed to generate PDF."))
                    .finally(() => {
                        setBillForPdf(null); // Reset state
                        setProcessingId(null); // Reset loading spinner
                    });
            }, 300); // A small delay can help ensure rendering is complete
        }
    }, [billForPdf]);

    // 3. Handlers for the View and Download buttons
    const handleViewBill = (trade) => {
        onViewBill(trade); // This passes the data to AccountPage, which opens the modal
    };

    const handleDownloadBill = (trade) => {
        setProcessingId({ id: trade.id, type: 'download' });
        setBillForPdf(trade); // This triggers the PDF generation useEffect
    };

    if (loading) {
        return <p className="text-center text-gray-500 py-4">Loading history...</p>;
    }

    return (
        <>
            {/* This hidden component is used only for generating the PDF */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <BillTemplate trade={billForPdf} billRef={billTemplateRef} />
            </div>

            {trades.length > 0 ? (
                <div className="space-y-4">
                    {trades.map((trade) => (
                        <div key={trade.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-3 bg-gray-50 flex justify-between items-center">
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Completed</span>
                                <p className="text-xs text-gray-500 font-medium">{formatDate(trade.assignedAt)}</p>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaUser className="text-gray-400" />
                                    <p className="text-sm text-gray-700">Vendor: <span className="font-bold">{trade.vendorName}</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FaBoxOpen className="text-gray-400" />
                                    <p className="text-sm text-gray-700">
                                        Products: <span className="font-semibold">{trade.products.map(p => p.name).join(', ')}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <FaRupeeSign className="text-green-600" />
                                    <p className="text-lg font-bold text-green-600">{trade.totalAmount}</p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <button
                                        onClick={() => handleViewBill(trade)}
                                        disabled={!!processingId}
                                        className="flex items-center gap-2 bg-gray-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                                    >
                                        <FaEye /> View
                                    </button>
                                    <button
                                        onClick={() => handleDownloadBill(trade)}
                                        disabled={!!processingId}
                                        className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold py-1.5 px-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                                    >
                                        {processingId?.id === trade.id ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                                        Download
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