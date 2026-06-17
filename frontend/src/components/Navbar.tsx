import { Link, useLocation } from 'react-router-dom';

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="12" width="4" height="9" rx="0.5" />
      <rect x="10" y="7" width="4" height="14" rx="0.5" />
      <rect x="17" y="3" width="4" height="18" rx="0.5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-1a4 4 0 0 0-3-3.85" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l8 4v6c0 4.5-3.5 8.5-8 10-4.5-1.5-8-5.5-8-10V6l8-4z" />
    </svg>
  );
}

function TimerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9.5 2.5h5" />
      <path d="M12 2.5v2" />
    </svg>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

const PUBLIC_NAV_ITEMS = [
  { to: '/', label: 'Clasament', Icon: BarChartIcon, exact: true },
  { to: '/players', label: 'Jucători', Icon: UsersIcon },
  { to: '/history', label: 'Istoric', Icon: HistoryIcon },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Acasă', Icon: HomeIcon },
  { to: '/admin/players', label: 'Jucători', Icon: UsersIcon },
  { to: '/admin/teams', label: 'Echipe', Icon: ShieldIcon },
  { to: '/admin/match/live', label: 'Timer', Icon: TimerIcon },
  { to: '/admin/matches/add', label: '+ Meci', Icon: PlusCircleIcon },
];

// Admin pages where the bottom nav should NOT appear (login / focus flows)
const ADMIN_NO_BOTTOM_NAV = ['/admin', '/admin/championship/new'];

export default function Navbar() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  // On admin sub-pages (not dashboard and not login) → back goes to dashboard
  const isAdminSubPage =
    isAdmin &&
    pathname !== '/admin' &&
    pathname !== '/admin/dashboard';

  const backTo = isAdminSubPage ? '/admin/dashboard' : '/';
  const backLabel = isAdminSubPage ? '← Dashboard' : '← Înapoi';

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  const showAdminBottomNav =
    isAdmin && !ADMIN_NO_BOTTOM_NAV.includes(pathname);

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-700 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-white font-bold text-lg tracking-wide">
            Campionat Sintetic Supur
          </Link>
          {!isAdmin && (
            <div className="hidden sm:flex gap-6">
              {PUBLIC_NAV_ITEMS.map(({ to, label, exact }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium transition-colors ${
                    isActive(to, exact) ? 'text-green-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
          <Link
            to={isAdmin ? backTo : '/admin'}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 px-2"
          >
            {isAdmin ? backLabel : 'Admin'}
          </Link>
        </div>
      </nav>

      {/* Public bottom nav */}
      {!isAdmin && (
        <nav
          className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-700"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex">
            {PUBLIC_NAV_ITEMS.map(({ to, label, Icon, exact }) => {
              const active = isActive(to, exact);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors select-none ${
                    active ? 'text-green-400' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-[22px] h-[22px]" />
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Admin bottom nav */}
      {showAdminBottomNav && (
        <nav
          className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-700"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex">
            {ADMIN_NAV_ITEMS.map(({ to, label, Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors select-none ${
                    active ? 'text-green-400' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-[22px] h-[22px]" />
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
