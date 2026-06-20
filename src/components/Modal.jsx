// src/components/Modal.jsx

import React, { useEffect } from 'react';

const Modal = ({ content, onClose }) => {
  // Effect to handle the 'Escape' key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    // The outer div handles clicks on the background overlay to close the modal
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4 transition-opacity animate-fade-in"
      onClick={onClose}
    >
      {/* This inner div prevents clicks inside the modal from closing it */}
      <div
        className="bg-white p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()} // Stop click from bubbling up to the overlay
      >
        <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        <button
          onClick={onClose}
          className="mt-6 w-full py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 active:scale-[0.98] font-bold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;