import React, { useState } from 'react';
import './App.css';
import Kalkulator from './Kalkulator';

function App() {
  const [aktywnaZakladka, setAktywnaZakladka] = useState('kalkulator');

  return (
    <div className="app">
      <header className="header">
        <h1>Planer Finansowy</h1>
        <nav className="nav">
          <button onClick={() => setAktywnaZakladka('dashboard')} className={aktywnaZakladka === 'dashboard' ? 'aktywny' : ''}>Dashboard</button>
          <button onClick={() => setAktywnaZakladka('wydatki')} className={aktywnaZakladka === 'wydatki' ? 'aktywny' : ''}>Wydatki</button>
          <button onClick={() => setAktywnaZakladka('kalkulator')} className={aktywnaZakladka === 'kalkulator' ? 'aktywny' : ''}>Kalkulator</button>
          <button onClick={() => setAktywnaZakladka('cele')} className={aktywnaZakladka === 'cele' ? 'aktywny' : ''}>Cele</button>
        </nav>
      </header>
      <main>
        {aktywnaZakladka === 'kalkulator' && <Kalkulator />}
        {aktywnaZakladka === 'dashboard' && <p>Dashboard - wkrótce</p>}
        {aktywnaZakladka === 'wydatki' && <p>Wydatki - wkrótce</p>}
        {aktywnaZakladka === 'cele' && <p>Cele - wkrótce</p>}
      </main>
    </div>
  );
}

export default App;