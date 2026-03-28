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

const TaskSkeleton = () => (
  <div className="animate-pulse space-y-8 mt-4">
    <div className="flex justify-between items-center px-4">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1 h-2 mx-4 bg-gray-200"></div>
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1 h-2 mx-4 bg-gray-200"></div>
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-40 bg-white border border-gray-100 rounded-3xl w-full shadow-sm"></div>
  </div>
);

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
                toast.error("Failed to fetch assignment details.");
              }
            }
          } else {
            setStatus('');
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
      <SEO title="Track Order - Trade2Cart" description="Real-time status of your scrap pickup." />

      {/* ✅ FIX: Strict flexbox layout (h-[100dvh]) ensures footer NEVER overlaps content */}
      <div className="h-[100dvh] bg-gray-50 flex flex-col font-sans overflow-hidden">

        {/* HEADER: Flex-none */}
        <header className="flex-none p-4 bg-white shadow-sm z-30 flex justify-between items-center rounded-b-3xl relative">
          <div className="flex items-center gap-3">
            <img src={assetlogo} alt="Trade2Cart Logo" className="h-10 w-10 rounded-full border border-gray-100 shadow-sm" />
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <FaMapMarkerAlt className="text-blue-500" size={12} />
              <span className="text-sm font-bold text-gray-700">{location || '...'}</span>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT: Flex-1 and overflow-y-auto (ONLY this scrolls) */}
        <main className="flex-1 overflow-y-auto p-5 pb-10">
          <div className="max-w-3xl mx-auto">

            <div className="flex items-center gap-3 mb-8 mt-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 flex justify-center items-center rounded-full shadow-sm">
                <FaTruck size={18} />
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Live Tracking</h1>
            </div>

            {loading ? (
              <TaskSkeleton />
            ) : statusIndex === -1 ? (
              <div className="text-center mt-6 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100">
                  <FaTasks className="text-4xl text-gray-300" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-1">No Active Orders</h2>
                <p className="text-gray-500 text-sm font-medium mb-8">Schedule a pickup and your progress will appear right here.</p>
                <Link to="/hello" className="bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-blue-700 transition-all shadow-md active:scale-95 block w-full">
                  Schedule New Pickup
                </Link>
              </div>
            ) : (
              <div className='space-y-6'>
                {/* Progress Bar Container */}
                <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center relative">
                    <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 -translate-y-1/2 z-0 rounded-full"></div>

                    {statusSteps.map((step, index) => (
                      <div key={step.title} className="flex flex-col items-center z-10 relative bg-white px-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 shadow-sm border-4 border-white ${index <= statusIndex ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <step.icon className={index === statusIndex ? 'animate-bounce' : ''} size={18} />
                        </div>
                        <p className={`mt-3 text-[10px] sm:text-xs text-center font-black uppercase tracking-wider ${index <= statusIndex ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {status.toLowerCase() === 'pending' && (
                  <div className="p-8 bg-white rounded-3xl shadow-sm text-center border border-gray-100">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 animate-pulse">
                      <FaHourglassHalf className="text-3xl text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Assigning Agent...</h3>
                    <p className="text-gray-500 mt-2 text-sm font-medium">We are matching you with the nearest collection agent. Hang tight!</p>
                  </div>
                )}

                {status.toLowerCase() === 'on-schedule' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {vendorDetails ? (
                      <div className="p-6 bg-white rounded-3xl shadow-sm flex flex-col items-center border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1.5 bg-blue-500"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 mt-2">Assigned Agent</p>
                        <img
                          src={`https://ui-avatars.com/api/?name=${vendorDetails.name}&background=3b82f6&color=fff&size=80`}
                          alt="Agent"
                          className="w-20 h-20 rounded-full shadow-sm mb-4 border-4 border-blue-50"
                        />
                        <p className="text-lg font-black text-gray-900 mb-1">{vendorDetails.name}</p>
                        <a href={`tel:${vendorDetails.phone}`} className="mt-4 w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition active:scale-[0.98] shadow-md">
                          <FaPhoneAlt size={14} /> Call Agent
                        </a>
                      </div>
                    ) : <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center text-gray-500">Fetching agent info...</div>}

                    {otp ? (
                      <div className="p-6 bg-gray-900 rounded-3xl shadow-lg text-center flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,rgba(0,0,0,0)_70%)] animate-pulse pointer-events-none"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 relative z-10">Secure OTP Code</p>

                        <div onClick={handleCopyOtp} className="relative z-10 cursor-pointer group mt-3">
                          <p className="text-5xl font-black tracking-[0.2em] text-white py-4 drop-shadow-md group-hover:scale-[1.02] transition-transform">
                            {otp}
                          </p>
                          <p className="text-[10px] font-bold text-blue-300 bg-blue-900/40 py-1.5 px-4 rounded-full inline-block group-hover:bg-blue-800/60 transition uppercase tracking-wider border border-blue-800">
                            Tap to Copy
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-6 relative z-10 font-medium">Share this ONLY when agent arrives.</p>
                      </div>
                    ) : <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center text-gray-500">Generating OTP...</div>}
                  </div>
                )}

                {status.toLowerCase() === 'completed' && (
                  <div className="p-8 bg-green-50 rounded-3xl shadow-sm text-center border border-green-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500"></div>
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-green-100">
                      <FaCheckCircle className="text-4xl text-green-500" />
                    </div>
                    <h3 className="text-2xl font-black text-green-900 tracking-tight">Trade Completed!</h3>
                    <p className="text-green-700 mt-2 text-sm font-medium">Thank you for making the planet greener.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ✅ FIX: FOOTER (Flex-none guarantees it never floats over content) */}
        <footer className="flex-none w-full flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          <Link to="/hello" className="flex flex-col items-center text-gray-400 p-2 hover:text-blue-600 transition-colors"><FaHome className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-blue-600 p-2"><FaTasks className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Orders</span></Link>
          <Link to="/account" className="flex flex-col items-center text-gray-400 p-2 hover:text-blue-600 transition-colors"><FaUserAlt className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Profile</span></Link>
        </footer>

      </div>
    </>
  );
};

export default TaskPage;