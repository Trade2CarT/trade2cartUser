import React, { useEffect, useState } from 'react';
import { FaTasks, FaTruck, FaPhoneAlt, FaClipboardList, FaCheckCircle, FaHourglassHalf, FaCopy } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, get, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { toast } from 'react-hot-toast';
import SEO from './SEO';
import AppLayout from './layout/AppLayout';

const TaskSkeleton = () => (
  <div className="animate-pulse space-y-6 mt-2">
    <div className="h-28 bg-white border border-slate-100 rounded-3xl w-full"></div>
    <div className="h-48 bg-white border border-slate-100 rounded-3xl w-full"></div>
  </div>
);

const TaskPage = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [vendorDetails, setVendorDetails] = useState(null);
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
              } catch {
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
    <AppLayout active="orders" maxWidth="max-w-3xl" contentClassName="nice-scrollbar">
      <SEO title="Track Order - Trade2Cart" description="Real-time status of your scrap pickup." />

      <div className="px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-accent-100 text-accent-600 flex justify-center items-center rounded-2xl shadow-sm">
            <FaTruck size={18} />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none">Live Tracking</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">Follow your pickup in real time</p>
          </div>
        </div>

        {loading ? (
          <TaskSkeleton />
        ) : statusIndex === -1 ? (
          <div className="text-center mt-2 p-10 t2c-card">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
              <FaTasks className="text-4xl text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">No Active Orders</h2>
            <p className="text-slate-500 text-sm font-medium mb-8 max-w-sm mx-auto">Schedule a pickup and your live progress will appear right here.</p>
            <Link to="/hello" className="bg-brand-600 text-white font-black py-4 px-8 rounded-2xl hover:bg-brand-700 transition-all shadow-md shadow-brand-600/25 active:scale-95 inline-block">
              Schedule New Pickup
            </Link>
          </div>
        ) : (
          <div className='space-y-5'>
            {/* Progress Bar */}
            <div className="w-full t2c-card p-6">
              <div className="flex justify-between items-start relative">
                <div className="absolute top-6 left-[12%] right-[12%] h-1.5 bg-slate-100 rounded-full z-0"></div>
                <div className="absolute top-6 left-[12%] h-1.5 bg-brand-500 rounded-full z-0 transition-all duration-700" style={{ width: `${(statusIndex / (statusSteps.length - 1)) * 76}%` }}></div>

                {statusSteps.map((step, index) => (
                  <div key={step.title} className="flex flex-col items-center z-10 relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 border-white shadow-sm ${index <= statusIndex ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <step.icon className={index === statusIndex ? 'animate-bounce' : ''} size={18} />
                    </div>
                    <p className={`mt-3 text-[10px] sm:text-xs text-center font-black uppercase tracking-wider ${index <= statusIndex ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {status.toLowerCase() === 'pending' && (
              <div className="p-8 t2c-card text-center">
                <div className="w-20 h-20 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-100 animate-pulse">
                  <FaHourglassHalf className="text-3xl text-accent-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Assigning your agent…</h3>
                <p className="text-slate-500 mt-2 text-sm font-medium max-w-sm mx-auto">We're matching you with the nearest verified collection agent. Hang tight!</p>
              </div>
            )}

            {status.toLowerCase() === 'on-schedule' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {vendorDetails ? (
                  <div className="p-6 t2c-card flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-500"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 mt-2">Assigned Agent</p>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(vendorDetails.name || 'Agent')}&background=41ab66&color=fff&size=80`}
                      alt="Agent"
                      className="w-20 h-20 rounded-full shadow-sm mb-4 border-4 border-brand-50"
                    />
                    <p className="text-lg font-black text-slate-900 mb-1">{vendorDetails.name}</p>
                    <a href={`tel:${vendorDetails.phone}`} className="mt-4 w-full bg-slate-900 text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition active:scale-[0.98] shadow-md">
                      <FaPhoneAlt size={14} /> Call Agent
                    </a>
                  </div>
                ) : <div className="p-6 t2c-card text-center text-slate-500 flex items-center justify-center">Fetching agent info…</div>}

                {otp ? (
                  <div className="p-6 bg-slate-900 rounded-3xl shadow-lg text-center flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(65,171,102,0.20)_0%,rgba(0,0,0,0)_70%)] animate-pulse pointer-events-none"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Secure Pickup Code</p>
                    <div onClick={handleCopyOtp} className="relative z-10 cursor-pointer group mt-2">
                      <p className="text-5xl font-black tracking-[0.2em] text-white py-3 drop-shadow-md group-hover:scale-[1.02] transition-transform">{otp}</p>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-brand-300 bg-brand-900/40 py-1.5 px-4 rounded-full group-hover:bg-brand-800/60 transition uppercase tracking-wider border border-brand-800">
                        <FaCopy size={10} /> Tap to Copy
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-5 relative z-10 font-medium">Share this ONLY when the agent arrives.</p>
                  </div>
                ) : <div className="p-6 t2c-card text-center text-slate-500 flex items-center justify-center">Generating OTP…</div>}
              </div>
            )}

            {status.toLowerCase() === 'completed' && (
              <div className="p-8 bg-brand-50 rounded-3xl shadow-sm text-center border border-brand-200 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-500"></div>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-brand-100">
                  <FaCheckCircle className="text-4xl text-brand-500" />
                </div>
                <h3 className="text-2xl font-black text-brand-900 tracking-tight">Trade Completed!</h3>
                <p className="text-brand-700 mt-2 text-sm font-medium">Thank you for making the planet a little greener. 🌱</p>
                <Link to="/account" className="mt-6 inline-block bg-white text-brand-700 font-black py-3 px-7 rounded-xl border border-brand-200 hover:bg-brand-100 transition active:scale-95">
                  View Receipt
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TaskPage;
