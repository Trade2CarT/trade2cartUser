import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { db } from '../../firebase'; // Assuming correct path to firebase config
import { ref, get, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import Loader from '../Loader'; // Assuming you have a Loader component
import ProfileSection from './MyProfilePage'; // We will create this component next

const MyProfilePage = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const [originalUserData, setOriginalUserData] = useState(null);
    const [editableUserData, setEditableUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const userRef = ref(db, `users/${user.uid}`);
            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setOriginalUserData(data);
                    setEditableUserData(data);
                }
            }).finally(() => {
                setLoading(false);
            });
        } else {
            navigate('/login');
        }
    }, [auth, navigate]);

    const handleUpdate = () => {
        const user = auth.currentUser;
        if (user) {
            const userRef = ref(db, `users/${user.uid}`);
            update(userRef, editableUserData).then(() => {
                toast.success('Profile updated successfully!');
                setOriginalUserData(editableUserData);
                setIsEditing(false);
            }).catch(() => {
                toast.error('Failed to update profile.');
            });
        }
    };

    const handleCancel = () => {
        setEditableUserData(originalUserData);
        setIsEditing(false);
    };

    if (loading) {
        return <Loader fullscreen />;
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            <header className="sticky top-0 flex items-center p-4 bg-white shadow-md z-10">
                <button onClick={() => navigate(-1)} className="mr-4">
                    <FaArrowLeft className="text-xl" />
                </button>
                <h1 className="text-xl font-bold">My Profile</h1>
            </header>

            <main className="flex-grow p-4 overflow-y-auto">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    {/* Pass all the data and functions as props to the ProfileSection component */}
                    <ProfileSection
                        userData={editableUserData}
                        isEditing={isEditing}
                        onInputChange={(e) => setEditableUserData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                        onEditClick={() => setIsEditing(true)}
                        onSaveClick={handleUpdate}
                        onCancelClick={handleCancel}
                    />
                </div>
            </main>
        </div>
    );
};

export default MyProfilePage;