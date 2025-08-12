import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Correct path from our last fix
import { ref, update } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaSave, FaMapMarkerAlt } from 'react-icons/fa';

const ProfileSection = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: '' // ✨ NEW: Added address to the form state
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || '',
                address: user.address || '' // ✨ NEW: Populate address from user data
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSaveChanges = (e) => {
        e.preventDefault();
        if (!user || !user.id) {
            toast.error("User not found. Cannot save changes.");
            return;
        }

        setIsSaving(true);
        const userRef = ref(db, `users/${user.id}`);

        // ✨ UPDATED: Now includes mobile and address in the update
        const updates = {
            name: formData.name,
            mobile: formData.mobile,
            address: formData.address,
        };

        update(userRef, updates).then(() => {
            toast.success('Profile updated successfully!');
            if (onUpdate) {
                onUpdate(updates); // Send all updated data back to parent
            }
        }).catch((error) => {
            toast.error('Failed to update profile: ' + error.message);
        }).finally(() => {
            setIsSaving(false);
        });
    };

    if (!user) {
        return <p>Loading user data...</p>;
    }

    return (
        <form onSubmit={handleSaveChanges} className="space-y-6">
            {/* Name Field */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500" required />
                </div>
            </div>

            {/* Email Field (read-only) */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" name="email" id="email" value={formData.email} className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm" readOnly />
                </div>
            </div>

            {/* ✨ UPDATED: Mobile Field is now editable */}
            <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" name="mobile" id="mobile" value={formData.mobile} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500" />
                </div>
            </div>

            {/* ✨ NEW: Address Field */}
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                    <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows="3" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500" placeholder="Enter your full address"></textarea>
                </div>
            </div>

            <button type="submit" disabled={isSaving} className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                <FaSave />
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
};

export default ProfileSection;