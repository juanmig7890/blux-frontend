'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API, AVATARES } from '@/types';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal]   = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [nombre, setNombre] = useState('Usuario');
  const [avatar, setAvatar] = useState(AVATARES[0]);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setNombre(localStorage.getItem('activeProfileName') || 'Usuario');
    setAvatar(localStorage.getItem('activeProfileAvatar') || AVATARES[0]);

    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    setScrolled(true);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.nav-profile')) setDropdownOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSearch = (val: string) => {
    setSearchVal(val);
    if (!onSearch) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => onSearch(val), 400);
  };

  const cerrarSesion = () => { localStorage.clear(); router.push('/'); };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-left">
        <Link href="/home" className="nav-logo">BLUX</Link>
        <ul className="nav-links">
          <li><Link href="/home" className={pathname === '/home' ? 'active' : ''}>Inicio</Link></li>
          <li><Link href="/movies" className={pathname === '/movies' ? 'active' : ''}>Películas</Link></li>
          <li><Link href="/live" className={pathname === '/live' ? 'active' : ''}>En Vivo</Link></li>
          <li><Link href="/mylist" className={pathname === '/mylist' ? 'active' : ''}>Mi Lista</Link></li>
        </ul>
      </div>
      <div className="nav-right">
        <button className="nav-search-btn" onClick={() => { setSearchOpen(!searchOpen); setTimeout(() => searchRef.current?.focus(), 100); }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <input
          ref={searchRef}
          className={`nav-search-input${searchOpen ? ' open' : ''}`}
          type="text"
          placeholder="Buscar..."
          value={searchVal}
          onChange={e => handleSearch(e.target.value)}
        />
        <div className="nav-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <img className="nav-avatar" src={avatar} alt={nombre}
               onError={(e) => { (e.target as HTMLImageElement).src = AVATARES[0]; }} />
          <span className="nav-name">{nombre}</span>
          <div className={`nav-profile-dropdown${dropdownOpen ? ' show' : ''}`}>
            <Link href="/" className="dropdown-item" onClick={cerrarSesion}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="16 17 21 12 16 7" strokeWidth="2" strokeLinecap="round"/>
                <line x1="21" y1="12" x2="9" y2="12" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Cerrar sesión
            </Link>
            <Link href="/" className="dropdown-item" onClick={() => { localStorage.removeItem('activeProfileId'); localStorage.removeItem('activeProfileName'); localStorage.removeItem('activeProfileAvatar'); }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" strokeWidth="2"/>
              </svg>
              Cambiar perfil
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
