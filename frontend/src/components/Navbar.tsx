import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  const navLinks = [
    { to: '/', label: 'Clasament' },
    { to: '/history', label: 'Istoric' },
    { to: '/players', label: 'Jucători' },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-lg tracking-wide">
          ⚽ Campionat
        </Link>
        {!isAdmin && (
          <div className="flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.to
                    ? 'text-green-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
        <Link
          to={isAdmin ? '/' : '/admin'}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isAdmin ? '← Înapoi' : 'Admin'}
        </Link>
      </div>
    </nav>
  );
}
