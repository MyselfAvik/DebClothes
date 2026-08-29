import React, { useEffect } from 'react';
import { ShieldCheck, Lock, Eye, Database, Camera, CreditCard, UserCheck, Trash2, Mail, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = "August 29, 2026";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-700 dark:text-slate-300 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto">
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
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3.5 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Official Legal Policy
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Privacy Policy — Deb Clothes
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Application: <span className="font-semibold text-slate-800 dark:text-slate-200">Deb Clothes</span> (Package:{' '}
            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-blue-600 dark:text-blue-400 font-mono">
              com.asora.debclothes
            </code>
            )
            <br />
            Effective Date: <span className="font-medium text-slate-700 dark:text-slate-300">{lastUpdated}</span>
          </p>
        </div>

        {/* Content Container */}
        <div className="bg-white dark:bg-[#131b2e] rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-10">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                1. Overview & Commitment
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350">
              Welcome to <strong>Deb Clothes</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting the personal data of our users (&quot;you&quot; or &quot;customer&quot;). This Privacy Policy governs our web application and mobile application (<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">com.asora.debclothes</code>) available on Google Play.
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350">
              By accessing or using Deb Clothes, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                2. Information We Collect
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350">
              We collect information that you voluntarily provide to us when registering, placing an order, or interacting with our customer support:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  Account & Contact Details
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Your full name, email address, phone number, and physical shipping address for parcel delivery and account authentication.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Refund Payout Details
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  UPI ID or Bank Account Number and IFSC code, submitted strictly by customers when requesting order return refunds.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
                  <Camera className="w-4 h-4 text-purple-500" />
                  Photos & Media (Optional)
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Images selected or captured by you to provide proof for product return requests or product reviews.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
                  <Lock className="w-4 h-4 text-amber-500" />
                  Device & Diagnostic Data
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  IP address, device OS version, app version, and network status for security, error diagnostics, and service reliability.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                3. How We Use Your Information
              </h2>
            </div>
            <ul className="list-disc list-inside text-sm space-y-2 text-slate-600 dark:text-slate-350 ml-1">
              <li><strong>Order Processing & Fulfillment:</strong> Processing transactions, preparing orders, and arranging doorstep delivery via logistics partners.</li>
              <li><strong>Returns & Direct Refunds:</strong> Reviewing return claims and initiating refund transfers to your designated UPI ID or bank account.</li>
              <li><strong>Authentication & Security:</strong> Verifying accounts through password, instant email OTP, or Google OAuth 2.0.</li>
              <li><strong>Customer Support:</strong> Resolving inquiries, dispute management, and sending order status notifications.</li>
              <li><strong>Fraud Prevention:</strong> Detecting and mitigating unauthorized transactions or platform abuse.</li>
            </ul>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                <ExternalLink className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                4. Third-Party Service Providers
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350">
              We never sell or rent your personal data to advertisers. We share minimal necessary information only with vetted infrastructure and fulfillment partners:
            </p>
            <ul className="list-disc list-inside text-sm space-y-2 text-slate-600 dark:text-slate-350 ml-1">
              <li><strong>Google OAuth 2.0 / Google Play Services:</strong> For secure user sign-in and app distribution.</li>
              <li><strong>Cloudinary:</strong> For secure media hosting (customer return photos and product catalogs).</li>
              <li><strong>Delivery & Logistics Partners:</strong> (EKart / BlueDart / Delhivery) For shipping package delivery.</li>
              <li><strong>Payment & Banking Gateways:</strong> For processing online payments and executing refund payouts.</li>
            </ul>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                5. Data Retention & User Data Deletion Rights
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350">
              In full compliance with <strong>Google Play User Data Policies</strong> and data protection laws:
            </p>
            <ul className="list-disc list-inside text-sm space-y-2 text-slate-600 dark:text-slate-350 ml-1">
              <li>You have the right to access, update, or permanently delete your account and associated personal data at any time.</li>
              <li>To request complete deletion of your account, orders history, or stored details, you can contact us at <a href="mailto:support@debclothes.com" className="text-blue-600 dark:text-blue-400 font-semibold underline">support@debclothes.com</a> with the subject line <em>&quot;Account Data Deletion Request&quot;</em>.</li>
              <li>Your data will be permanently wiped from our active databases within 30 days of receiving your verified request.</li>
            </ul>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                6. Data Security
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350">
              We implement industry-standard security measures including SSL/TLS 256-bit encryption for all network transmissions, encrypted password hashing (bcrypt), and role-based access control to protect your personal information against unauthorized access, loss, or misuse.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                7. Children&apos;s Privacy (COPPA)
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350">
              Deb Clothes is an e-commerce platform and does not knowingly collect personal information from children under the age of 13. If you believe that a minor has provided us with personal data, please contact us immediately and we will promptly remove the information.
            </p>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 8 */}
          <section className="space-y-3 bg-blue-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-blue-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                8. Contact Us
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
              If you have any questions, feedback, or privacy concerns regarding this Privacy Policy, please contact our Data Protection Team:
            </p>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 space-y-1">
              <p><strong>App Name:</strong> Deb Clothes</p>
              <p><strong>Application ID:</strong> com.asora.debclothes</p>
              <p><strong>Support Email:</strong> <a href="mailto:support@debclothes.com" className="text-blue-600 dark:text-blue-400 underline">support@debclothes.com</a> / <a href="mailto:avikd.official@gmail.com" className="text-blue-600 dark:text-blue-400 underline">avikd.official@gmail.com</a></p>
              <p><strong>Location:</strong> West Bengal, India</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
