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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto flex flex-col">
                {/* Modal Header */}
                <div className="p-3 flex justify-between items-center border-b bg-gray-50 rounded-t-lg no-print">
                    <h3 className="text-lg font-bold text-gray-800">Invoice Details</h3>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700">
                            <FaPrint /> Print
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-red-600">
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-2 sm:p-4 max-h-[75vh] overflow-y-auto">
                    {/* The BillTemplate is rendered here for viewing */}
                    <BillTemplate trade={bill} billRef={billContentRef} />
                </div>
            </div>
        </div>
    );
};

export default BillModal;