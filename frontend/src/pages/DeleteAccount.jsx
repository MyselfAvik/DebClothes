import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldCheck, CheckCircle2, Mail, ArrowLeft, Clock, FileText, User, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';

const DeleteAccount = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please provide a valid registered email address');
      return;
    }

    setLoading(true);
    try {
      await API.post('/api/auth/delete-request', {
        email: email.trim(),
        name: name.trim(),
        reason: reason.trim(),
      });
      setSubmitted(true);
      toast.success('Your account deletion request has been registered.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deletion request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Header Badge */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-500/20">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                User Data Policy & Privacy
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Request Account & Data Deletion
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Application: <strong className="text-slate-800 dark:text-slate-200">Deb Clothes</strong> (Package:{' '}
            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-blue-600 dark:text-blue-400 font-mono">
              com.asora.debclothes
            </code>
            )
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8">
          
          {/* Instructions Section */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              How to Delete Your Account and Personal Data
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
              At <strong>Deb Clothes</strong>, we value your privacy and give you full control over your personal data. You can request the complete deletion of your account and all associated personal data through any of the following methods:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  In-App Deletion
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Open the <strong>Deb Clothes mobile app</strong> &gt; Navigate to <strong>Profile</strong> &gt; Tap on <strong>Account Settings</strong> &gt; Select <strong>Delete My Account</strong>.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Web Form / Email Request
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Submit the online deletion form below or email our Data Protection Officer directly at{' '}
                  <a href="mailto:support@debclothes.com" className="text-blue-600 dark:text-blue-400 underline font-semibold">
                    support@debclothes.com
                  </a>.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Interactive Request Form */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-500" />
              Online Data Deletion Form
            </h2>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  Deletion Request Successfully Logged
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                  We have received your account and data deletion request for <strong>{email}</strong>. A verification link will be sent to your email to confirm ownership. Upon confirmation, all your data will be permanently wiped within 7 to 30 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter the email linked to your Deb Clothes account"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Your account display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Please tell us why you wish to delete your account (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm tracking-wide transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Request...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Submit Account & Data Deletion Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Types of Data Deleted vs Retained */}
          <div className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              What Data is Deleted vs. Retained?
            </h2>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-sm">
                  ✓ Data that is PERMANENTLY DELETED:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 ml-1">
                  <li>Profile information (Full name, email address, password hashes, OAuth tokens).</li>
                  <li>Saved delivery addresses and phone numbers.</li>
                  <li>Shopping cart contents, active wishlist items, and product reviews.</li>
                  <li>Submitted refund bank details (UPI IDs / Account numbers).</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <span className="font-bold text-amber-700 dark:text-amber-300 block text-sm">
                  ⚠️ Data that may be retained (Legal/Tax Compliance):
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  Historical invoice summaries and financial transaction receipts are retained for up to 180 days solely for statutory tax accounting and anti-fraud compliance as required by Indian financial regulations, after which they are automatically expunged.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                <span className="font-bold text-blue-700 dark:text-blue-300 block text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Retention & Processing SLA:
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  Verified account deletion requests are processed and removed from all active database clusters within <strong>7 to 30 days</strong>.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
