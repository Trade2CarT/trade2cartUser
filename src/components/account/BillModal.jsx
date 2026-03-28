import React, { useRef } from 'react';
import { FaPrint, FaTimes, FaDownload } from 'react-icons/fa';
import BillTemplate from '../BillTemplate';

const BillModal = ({ bill, onClose }) => {
    const billContentRef = useRef(null);

    const handlePrint = () => {
        const content = billContentRef.current;
        if (!content) return;
        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write('<html><head><title>Print Receipt</title>');
        printWindow.document.write(`
            <style>
                body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #111827; }
                @media print { .no-print { display: none; } }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 250);
    };

    if (!bill) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 transition-all duration-300">
            <div className="bg-white w-full max-w-2xl mx-auto flex flex-col rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-slide-up sm:animate-fade-in max-h-[90vh]">

                {/* Modal Header */}
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100 bg-white rounded-t-[32px] no-print">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Digital Receipt</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">ID: #{bill.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto bg-gray-50 custom-scrollbar flex-1">
                    <BillTemplate trade={bill} billRef={billContentRef} />
                </div>

                {/* Modal Footer / Action */}
                <div className="p-5 bg-white border-t border-gray-100 rounded-b-[32px] no-print flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-[2] flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-[0.98] transition-all"
                    >
                        <FaDownload /> Save / Print Receipt
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default BillModal;