import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaLeaf, FaChevronDown } from 'react-icons/fa';
import { useSettings } from '../../context/SettingsContext';
import logo from '../../assets/images/logo.PNG';

const NAV_ITEMS = [
    { key: 'home', to: '/hello', label: 'Home', icon: FaHome },
    { key: 'orders', to: '/task', label: 'Orders', icon: FaTasks },
    { key: 'account', to: '/account', label: 'Profile', icon: FaUserAlt },
];

/**
 * AppLayout — the single responsive shell for every signed-in screen.
 *   • Desktop (lg+): fixed left sidebar navigation.
 *   • Mobile: floating bottom tab bar.
 * Pages render their own content; the layout owns the navigation chrome,
 * so behaviour stays identical across Home / Orders / Profile / Checkout.
 */
const AppLayout = ({ active, children, contentClassName = '', maxWidth = 'max-w-5xl' }) => {
    const { location } = useSettings();
    const navigate = useNavigate();

    return (
        <div className="min-h-[100dvh] bg-slate-100 text-slate-900 font-sans">
            {/* ===================== DESKTOP SIDEBAR ===================== */}
            <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-40">
                <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-100">
                    <img src={logo} alt="Trade2Cart" className="w-11 h-11 rounded-2xl border border-slate-100 shadow-sm" />
                    <div className="leading-none">
                        <p className="text-lg font-black tracking-tight text-slate-900">Trade<span className="text-accent-500">2</span>Cart</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Sell · Recycle · Earn</p>
                    </div>
                </div>

                {/* Location selector */}
                <button
                    onClick={() => navigate('/location')}
                    className="mx-4 mt-5 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                >
                    <span className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                            <FaMapMarkerAlt size={14} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Pickup City</span>
                            <span className="block text-sm font-black text-slate-900 truncate mt-1">{location || 'Select'}</span>
                        </span>
                    </span>
                    <FaChevronDown className="text-slate-300 shrink-0" size={12} />
                </button>

                {/* Nav links */}
                <nav className="flex-1 px-4 mt-6 space-y-1.5">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = active === item.key;
                        return (
                            <Link
                                key={item.key}
                                to={item.to}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-[15px] transition-all ${isActive
                                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className="text-lg" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-6 py-5 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-brand-600">
                        <FaLeaf size={13} />
                        <p className="text-[11px] font-bold text-slate-500 leading-tight">Every trade keeps the planet a little greener.</p>
                    </div>
                </div>
            </aside>

            {/* ===================== MAIN COLUMN ===================== */}
            <div className="lg:pl-64 flex flex-col min-h-[100dvh]">
                <main className={`flex-1 pb-28 lg:pb-12 ${contentClassName}`}>
                    <div className={`${maxWidth} mx-auto w-full`}>
                        {children}
                    </div>
                </main>
            </div>

            {/* ===================== MOBILE BOTTOM NAV ===================== */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-100 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = active === item.key;
                        return (
                            <Link
                                key={item.key}
                                to={item.to}
                                className={`flex flex-col items-center gap-1 py-1.5 px-5 rounded-2xl transition-all ${isActive ? 'text-brand-600' : 'text-slate-400 active:scale-95'
                                    }`}
                            >
                                <span className={`flex items-center justify-center w-11 h-8 rounded-xl transition-colors ${isActive ? 'bg-brand-50' : ''}`}>
                                    <Icon className="text-xl" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default AppLayout;
