import React from 'react';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const ProfileSection = ({ userData, isEditing, onInputChange, onEditClick, onSaveClick, onCancelClick }) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Personal Information</h2>
                {!isEditing && (
                    <button onClick={onEditClick} className="flex items-center gap-2 text-blue-500 font-bold py-2 px-4 rounded-lg hover:bg-blue-50">
                        <FaEdit /> Edit
                    </button>
                )}
            </div>

            {/* Name Field */}
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Name</label>
                <input
                    type="text"
                    name="name"
                    value={userData?.name || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    className="p-3 bg-gray-100 rounded-md border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Phone Number Field (Read-only) */}
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                <input
                    type="text"
                    name="mobile"
                    value={userData?.mobile || ''}
                    readOnly // Always read-only
                    className="p-3 bg-gray-200 cursor-not-allowed rounded-md border border-gray-300"
                />
            </div>

            {/* Address Field */}
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Address</label>
                <textarea
                    name="address"
                    value={userData?.address || ''}
                    onChange={onInputChange}
                    readOnly={!isEditing}
                    rows="3"
                    className="p-3 bg-gray-100 rounded-md border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Action Buttons for Editing Mode */}
            {isEditing && (
                <div className="flex items-center justify-end space-x-4 pt-4">
                    <button onClick={onCancelClick} className="flex items-center gap-2 text-gray-700 font-bold py-2 px-5 rounded-lg hover:bg-gray-100">
                        <FaTimes /> Cancel
                    </button>
                    <button onClick={onSaveClick} className="flex items-center gap-2 bg-green-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-600">
                        <FaSave /> Save
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfileSection;