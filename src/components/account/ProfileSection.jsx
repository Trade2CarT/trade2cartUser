import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Loader from '../Loader'; // Assuming you have a Loader component

// This component is now simple. It only displays the data it receives.
const ProfileSection = ({ user }) => {

    // If the user data hasn't arrived yet from the AccountPage, show a loader.
    if (!user) {
        return <Loader />;
    }

    // Prepare the data for display, with fallbacks for empty fields.
    const formData = {
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || user.phone || '',
        address: user.address || ''
    };

    return (
        <div className="space-y-6">
            {/* Name Field */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                    <input type="tel" name="mobile" id="mobile" value={formData.mobile} className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm" readOnly />
                </div>
            </div>

            {/* Address Field */}
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                    <textarea name="address" id="address" value={formData.address} rows="3" className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm" readOnly></textarea>
                </div>
            </div>

        </div>
    );
};

export default ProfileSection;
