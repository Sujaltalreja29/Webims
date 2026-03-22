import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Search,
  FileText,
  CalendarClock,
  Activity,
  Pill,
  Receipt,
  TestTube2,
  Sparkles
} from 'lucide-react';
import { ROLE_LABELS } from '../core/constants/roles';
import {
  globalSearchService,
  type GlobalSearchKind,
  type GlobalSearchResult
} from '../core/services/global-search.service';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 160);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!isQuickActionsOpen || !user) return;

    let isCancelled = false;

    const runSearch = async () => {
      setIsSearching(true);
      try {
        const results = await globalSearchService.search(debouncedQuery, user.role, 28);
        if (!isCancelled) {
          setSearchResults(results);
          setActiveResultIndex(0);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    };

    runSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, isQuickActionsOpen, user]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsQuickActionsOpen((prev) => !prev);
        return;
      }

      if (!isQuickActionsOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsQuickActionsOpen(false);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveResultIndex((prev) =>
          searchResults.length === 0 ? 0 : (prev + 1) % searchResults.length
        );
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveResultIndex((prev) =>
          searchResults.length === 0
            ? 0
            : (prev - 1 + searchResults.length) % searchResults.length
        );
        return;
      }

      if (event.key === 'Enter' && searchResults.length > 0) {
        event.preventDefault();
        const selected = searchResults[activeResultIndex] || searchResults[0];
        if (selected) {
          navigate(selected.path);
          setIsQuickActionsOpen(false);
          setQuery('');
        }
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
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeResultIndex, isQuickActionsOpen, navigate, searchResults]);

  const iconByKind: Record<GlobalSearchKind, React.ReactNode> = {
    action: <Sparkles size={14} className="text-indigo-600" />,
    patient: <UserIcon size={14} className="text-blue-600" />,
    appointment: <CalendarClock size={14} className="text-amber-600" />,
    encounter: <Activity size={14} className="text-emerald-600" />,
    prescription: <Pill size={14} className="text-cyan-700" />,
    claim: <Receipt size={14} className="text-rose-700" />,
    lab: <TestTube2 size={14} className="text-violet-700" />
  };

  const groupedResults = useMemo(() => {
    return searchResults.reduce<Record<string, GlobalSearchResult[]>>((acc, result) => {
      if (!acc[result.kind]) {
        acc[result.kind] = [];
      }
      acc[result.kind].push(result);
      return acc;
    }, {});
  }, [searchResults]);

  const sectionTitle: Record<GlobalSearchKind, string> = {
    action: 'Quick actions',
    patient: 'Patients',
    appointment: 'Appointments',
    encounter: 'Encounters',
    prescription: 'Prescriptions',
    claim: 'Claims',
    lab: 'Labs'
  };

  const openResult = (result: GlobalSearchResult) => {
    navigate(result.path);
    setIsQuickActionsOpen(false);
    setQuery('');
  };

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
                    ref={searchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search patient, MRN, claim, encounter, Rx..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Use ↑/↓ to move, Enter to open, Esc to close</p>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {isSearching ? (
                    <p className="rounded-lg px-3 py-2 text-sm text-slate-500">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="rounded-lg px-3 py-2 text-sm text-slate-500">No matches found for this role.</p>
                  ) : (
                    Object.entries(groupedResults).map(([kind, items]) => (
                      <div key={kind} className="mb-2 last:mb-0">
                        <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {sectionTitle[kind as GlobalSearchKind]}
                        </p>
                        {items.map((item) => {
                          const globalIndex = searchResults.findIndex((result) => result.id === item.id);
                          const isActive = globalIndex === activeResultIndex;

                          return (
                            <button
                              key={item.id}
                              onMouseEnter={() => setActiveResultIndex(globalIndex)}
                              onClick={() => openResult(item)}
                              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                                isActive
                                  ? 'border-blue-200 bg-blue-50'
                                  : 'border-transparent text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5">{iconByKind[item.kind]}</div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                                  <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
                  {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
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