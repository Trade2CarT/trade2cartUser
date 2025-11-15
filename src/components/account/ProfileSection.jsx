import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Loader from '../Loader';

const ProfileSection = ({ user }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: ''
    });

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

    if (!user) {
        return <Loader />;
    }

    return (
        <div className="space-y-6">
            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        readOnly
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        readOnly
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Mobile */}
            <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="tel"
                        name="mobile"
                        id="mobile"
                        value={formData.mobile}
                        readOnly
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Address */}
            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                        name="address"
                        id="address"
                        value={formData.address}
                        readOnly
                        rows="3"
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg shadow-sm cursor-not-allowed"
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;
