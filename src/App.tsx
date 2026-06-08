import React, { useState, useEffect } from 'react';
import './App.css';
import Kalkulator from './Kalkulator';
import Wydatki from './Wydatki';
import Cele from './Cele';
import Dashboard from './Dashboard';
import CzyStac from './CzyStac';
import Auth from './Auth';
import Profil from './Profil';
import Onboarding from './Onboarding';

type Uzytkownik = { id: number; email: string; imie: string };

const IconDashboard = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IconReceipt = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2Z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>;
const IconCalc = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>;
const IconTarget = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconCard = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IconUser = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
const IconLogout = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { id: 'wydatki', label: 'Wydatki', icon: IconReceipt },
  { id: 'kalkulator', label: 'Kalkulator', icon: IconCalc },
  { id: 'cele', label: 'Cele', icon: IconTarget },
  { id: 'czystac', label: 'Czy mnie stać?', icon: IconCard },
  { id: 'profil', label: 'Profil', icon: IconUser },
];

function App() {
  const [aktywnaZakladka, setAktywnaZakladka] = useState('dashboard');
  const [uzytkownik, setUzytkownik] = useState<Uzytkownik | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('uzytkownik');
    const token = localStorage.getItem('token');
    if (saved && token) {
      setUzytkownik(JSON.parse(saved));
      fetch('/api/profil', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(p => setOnboardingDone(p.onboarding_done));
    }
  }, []);

  const onZalogowany = async (token: string, user: Uzytkownik) => {
    setUzytkownik(user);
    const p = await fetch('/api/profil', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());
    setOnboardingDone(p.onboarding_done);
  };

  const wyloguj = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('uzytkownik');
    setUzytkownik(null);
  };

  if (!uzytkownik) return <Auth onZalogowany={onZalogowany} />;
  if (!onboardingDone) return <Onboarding onUkoncz={() => setOnboardingDone(true)} />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'hsl(240,10%,3.9%)' }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        minWidth: '220px',
        background: 'hsl(240,8%,5%)',
        borderRight: '1px solid hsl(240,4%,13%)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid hsl(240,4%,13%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'hsl(217,91%,60%)',
              borderRadius: '7px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <span style={{ color: 'hsl(0,0%,98%)', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>
              Planer
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px' }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAktywnaZakladka(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: 500,
                marginBottom: '1px',
                transition: 'background 0.1s, color 0.1s',
                background: aktywnaZakladka === id ? 'hsl(240,4%,13%)' : 'transparent',
                color: aktywnaZakladka === id ? 'hsl(0,0%,98%)' : 'hsl(240,5%,55%)',
              }}
              onMouseEnter={e => {
                if (aktywnaZakladka !== id) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'hsl(240,4%,11%)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'hsl(0,0%,90%)';
                }
              }}
              onMouseLeave={e => {
                if (aktywnaZakladka !== id) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'hsl(240,5%,55%)';
                }
              }}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '8px', borderTop: '1px solid hsl(240,4%,13%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', marginBottom: '2px' }}>
            <div style={{
              width: '26px', height: '26px',
              background: 'hsl(217,91%,60%)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontSize: '11px', fontWeight: 600 }}>
                {uzytkownik.imie[0].toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'hsl(0,0%,98%)', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {uzytkownik.imie}
              </div>
              <div style={{ color: 'hsl(240,5%,45%)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {uzytkownik.email}
              </div>
            </div>
          </div>
          <button
            onClick={wyloguj}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 10px', borderRadius: '6px', border: 'none',
              background: 'transparent', color: 'hsl(240,5%,45%)',
              fontSize: '13px', cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'hsl(240,4%,11%)';
              (e.currentTarget as HTMLButtonElement).style.color = 'hsl(0,0%,90%)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'hsl(240,5%,45%)';
            }}
          >
            <IconLogout />
            Wyloguj
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px', background: 'hsl(240,10%,3.9%)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.15s ease-out' }}>
          {aktywnaZakladka === 'dashboard' && <Dashboard />}
          {aktywnaZakladka === 'wydatki' && <Wydatki />}
          {aktywnaZakladka === 'kalkulator' && <Kalkulator />}
          {aktywnaZakladka === 'cele' && <Cele />}
          {aktywnaZakladka === 'czystac' && <CzyStac />}
          {aktywnaZakladka === 'profil' && <Profil />}
        </div>
      </main>

    </div>
  );
}

export default App;