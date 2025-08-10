import React, { useEffect, useState, useRef } from 'react';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaBell, FaShoppingCart, FaTruck, FaPhoneAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { ref, query, orderByChild, equalTo, get, onValue } from 'firebase/database';
import assetlogo from '../assets/images/logo.PNG';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-hot-toast';
import SEO from './SEO';

const firebaseObjectToArray = (snapshot) => {
  const data = snapshot.val();
  return data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
};

const TaskPage = () => {
  // --- YOUR BUSINESS LOGIC (UNCHANGED) ---
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [vendorDetails, setVendorDetails] = useState(null);
  const { userMobile, location } = useSettings();
  const otpGeneratedForAssignment = useRef(null);

  useEffect(() => {
    if (!userMobile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const userQuery = query(ref(db, 'users'), orderByChild('phone'), equalTo(userMobile));

    const unsubscribe = onValue(userQuery, async (snapshot) => {
      if (snapshot.exists()) {
        const user = firebaseObjectToArray(snapshot)[0];
        const currentStatus = user.Status || 'Pending';
        setStatus(currentStatus);

        if (currentStatus.toLowerCase() !== 'on-schedule') {
          setVendorDetails(null);
          setOtp('');
          otpGeneratedForAssignment.current = null;
        }

        if (currentStatus.toLowerCase() === 'on-schedule' && user.currentAssignmentId) {
          try {
            const assignmentRef = ref(db, `assignments/${user.currentAssignmentId}`);
            const assignmentSnapshot = await get(assignmentRef);

            if (assignmentSnapshot.exists()) {
              const activeAssignment = assignmentSnapshot.val();
              setVendorDetails({ name: activeAssignment.vendorName, phone: activeAssignment.vendorPhone });
            }

            if (user.otp) {
              setOtp(user.otp);
            }

          } catch (error) {
            console.error("Error fetching assignment details:", error);
            toast.error("Failed to fetch assignment details.");
          }
        }
      } else {
        setStatus('');
      }
      setLoading(false);
    }, (error) => {
      console.error("Task Page sync error:", error);
      toast.error("Failed to sync task status.");
      setLoading(false);
    });

    return () => unsubscribe();
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

  // --- RESPONSIVE & SEO STRUCTURE ---
  return (
    <>
      <SEO
        title="Your Trade Status - Trade2Cart"
        description="Track the real-time status of your scrap pickup, from ordered to completed."
      />
      <div className="h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" />
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
              <FaMapMarkerAlt className="text-green-500" />
              <span className="text-sm font-medium">{location || '...'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xl">
            <FaBell className="cursor-pointer text-gray-600" />
            <FaShoppingCart className="cursor-pointer text-gray-600" />
          </div>
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">🚚 Your Trade Status</h1>
            {loading ? (
              <p className="text-center text-gray-500 mt-10">Loading status...</p>
            ) : statusIndex === -1 ? (
              <div className="text-center mt-10 bg-white p-8 rounded-xl shadow-md">
                <FaTasks className="text-5xl text-gray-400 mb-4 mx-auto" />
                <h2 className="text-xl font-bold text-gray-700">No Active Tasks</h2>
                <p className="text-gray-500 mt-2">Your scheduled pickups will appear here once confirmed.</p>
              </div>
            ) : (
              <div className='space-y-6'>
                <div className="relative pt-4">
                  <div className="flex mb-2 items-center justify-between">
                    {statusSteps.map((step, index) => (
                      <div className="text-center w-1/3" key={step.title}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-lg ${index <= statusIndex ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                          {index < statusIndex ? '✓' : index + 1}
                        </div>
                        <div className={`mt-2 text-xs text-center font-semibold ${index <= statusIndex ? 'text-gray-800' : 'text-gray-500'}`}>{step.title}</div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-[30px] left-0 w-full h-1 bg-gray-300">
                    <div className="h-1 bg-green-500" style={{ width: `${(statusIndex / (statusSteps.length - 1)) * 100}%` }}></div>
                  </div>
                </div>

                {status.toLowerCase() === 'on-schedule' && (
                  <div className="space-y-4">
                    {vendorDetails ? (
                      <div className="p-4 bg-white rounded-lg shadow-md text-center border-t-4 border-yellow-500">
                        <p className="text-sm text-gray-600">Your pickup is assigned to:</p>
                        <div className="flex items-center justify-center gap-3 mt-2">
                          <FaTruck className="text-yellow-600" />
                          <p className="text-lg font-bold text-gray-800">{vendorDetails.name}</p>
                        </div>
                        <a href={`tel:${vendorDetails.phone}`} className="text-blue-600 inline-flex items-center gap-2 mt-1 hover:underline">
                          <FaPhoneAlt size={12} /> {vendorDetails.phone}
                        </a>
                      </div>
                    ) : <p className="text-center text-gray-500">Fetching vendor details...</p>}

                    {otp ? (
                      <div className="p-4 bg-white rounded-lg shadow-md text-center border-t-4 border-green-500">
                        <p className="text-sm text-gray-600">Show this OTP to the collection agent:</p>
                        <p className="text-3xl font-bold tracking-[0.2em] text-green-700 mt-2 p-2 bg-green-50 rounded-md">{otp}</p>
                      </div>
                    ) : <p className="text-center text-gray-500">Generating OTP...</p>}
                  </div>
                )}
                {status.toLowerCase() === 'completed' && (
                  <div className="mt-5 p-4 bg-white rounded-lg shadow-md text-center border-t-4 border-blue-500">
                    <p className="text-lg font-semibold text-blue-700">✅ This trade has been completed!</p>
                    <p className="text-sm text-gray-600 mt-1">Check your account history for details.</p>
                  </div>
                )}
                {status.toLowerCase() === 'pending' && (
                  <div className="mt-5 p-4 bg-white rounded-lg shadow-md text-center border-t-4 border-gray-400">
                    <p className="text-lg font-semibold text-gray-700">⏳ Your order is pending</p>
                    <p className="text-sm text-gray-600 mt-1">We are assigning a vendor for your pickup.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <footer className="sticky bottom-0 flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex-shrink-0 z-30">
          <Link to="/hello" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaHome className="text-2xl" /><span className="text-xs font-medium">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-green-600 p-2 no-underline"><FaTasks className="text-2xl" /><span className="text-xs font-medium">Tasks</span></Link>
          <Link to="/account" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaUserAlt className="text-2xl" /><span className="text-xs font-medium">Account</span></Link>
        </footer>
      </div>
    </>
  );
};

export default TaskPage;