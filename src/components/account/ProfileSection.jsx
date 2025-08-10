import React from 'react';
import { FaEdit, FaSave } from 'react-icons/fa';

const ProfileSection = ({
    userData,
    isEditing,
    onInputChange,
    onEditClick,
    onSaveClick,
    onCancelClick
}) => {
    if (!userData) {
        return <p>Loading profile...</p>;
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block font-medium mb-1">Name</label>
                <input
                    type="text"
                    name="name"
                    value={userData.name || ''}
                    onChange={onInputChange}
                    disabled={!isEditing}
                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
            </div>
            <div>
                <label className="block font-medium mb-1">Phone Number</label>
                <input
                    type="text"
                    value={userData.phone || ''}
                    disabled
                    className="w-full p-2 bg-gray-100 border rounded-md cursor-not-allowed"
                />
            </div>
            <div>
                <label className="block font-medium mb-1">Address</label>
                <textarea
                    name="address"
                    value={userData.address || ''}
                    onChange={onInputChange}
                    disabled={!isEditing}
                    rows="3"
                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
            </div>
            <div>
                <label className="block font-medium mb-1">Location</label>
                <select
                    name="location"
                    value={userData.location || ''}
                    onChange={onInputChange}
                    disabled={!isEditing}
                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-gray-100 cursor-not-allowed appearance-none' : 'bg-white'}`}
                >
                    <option value="Vellore">Vellore</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Bangalore">Bengaluru</option>
                </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                {isEditing ? (
                    <>
                        <button onClick={onCancelClick} className="px-4 py-2 bg-gray-300 rounded-lg font-semibold hover:bg-gray-400">Cancel</button>
                        <button onClick={onSaveClick} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 font-semibold hover:bg-green-600"><FaSave /> Save</button>
                    </>
                ) : (
                    <button onClick={onEditClick} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 font-semibold hover:bg-blue-600"><FaEdit /> Edit</button>
                )}
            </div>
        </div>
    );
};

export default ProfileSection;