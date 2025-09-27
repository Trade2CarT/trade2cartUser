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
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      {/* This inner div prevents clicks inside the modal from closing it */}
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Stop click from bubbling up to the overlay
      >
        <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;