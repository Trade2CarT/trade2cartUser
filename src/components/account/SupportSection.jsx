import React, { useState } from 'react';
import { db } from '../../firebase';
import { ref, push } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { FaPaperPlane, FaHeadset } from 'react-icons/fa';

// Lets a customer raise a concern. Writes to the shared `queries` node (same
// one the vendor app uses) and fire-and-forget emails the admin so nothing is
// missed. `user` carries the current customer's identity for the ticket.
const SupportSection = ({ user, onDone }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const text = message.trim();
    if (text.length < 5) return toast.error('Please describe your concern.');

    setSubmitting(true);
    const name = user?.name || '';
    const phone = user?.phoneNumber || '';
    try {
      await push(ref(db, 'queries'), {
        role: 'user',
        name,
        phone,
        uid: user?.id || null,
        message: text,
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      // 🚨 Email the admin that a concern was raised (fire-and-forget).
      fetch('https://trade2cart.trade.admin.trade2cart.in/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'concern',
          role: 'user',
          customerName: name,
          customerPhone: phone,
          message: text,
        }),
      }).catch(() => console.log('Concern email triggered in background.'));

      toast.success("Sent! We'll get back to you within 24 hours.");
      setMessage('');
      onDone?.();
    } catch {
      toast.error('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center flex-shrink-0">
          <FaHeadset />
        </div>
        <p className="text-sm font-bold text-slate-600">
          Facing an issue with a pickup or payment? Tell us and our team will reach out.
        </p>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your concern…"
        rows={5}
        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-medium text-slate-800 focus:border-brand-500 focus:ring-0 outline-none resize-none transition-colors"
      />

      <button
        onClick={handleSubmit}
        disabled={submitting || message.trim().length < 5}
        className="w-full flex items-center justify-center gap-2 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 active:scale-[0.98] transition-all disabled:bg-slate-300"
      >
        <FaPaperPlane size={14} /> {submitting ? 'Sending…' : 'Submit Concern'}
      </button>

      <p className="text-xs text-slate-400 font-medium text-center">
        You can also email us at{' '}
        <a href="mailto:trade@trade2cart.in" className="text-brand-600 font-bold">trade@trade2cart.in</a>.
      </p>
    </div>
  );
};

export default SupportSection;
