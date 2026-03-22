import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, User as UserIcon, ShieldCheck, Search } from 'lucide-react';
import { ROLE_LABELS } from '../core/constants/roles';
import { ACCESS_CONTROL } from '../core/constants/access-control';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  const sectionLabel = location.pathname
    .split('/')
    .filter(Boolean)[0]
    ?.replace(/-/g, ' ')
    ?.replace(/\b\w/g, (char) => char.toUpperCase()) || 'Dashboard';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsQuickActionsOpen((prev) => !prev);
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setIsQuickActionsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    if (isQuickActionsOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isQuickActionsOpen]);

  const quickActions = ACCESS_CONTROL.quickActions
    .filter((action) => (user ? action.roles.includes(user.role) : false))
    .filter((action) => action.label.toLowerCase().includes(query.toLowerCase()));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed left-72 right-0 top-0 z-30 h-16 border-b border-slate-200 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75">
      <div className="flex h-full items-center justify-between px-6">
        <div className="hidden items-center gap-3 md:flex">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {sectionLabel}
          </div>
          <div className="hidden items-center text-xs text-slate-500 lg:flex">
            <ShieldCheck size={14} className="mr-1.5 text-emerald-600" />
            HIPAA demo mode
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block" ref={quickActionsRef}>
            <button
              onClick={() => setIsQuickActionsOpen((prev) => !prev)}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Search size={15} className="mr-2 text-slate-500" />
              Quick Actions
              <span className="ml-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500">Ctrl+K</span>
            </button>

            {isQuickActionsOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 p-3">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search actions..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {quickActions.length === 0 ? (
                    <p className="rounded-lg px-3 py-2 text-sm text-slate-500">No actions found.</p>
                  ) : (
                    quickActions.map((action) => (
                      <button
                        key={action.path}
                        onClick={() => {
                          navigate(action.path);
                          setIsQuickActionsOpen(false);
                          setQuery('');
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {action.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-slate-200 hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <UserIcon size={18} className="text-blue-600" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user && ROLE_LABELS[user.role]}</p>
            </div>
            <ChevronDown 
              size={16} 
              className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                <p className="mt-0.5 text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={16} className="mr-3" />
                Sign Out
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};