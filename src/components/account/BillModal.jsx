import React, { useRef } from 'react';
import { FaPrint, FaTimes } from 'react-icons/fa';
import BillTemplate from '../BillTemplate'; // Re-use your existing bill template

const BillModal = ({ bill, onClose }) => {
    const billContentRef = useRef(null);

    const handlePrint = () => {
        const content = billContentRef.current;
        if (!content) return;

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write('<html><head><title>Print Bill</title>');
        // Optional: Add basic styling for printing
        printWindow.document.write(`
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    if (!bill) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4 animate-fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl mx-auto flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-slide-up sm:animate-fade-in overflow-hidden">
                {/* Modal Header */}
                <div className="flex-none p-4 flex justify-between items-center border-b border-gray-100 bg-white no-print">
                    <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Invoice Details</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 text-sm font-bold bg-brand-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:bg-brand-700 active:scale-[0.98] transition-all">
                            <FaPrint /> Print
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 bg-gray-50 p-2.5 rounded-xl hover:bg-gray-200 transition-colors">
                            <FaTimes size={18} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-3 sm:p-5 overflow-y-auto bg-gray-50">
                    {/* The BillTemplate is rendered here for viewing */}
                    <BillTemplate trade={bill} ref={billContentRef} />
                </div>
            </div>
        </div>
    );
};

export default BillModal;