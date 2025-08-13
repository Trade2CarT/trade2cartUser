import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import { db } from '../../firebase';
import { ref, update } from 'firebase/database';
import { toast } from 'react-hot-toast';
import Loader from '../Loader'; // Assuming you have a Loader component

// This component is now an editable form.
const ProfileSection = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // When the user data is passed from the parent, populate the form.
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || user.phone || '',
                address: user.address || ''
            });
        }
    }, [user]);

    // If the user data hasn't arrived yet, show a loader.
    if (!user) {
        return <Loader />;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (!formData.name || !formData.email || !formData.address) {
            return toast.error("Please fill in your name, email, and address.");
        }
        setIsSaving(true);
        try {
            const userRef = ref(db, `users/${user.id}`);
            const updates = {
                name: formData.name,
                email: formData.email,
                address: formData.address
            };
            await update(userRef, updates);
            toast.success("Profile updated successfully!");
            if (onUpdate) {
                onUpdate(updates); // Notify the parent component of the change
            }
        } catch (error) {
            toast.error("Failed to update profile.");
            console.error("Profile update error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Name Field */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

            {/* Email Field */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

            {/* Mobile Field (Read-Only) */}
            <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" name="mobile" id="mobile" value={formData.mobile} className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm" readOnly />
                </div>
            </div>

            {/* Address Field */}
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                    <textarea name="address" id="address" value={formData.address} onChange={handleInputChange} rows="3" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
                <button onClick={handleSaveChanges} disabled={isSaving} className="w-full flex justify-center items-center gap-2 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400">
                    {isSaving ? <Loader /> : <FaSave />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default ProfileSection;
