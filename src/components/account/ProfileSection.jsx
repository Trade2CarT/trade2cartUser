import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import Loader from './Loader'; // Assuming you have a Loader component

// This component is now self-sufficient and fetches its own data.
const ProfileSection = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: ''
    });
    const [loading, setLoading] = useState(true);
    const { userMobile } = useSettings(); // Gets the logged-in user's number from context

    useEffect(() => {
        // Don't do anything if we don't have a mobile number yet.
        if (!userMobile) {
            setLoading(false);
            return;
        }

        const fetchUserData = async () => {
            setLoading(true);
            try {
                const usersRef = ref(db, 'users');
                // Query the database for a user with the matching phone number
                const userQuery = query(usersRef, orderByChild('phone'), equalTo(userMobile));
                const snapshot = await get(userQuery);

                if (snapshot.exists()) {
                    const user = firebaseObjectToArray(snapshot)[0];
                    // Populate the form with data from the database
                    setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        mobile: user.mobile || user.phone || '',
                        address: user.address || ''
                    });
                } else {
                    console.error("ProfileSection: User not found in database.");
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userMobile]); // This effect re-runs if the userMobile changes

    if (loading) {
        return <Loader />;
    }

    if (!formData.mobile) {
        return <p className="text-center text-red-500">Could not load your profile. Please log in again.</p>;
    }

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
