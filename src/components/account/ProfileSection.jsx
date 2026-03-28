import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { ref, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { FaUserAlt, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import { useSettings } from '../../context/SettingsContext';

const ProfileSection = ({ user }) => {
    const { userMobile } = useSettings();
    const auth = getAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // ✅ Computed directly exactly like AccountPage.jsx (No useState delay!)
    const displayPhone = user?.phoneNumber || user?.phone || user?.mobile || auth.currentUser?.phoneNumber || userMobile || '';

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setAddress(user.address || '');
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user?.id) return toast.error("User ID not found. Please log in again.");

        setIsSaving(true);
        try {
            const userRef = ref(db, `users/${user.id}`);
            await update(userRef, {
                name,
                email,
                address,
                phoneNumber: displayPhone // Saves the directly computed phone number back safely
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-5 animate-fade-in-up">

            {/* Name Input */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                <div className="relative">
                    <FaUserAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Mobile Input (Read-Only to prevent auth issues) */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Mobile Number</label>
                <div className="relative">
                    <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="tel"
                        value={displayPhone} // ✅ Uses direct derived logic now
                        disabled
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-500 cursor-not-allowed shadow-inner"
                    />
                </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="For digital bills"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Address Input */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Default Address</label>
                <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-4 text-gray-400" />
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Door No, Building, Landmark..."
                        rows={3}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 transition-all shadow-sm resize-none"
                    ></textarea>
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 pb-2">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg disabled:bg-gray-400"
                >
                    {isSaving ? (
                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <><FaSave /> Save Changes</>
                    )}
                </button>
            </div>

        </form>
    );
};

export default ProfileSection;