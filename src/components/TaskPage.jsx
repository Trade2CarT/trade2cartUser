import React, { useEffect, useState } from 'react';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaTruck, FaPhoneAlt, FaClipboardList, FaCheckCircle, FaHourglassHalf } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, get, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import assetlogo from '../assets/images/logo.PNG';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-hot-toast';
import SEO from './SEO';
import Loader from './Loader';

const TaskPage = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [vendorDetails, setVendorDetails] = useState(null);
  const { location } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    setLoading(true);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);

        const unsubscribeDb = onValue(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const currentStatus = userData.Status || 'Active';
            setStatus(currentStatus);

            if (currentStatus.toLowerCase() !== 'on-schedule') {
              setVendorDetails(null);
              setOtp('');
            }

            if (currentStatus.toLowerCase() === 'on-schedule' && userData.currentAssignmentId) {
              try {
                const assignmentRef = ref(db, `assignments/${userData.currentAssignmentId}`);
                const assignmentSnapshot = await get(assignmentRef);
                if (assignmentSnapshot.exists()) {
                  const activeAssignment = assignmentSnapshot.val();
                  setVendorDetails({ name: activeAssignment.vendorName, phone: activeAssignment.vendorPhone });
                  setOtp(userData.otp || '');
                }
              } catch (error) {
                console.error("Error fetching assignment details:", error);
                toast.error("Failed to fetch assignment details.");
              }
            }
          } else {
            setStatus('');
            toast.error("Could not find your user profile.");
          }
          setLoading(false);
        });

        return unsubscribeDb;
      } else {
        setStatus('');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, navigate]);

  const handleCopyOtp = () => {
    if (otp) {
      navigator.clipboard.writeText(otp);
      toast.success("OTP Copied to clipboard!");
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const statusSteps = [
    { title: 'Ordered', icon: FaClipboardList },
    { title: 'On-Schedule', icon: FaTruck },
    { title: 'Completed', icon: FaCheckCircle }
  ];

  const getStatusIndex = () => {
    const lowerCaseStatus = status.toLowerCase();
    if (lowerCaseStatus === 'pending') return 0;
    if (lowerCaseStatus === 'on-schedule') return 1;
    if (lowerCaseStatus === 'completed') return 2;
    return -1;
  };

  const statusIndex = getStatusIndex();

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
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
              <FaTruck className="text-green-600" />
              Your Trade Status
            </h1>

            {loading ? (
              <Loader />
            ) : statusIndex === -1 ? (
              <div className="text-center mt-10 bg-white p-8 rounded-xl shadow-md">
                <FaTasks className="text-5xl text-gray-300 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold text-gray-700">No Active Tasks</h2>
                <p className="text-gray-500 mt-2 mb-6">Schedule a pickup and your progress will appear here.</p>
                <Link to="/hello" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors">
                  Schedule Pickup
                </Link>
              </div>
            ) : (
              <div className='space-y-8'>
                <div className="w-full">
                  <div className="flex justify-between items-center">
                    {statusSteps.map((step, index) => (
                      <React.Fragment key={step.title}>
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${index <= statusIndex ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>
                            <step.icon className={index === statusIndex ? 'animate-pulse' : ''} />
                          </div>
                          <p className={`mt-2 text-xs md:text-sm text-center font-semibold ${index <= statusIndex ? 'text-gray-800' : 'text-gray-500'}`}>{step.title}</p>
                        </div>
                        {index < statusSteps.length - 1 && <div className={`flex-1 h-1 transition-all duration-500 -mx-2 ${index < statusIndex ? 'bg-green-600' : 'bg-gray-200'}`}></div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {status.toLowerCase() === 'pending' && (
                  <div className="p-6 bg-white rounded-xl shadow-md text-center">
                    <FaHourglassHalf className="text-4xl text-blue-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-gray-800">Your Order is Pending</h3>
                    <p className="text-gray-500 mt-1">We are currently assigning a collection agent for your pickup. Thank you for your patience!</p>
                  </div>
                )}

                {status.toLowerCase() === 'on-schedule' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vendorDetails ? (
                      <div className="p-5 bg-white rounded-xl shadow-md flex flex-col items-center border border-gray-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Assigned Agent</p>
                        <img
                          src={`https://ui-avatars.com/api/?name=${vendorDetails.name}&background=16a34a&color=fff&size=64`}
                          alt="Agent"
                          className="w-16 h-16 rounded-full shadow-sm mb-2 border-2 border-green-100"
                        />
                        <p className="text-xl font-bold text-gray-800">{vendorDetails.name}</p>
                        <a href={`tel:${vendorDetails.phone}`} className="mt-3 bg-blue-50 text-blue-600 font-bold py-2 px-6 rounded-full inline-flex items-center gap-2 hover:bg-blue-100 transition">
                          <FaPhoneAlt size={14} /> Call Agent
                        </a>
                      </div>
                    ) : <p className="text-center text-gray-500">Fetching agent details...</p>}

                    {otp ? (
                      <div className="p-5 bg-white rounded-xl shadow-md text-center border border-gray-100 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-green-50 opacity-50 animate-pulse"></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 relative z-10">Your Secure OTP</p>

                        <div
                          onClick={handleCopyOtp}
                          className="relative z-10 cursor-pointer group"
                        >
                          <p className="text-4xl md:text-5xl font-extrabold tracking-[0.2em] text-green-700 py-4 drop-shadow-sm group-hover:scale-105 transition-transform">
                            {otp}
                          </p>
                          <p className="text-xs font-semibold text-blue-500 bg-blue-50 py-1 px-3 rounded-full inline-block group-hover:bg-blue-100">
                            Tap to Copy
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 relative z-10">Share this only upon arrival.</p>
                      </div>
                    ) : <p className="text-center text-gray-500">Generating OTP...</p>}
                  </div>
                )}

                {status.toLowerCase() === 'completed' && (
                  <div className="p-6 bg-white rounded-xl shadow-md text-center">
                    <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-gray-800">This trade has been completed!</h3>
                    <p className="text-gray-500 mt-1">Thank you for contributing to a greener planet. Check your account for details.</p>
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