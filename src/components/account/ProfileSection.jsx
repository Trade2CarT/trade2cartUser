import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, update } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaSave } from 'react-icons/fa';

// This component now receives `user` and `onUpdate` as props.
const ProfileSection = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // When the component loads, or the user prop changes,
    // populate the form with the data received from the parent.
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || ''
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

        update(userRef, {
            name: formData.name,
            // email is typically not updated this way, but included for example
            // mobile: formData.mobile
        }).then(() => {
            toast.success('Profile updated successfully!');
            // Call the onUpdate callback to refresh the data on the AccountPage
            if (onUpdate) {
                onUpdate(formData);
            }
        }).catch((error) => {
            toast.error('Failed to update profile: ' + error.message);
        }).finally(() => {
            setIsSaving(false);
        });
    };

    // Don't render anything if there's no user data yet.
    if (!user) {
        return <p>Loading user data...</p>;
    }

    return (
        <form onSubmit={handleSaveChanges} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                        required
                    />
                </div>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm"
                        readOnly // Email is usually authentication-related and shouldn't be changed here
                    />
                </div>
            </div>

            <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="tel"
                        name="mobile"
                        id="mobile"
                        value={formData.mobile}
                        className="w-full pl-10 pr-4 py-2 border bg-gray-100 border-gray-300 rounded-lg shadow-sm"
                        readOnly // Mobile is often used for login, so it's read-only
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSaving}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
                <FaSave />
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
};

export default ProfileSection;