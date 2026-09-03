import React from 'react';
import { Link } from 'react-router';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-[#006A4E]/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🗺️</span>
        </div>
        <h1 className="text-6xl font-bold text-[#006A4E] mb-3">৪০৪</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">পৃষ্ঠাটি পাওয়া যায়নি</h2>
        <p className="text-gray-500 mb-6">আপনি যে পৃষ্ঠাটি খুঁজছেন সেটি বিদ্যমান নেই।</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-[#006A4E] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#005540] transition-colors"
        >
          <Home size={18} />
          হোমে ফিরুন
        </Link>
      </div>
    </div>
  );
}
