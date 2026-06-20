import { useState, useEffect } from 'react';
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-hot-toast';

export const useFetchUserData = () => {
    const { userMobile } = useSettings();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userMobile) {
            setLoading(false);
            setUserData(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const usersRef = ref(db, 'users');
                const userQuery = query(usersRef, orderByChild('phone'), equalTo(userMobile));
                const snapshot = await get(userQuery);
                if (snapshot.exists()) {
                    setUserData(firebaseObjectToArray(snapshot)[0]);
                } else {
                    toast.error('User profile not found.');
                }
            } catch (err) {
                toast.error('Failed to fetch user data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userMobile]);

    return { userData, loading };
};