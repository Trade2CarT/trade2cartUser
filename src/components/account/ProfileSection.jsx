import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { ref, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { FaUserAlt, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import { useSettings } from '../../context/SettingsContext';

const STR = {
    English: {
        noUserId: "User ID not found. Please log in again.",
        updated: "Profile updated successfully!",
        updateFailed: "Failed to update profile. Please try again.",
        fullName: "Full Name",
        namePh: "Enter your name",
        mobileNumber: "Mobile Number",
        emailAddress: "Email Address",
        emailPh: "For digital bills",
        defaultAddress: "Default Address",
        addressPh: "Door No, Building, Landmark...",
        saveChanges: "Save Changes"
    },
    Tamil: {
        noUserId: "பயனர் ஐடி கிடைக்கவில்லை. மீண்டும் உள்நுழையவும்.",
        updated: "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!",
        updateFailed: "சுயவிவரத்தைப் புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
        fullName: "முழு பெயர்",
        namePh: "உங்கள் பெயரை உள்ளிடவும்",
        mobileNumber: "மொபைல் எண்",
        emailAddress: "மின்னஞ்சல் முகவரி",
        emailPh: "டிஜிட்டல் பில்களுக்காக",
        defaultAddress: "இயல்பு முகவரி",
        addressPh: "கதவு எண், கட்டிடம், அடையாள இடம்...",
        saveChanges: "மாற்றங்களைச் சேமிக்கவும்"
    }
};

const ProfileSection = ({ user }) => {
    const { userMobile, language } = useSettings();
    const t = STR.English; // UI pinned to English — only item names follow the language toggle
    const auth = getAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
        if (!user?.id) return toast.error(t.noUserId);

        setIsSaving(true);
        try {
            const userRef = ref(db, `users/${user.id}`);
            await update(userRef, {
                name,
                email,
                address,
                phoneNumber: displayPhone
            });
            toast.success(t.updated);
        } catch {
            toast.error(t.updateFailed);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        // ✅ FIX: Added pb-12 here to allow scrolling past the safe-area
        <form onSubmit={handleSave} className="space-y-5 animate-fade-in-up pb-12">

            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{t.fullName}</label>
                <div className="relative">
                    <FaUserAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.namePh}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-800 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{t.mobileNumber}</label>
                <div className="relative">
                    <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="tel"
                        value={displayPhone}
                        disabled
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-500 cursor-not-allowed shadow-inner"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{t.emailAddress}</label>
                <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPh}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-800 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{t.defaultAddress}</label>
                <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-4 text-gray-400" />
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t.addressPh}
                        rows={3}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-800 transition-all shadow-sm resize-none"
                    ></textarea>
                </div>
            </div>

            {/* ✅ FIX: Extra top padding ensures separation from text box */}
            <div className="pt-6">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-brand-700 active:scale-95 transition-all shadow-lg disabled:bg-gray-400"
                >
                    {isSaving ? (
                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <><FaSave /> {t.saveChanges}</>
                    )}
                </button>
            </div>

        </form>
    );
};

export default ProfileSection;