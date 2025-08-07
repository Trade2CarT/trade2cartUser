import React, { useEffect, useState } from 'react';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaBell, FaShoppingCart, FaTruck, FaPhoneAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
// Import 'onValue' to listen for real-time updates
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get, update, onValue } from 'firebase/database';
import assetlogo from '../assets/images/logo.PNG';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-hot-toast';

const TaskPage = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [vendorDetails, setVendorDetails] = useState(null);
  const { userMobile, location } = useSettings();

  // This useEffect will now listen for real-time changes
  useEffect(() => {
    if (!userMobile) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create a query to find the user's data
    const userQuery = query(ref(db, 'users'), orderByChild('phone'), equalTo(userMobile));

    // --- Using onValue() for real-time listening instead of get() ---
    const unsubscribe = onValue(userQuery, async (snapshot) => {
      setVendorDetails(null); // Reset vendor details on each status update

      if (snapshot.exists()) {
        const user = firebaseObjectToArray(snapshot)[0];
        const currentStatus = user.Status || 'Pending';
        setStatus(currentStatus);

        // If the status changes to 'on-schedule', fetch the related assignment details
        if (currentStatus.toLowerCase() === 'on-schedule') {
          try {
            const assignmentsRef = ref(db, 'assignments');
            const assignmentQuery = query(assignmentsRef, orderByChild('mobile'), equalTo(userMobile));
            const assignmentSnapshot = await get(assignmentQuery); // This can remain a get()

            if (assignmentSnapshot.exists()) {
              const assignments = firebaseObjectToArray(assignmentSnapshot);
              const activeAssignment = assignments.find(a => a.status === 'assigned');
              if (activeAssignment) {
                setVendorDetails({ name: activeAssignment.vendorName, phone: activeAssignment.vendorPhone });
              }
            }

            let newOtp = user.otp;
            if (!newOtp || newOtp.length !== 4) {
              newOtp = Math.floor(1000 + Math.random() * 9000).toString();
              const userRefToUpdate = ref(db, `users/${user.id}`);
              await update(userRefToUpdate, { otp: newOtp });
            }
            setOtp(newOtp);

          } catch (error) {
            toast.error("Failed to fetch assignment details.");
          }
        }
      } else {
        setStatus(''); // No user found
      }
      setLoading(false); // Stop loading indicator once we have data
    },
      (error) => {
        // This function handles any errors with the listener itself
        toast.error("Failed to sync task status.");
        setLoading(false);
      });

    // --- Cleanup function ---
    // This is crucial. When the user navigates away from this page,
    // we need to "unsubscribe" from the listener to prevent memory leaks.
    return () => {
      unsubscribe();
    };
  }, [userMobile]);

  const statusSteps = [{ title: 'Ordered' }, { title: 'On-Schedule' }, { title: 'Completed' }];

  const getStatusIndex = () => {
    const lowerCaseStatus = status.toLowerCase();
    if (lowerCaseStatus === 'pending') return 0;
    if (lowerCaseStatus === 'on-schedule') return 1;
    if (lowerCaseStatus === 'completed') return 2;
    return -1;
  };

  const statusIndex = getStatusIndex();

  return (
    <div className="h-screen bg-[#f8f8f8] flex flex-col">
      <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
        <div className="flex items-center gap-3"><img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" /><div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"><FaMapMarkerAlt className="text-green-500" /><span className="text-sm font-medium">{location}</span></div></div>
        <div className="flex items-center gap-4"><FaBell className="cursor-pointer text-gray-600" /><div className="relative cursor-pointer"><FaShoppingCart className="text-gray-600" /></div></div>
      </header>
      <main className="flex-grow p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">🚚 Your Trade Status</h2>
        {loading ? (<p className="text-center">Loading status...</p>) : !userMobile ? (<p className="text-center text-red-500">Please log in to see your task status.</p>) : statusIndex === -1 ? (
          <div className="text-center mt-10"><FaTasks className="text-5xl text-gray-400 mb-4 mx-auto" /><h2 className="text-xl font-bold text-gray-700">No Active Tasks</h2><p className="text-gray-500 mt-2">Your scheduled pickups will appear here.</p></div>
        ) : (
          <>
            <div className="flex justify-between items-start relative bg-white p-5 rounded-xl shadow-md">
              {statusSteps.map((step, index) => (
                <div key={index} className={`text-center w-1/3 order-tracking ${index <= statusIndex ? 'completed' : ''}`}>
                  <span className="is-complete"></span><p className={`${index <= statusIndex ? 'text-black font-semibold' : 'text-gray-500'}`}>{step.title}</p>
                </div>
              ))}
            </div>
            {status.toLowerCase() === 'on-schedule' && (
              <div className="mt-5 space-y-4">
                {vendorDetails && (
                  <div className="p-4 bg-white rounded-lg shadow text-center border-t-4 border-yellow-500">
                    <p className="text-sm text-gray-600">Your pickup has been assigned to:</p>
                    <div className="flex items-center justify-center gap-3 mt-2"><FaTruck className="text-yellow-600" /><p className="text-lg font-bold text-gray-800">{vendorDetails.name}</p></div>
                    <a href={`tel:${vendorDetails.phone}`} className="text-blue-600 inline-flex items-center gap-2 mt-1"><FaPhoneAlt size={12} /> {vendorDetails.phone}</a>
                  </div>
                )}
                {otp && (
                  <div className="p-4 bg-white rounded-lg shadow text-center border-t-4 border-green-500">
                    <p className="text-sm text-gray-600">Show this OTP to the collection agent:</p><p className="text-2xl font-bold tracking-widest text-green-700 mt-1">{otp}</p>
                  </div>
                )}
              </div>
            )}
            {status.toLowerCase() === 'completed' && (
              <div className="mt-5 p-4 bg-white rounded-lg shadow text-center border-t-4 border-blue-500">
                <p className="text-lg font-semibold text-blue-700">✅ This trade has been completed!</p><p className="text-sm text-gray-600 mt-1">Check your account history for details.</p>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="sticky bottom-0 flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-inner flex-shrink-0 z-30">
        <Link to="/hello" className="flex flex-col items-center text-gray-500 no-underline"><FaHome /><span className="text-xs">Home</span></Link>
        <Link to="/task" className="flex flex-col items-center text-green-600 no-underline"><FaTasks /><span className="text-xs">Tasks</span></Link>
        <Link to="/account" className="flex flex-col items-center text-gray-500 no-underline"><FaUserAlt /><span className="text-xs">Account</span></Link>
      </footer>
    </div>
  );
};

export default TaskPage;