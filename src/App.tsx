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

function App() {
  const [aktywnaZakladka, setAktywnaZakladka] = useState('dashboard');
  const [uzytkownik, setUzytkownik] = useState<Uzytkownik | null>(null);

  useEffect(() => {
  const zapisanyUzytkownik = localStorage.getItem('uzytkownik');
  const token = localStorage.getItem('token');
  if (zapisanyUzytkownik && token) {
    setUzytkownik(JSON.parse(zapisanyUzytkownik));
    fetch('http://localhost:5000/api/profil', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((profil) => setOnboardingDone(profil.onboarding_done));
  }
}, []);

const [onboardingDone, setOnboardingDone] = useState(false);

const onZalogowany = async (token: string, uzytkownik: Uzytkownik) => {
  setUzytkownik(uzytkownik);
  const profil = await fetch('http://localhost:5000/api/profil', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  setOnboardingDone(profil.onboarding_done);
};
  const wyloguj = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('uzytkownik');
    setUzytkownik(null);
  };

  if (!uzytkownik) {
  return <Auth onZalogowany={onZalogowany} />;
}

if (!onboardingDone) {
  return <Onboarding onUkoncz={() => setOnboardingDone(true)} />;
}
  return (
    <div className="app">
      <header className="header">
        <h1>Planer Finansowy</h1>
        <nav className="nav">
          <button onClick={() => setAktywnaZakladka('dashboard')} className={aktywnaZakladka === 'dashboard' ? 'aktywny' : ''}>Dashboard</button>
          <button onClick={() => setAktywnaZakladka('wydatki')} className={aktywnaZakladka === 'wydatki' ? 'aktywny' : ''}>Wydatki</button>
          <button onClick={() => setAktywnaZakladka('kalkulator')} className={aktywnaZakladka === 'kalkulator' ? 'aktywny' : ''}>Kalkulator</button>
          <button onClick={() => setAktywnaZakladka('cele')} className={aktywnaZakladka === 'cele' ? 'aktywny' : ''}>Cele</button>
          <button onClick={() => setAktywnaZakladka('czystac')} className={aktywnaZakladka === 'czystac' ? 'aktywny' : ''}>Czy mnie stać?</button>
          <button onClick={() => setAktywnaZakladka('profil')} className={aktywnaZakladka === 'profil' ? 'aktywny' : ''}>Profil</button>
          <span className="uzytkownik-info">Cześć, {uzytkownik.imie}!</span>
          <button onClick={wyloguj} className="przycisk-wyloguj">Wyloguj</button>
        </nav>
      </header>
      <main>
        {aktywnaZakladka === 'dashboard' && <Dashboard />}
        {aktywnaZakladka === 'wydatki' && <Wydatki />}
        {aktywnaZakladka === 'kalkulator' && <Kalkulator />}
        {aktywnaZakladka === 'cele' && <Cele />}
        {aktywnaZakladka === 'czystac' && <CzyStac />}
        {aktywnaZakladka === 'profil' && <Profil />}
      </main>
    </div>
  );
}

export default App;