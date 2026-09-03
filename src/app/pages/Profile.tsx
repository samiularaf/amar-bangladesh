import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, KeyRound, Save, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', division: user?.division || '', district: user?.district || '', phone: user?.phone || '' });
  const [provider, setProvider] = useState<'email' | 'google'>('email');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => { api.getAuthProvider().then(setProvider).catch(() => setProvider('email')); }, []);
  useEffect(() => { setForm({ name: user?.name || '', division: user?.division || '', district: user?.district || '', phone: user?.phone || '' }); }, [user]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage(''); setSavingProfile(true);
    try { await updateProfile(form); setMessage('প্রোফাইল সফলভাবে আপডেট হয়েছে।'); }
    catch (err: any) { setError(err.message || 'প্রোফাইল আপডেট করা যায়নি'); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (passwords.next.length < 6) { setError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'); return; }
    if (passwords.next !== passwords.confirm) { setError('নতুন পাসওয়ার্ড দুটি মিলছে না।'); return; }
    setSavingPassword(true);
    try { await api.changePassword(passwords.current, passwords.next); setPasswords({ current: '', next: '', confirm: '' }); setMessage('পাসওয়ার্ড পরিবর্তন হয়েছে।'); }
    catch (err: any) { setError(err.message || 'পাসওয়ার্ড পরিবর্তন করা যায়নি'); }
    finally { setSavingPassword(false); }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 lg:pb-0">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-800">প্রোফাইল</h1><p className="text-sm text-gray-500 mt-1">আপনার ব্যক্তিগত তথ্য ও অ্যাকাউন্ট নিরাপত্তা পরিচালনা করুন</p></div>
      {(message || error) && <div className={`mb-5 p-3 rounded-xl flex gap-2 text-sm ${error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>{error ? <AlertCircle size={17} /> : <CheckCircle size={17} />}{error || message}</div>}

      <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5 space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2"><UserCircle size={20} className="text-[#006A4E]" />ব্যক্তিগত তথ্য</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2 text-sm font-medium text-gray-700">পূর্ণ নাম<input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]" /></label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700">ইমেইল<input value={user?.email || ''} disabled className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" /><span className="text-xs font-normal text-gray-400">ইমেইল পরিবর্তনের জন্য আলাদা ভেরিফিকেশন প্রয়োজন।</span></label>
          <label className="text-sm font-medium text-gray-700">বিভাগ<input value={form.division} onChange={e => setForm(p => ({ ...p, division: e.target.value }))} className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]" /></label>
          <label className="text-sm font-medium text-gray-700">জেলা<input value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]" /></label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700">মোবাইল নম্বর<input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]" /></label>
        </div>
        <button disabled={savingProfile} className="px-4 py-2.5 rounded-xl bg-[#006A4E] text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"><Save size={16} />{savingProfile ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}</button>
      </form>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="font-bold text-gray-800 flex items-center gap-2"><KeyRound size={20} className="text-[#006A4E]" />নিরাপত্তা</h2>
        {provider === 'google' ? <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">আপনি Google দিয়ে লগইন করেন। আপনার পাসওয়ার্ড Google Account-এ পরিচালিত হয়।</div> : (
          <form onSubmit={savePassword} className="mt-4 grid gap-4 max-w-lg">
            <label className="text-sm font-medium text-gray-700">বর্তমান পাসওয়ার্ড<input required type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]" /></label>
            <label className="text-sm font-medium text-gray-700">নতুন পাসওয়ার্ড<input required type="password" value={passwords.next} onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]" /></label>
            <label className="text-sm font-medium text-gray-700">নতুন পাসওয়ার্ড নিশ্চিত করুন<input required type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} className="mt-1.5 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A4E]" /></label>
            <button disabled={savingPassword} className="justify-self-start px-4 py-2.5 rounded-xl bg-[#006A4E] text-white text-sm font-semibold disabled:opacity-60">{savingPassword ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}</button>
          </form>
        )}
      </section>
    </div>
  );
}
