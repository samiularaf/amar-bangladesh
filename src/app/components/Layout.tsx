import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, AlertCircle, PlusCircle, BookOpen, Trophy,
  LogOut, Menu, X, ChevronRight, Shield, Users, Star, Bell
} from 'lucide-react';

const BD_GREEN = '#006A4E';
const BD_RED = '#F42A41';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
  userOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/admin', icon: <Shield size={20} />, label: 'অ্যাডমিন প্যানেল', adminOnly: true },
  { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'ড্যাশবোর্ড', userOnly: true },
  { to: '/submit', icon: <PlusCircle size={20} />, label: 'সমস্যা জানান', userOnly: true },
  { to: '/problems', icon: <AlertCircle size={20} />, label: 'সকল সমস্যা' },
  { to: '/courses', icon: <BookOpen size={20} />, label: 'কোর্সসমূহ' },
  { to: '/leaderboard', icon: <Trophy size={20} />, label: 'লিডারবোর্ড' },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    if (item.userOnly && user?.role === 'admin') return false;
    return true;
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F42A41] flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">আ</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">আমার বাংলাদেশ</h1>
            <p className="text-white/60 text-xs">Citizen Platform</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{user?.name?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            {user?.role !== 'admin' && (
              <div className="flex items-center gap-1">
                <Star size={11} className="text-yellow-300" />
                <span className="text-yellow-300 text-xs font-bold">{user?.points} পয়েন্ট</span>
              </div>
            )}
            {user?.role === 'admin' && (
              <span className="text-white/60 text-xs">সিস্টেম প্রশাসক</span>
            )}
          </div>
          {user?.role === 'admin' && (
            <span className="bg-[#F42A41] text-white text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-white text-[#006A4E] shadow-md'
                  : 'text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-[#006A4E]' : 'text-white/70 group-hover:text-white'}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto text-[#006A4E]" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">লগআউট</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 fixed inset-y-0 left-0 z-30" style={{ background: BD_GREEN }}>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col" style={{ background: BD_GREEN }}>
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 shadow-sm" style={{ background: BD_GREEN }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#F42A41] flex items-center justify-center">
              <span className="text-white font-bold text-sm">আ</span>
            </div>
            <span className="text-white font-bold">আমার বাংলাদেশ</span>
          </div>
          {user?.role !== 'admin' ? (
            <div className="flex items-center gap-2">
              <Star size={14} className="text-yellow-300" />
              <span className="text-yellow-300 text-sm font-bold">{user?.points}</span>
            </div>
          ) : (
            <span className="text-white/60 text-xs font-medium">Admin</span>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex">
        {filteredNav.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 ${isActive ? 'text-[#006A4E]' : 'text-gray-400'}`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
