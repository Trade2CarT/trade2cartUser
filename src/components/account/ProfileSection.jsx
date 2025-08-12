import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

// This component now only displays user data.
// No database or update logic is needed.
const ProfileSection = ({ user }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: ''
    });

    // When the component loads, populate the fields with the user data.
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || '',
                address: user.address || ''
            });
        }
    }, [user]);

    if (!user) {
        return <p>Loading user data...</p>;
    }

    return (
        // ✨ UPDATED: The <form> tag is changed to a <div> as we are no longer submitting data.
        <div className="space-y-6">
            {/* Name Field */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    {/* ✨ UPDATED: Added readOnly and a gray background style */}
                    <input type="text" name="name" id="name" value={formData.name} className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm" readOnly />
                </div>
            </div>

            {/* Email Field */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" name="email" id="email" value={formData.email} className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm" readOnly />
                </div>
            </div>

            {/* Mobile Field */}
            <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    {/* ✨ UPDATED: Added readOnly and a gray background style */}
                    <input type="tel" name="mobile" id="mobile" value={formData.mobile} className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm" readOnly />
                </div>
            </div>

            {/* Address Field */}
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                    {/* ✨ UPDATED: Added readOnly and a gray background style */}
                    <textarea name="address" id="address" value={formData.address} rows="3" className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm" readOnly></textarea>
                </div>
            </div>

            {/* ✨ REMOVED: The "Save Changes" button is no longer here. */}
        </div>
    );
};

export default ProfileSection;