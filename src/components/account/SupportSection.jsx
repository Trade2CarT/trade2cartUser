import React, { useState } from 'react';
import { db } from '../../firebase';
import { ref, push } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { FaPaperPlane, FaHeadset } from 'react-icons/fa';
import { useSettings } from '../../context/SettingsContext';

const STR = {
  English: {
    describeError: "Please describe your concern.",
    intro: "Facing an issue with a pickup or payment? Tell us and our team will reach out.",
    placeholder: "Describe your concern…",
    sent: "Sent! We'll get back to you within 24 hours.",
    submitFailed: "Could not submit. Please try again.",
    sending: "Sending…",
    submit: "Submit Concern",
    emailUs: "You can also email us at"
  },
  Tamil: {
    describeError: "உங்கள் புகாரை விவரிக்கவும்.",
    intro: "பிக்-அப் அல்லது பணம் தொடர்பான சிக்கலா? எங்களிடம் கூறுங்கள், எங்கள் குழு உங்களைத் தொடர்பு கொள்ளும்.",
    placeholder: "உங்கள் புகாரை விவரிக்கவும்…",
    sent: "அனுப்பப்பட்டது! 24 மணி நேரத்திற்குள் உங்களைத் தொடர்பு கொள்வோம்.",
    submitFailed: "சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    sending: "அனுப்புகிறது…",
    submit: "புகாரைச் சமர்ப்பிக்கவும்",
    emailUs: "நீங்கள் எங்களுக்கு மின்னஞ்சலும் அனுப்பலாம்:"
  }
};

// Lets a customer raise a concern. Writes to the shared `queries` node (same
// one the vendor app uses) and fire-and-forget emails the admin so nothing is
// missed. `user` carries the current customer's identity for the ticket.
const SupportSection = ({ user, onDone }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { language } = useSettings();
  const t = STR[language] || STR.English;

  const handleSubmit = async () => {
    const text = message.trim();
    if (text.length < 5) return toast.error(t.describeError);

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

      toast.success(t.sent);
      setMessage('');
      onDone?.();
    } catch {
      toast.error(t.submitFailed);
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
          {t.intro}
        </p>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t.placeholder}
        rows={5}
        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-medium text-slate-800 focus:border-brand-500 focus:ring-0 outline-none resize-none transition-colors"
      />

      <button
        onClick={handleSubmit}
        disabled={submitting || message.trim().length < 5}
        className="w-full flex items-center justify-center gap-2 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 active:scale-[0.98] transition-all disabled:bg-slate-300"
      >
        <FaPaperPlane size={14} /> {submitting ? t.sending : t.submit}
      </button>

      <p className="text-xs text-slate-400 font-medium text-center">
        {t.emailUs}{' '}
        <a href="mailto:trade@trade2cart.in" className="text-brand-600 font-bold">trade@trade2cart.in</a>.
      </p>
    </div>
  );
};

export default SupportSection;
