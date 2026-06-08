import React, { useState, useEffect } from 'react';

type Wydatek = { id: number; nazwa: string; kwota: number; kategoria: string; data: string };
type Cel = { id: number; nazwa: string; docelowa: number; aktualna: number };
type Profil = { dochod_netto: number; stale_wydatki: number };

const API = 'http://localhost:5000/api';
function getToken() { return localStorage.getItem('token') || ''; }

const NAZWY_MIESIECY = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];

function Dashboard() {
  const [wydatki, setWydatki] = useState<Wydatek[]>([]);
  const [cele, setCele] = useState<Cel[]>([]);
  const [profil, setProfil] = useState<Profil | null>(null);

  const now = new Date();
  const rok = now.getFullYear();
  const miesiac = now.getMonth() + 1;

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    fetch(`${API}/wydatki?rok=${rok}&miesiac=${miesiac}`, { headers })
      .then(r => r.json())
      .then(setWydatki);

    fetch(`${API}/cele`, { headers })
      .then(r => r.json())
      .then(setCele);

    fetch(`${API}/profil`, { headers })
      .then(r => r.json())
      .then(setProfil);
  }, []);

  const sumaWydatkow = wydatki.reduce((acc, w) => acc + Number(w.kwota), 0);
  const dochodNetto = Number(profil?.dochod_netto ?? 0);
  const staleWydatki = Number(profil?.stale_wydatki ?? 0);
  const wolneS = dochodNetto - staleWydatki - sumaWydatkow;
  const ostatnieWydatki = wydatki.slice(0, 5);
  const nazwaMiesiaca = NAZWY_MIESIECY[miesiac - 1];

  return (
    <div className="dashboard">
      <p className="dashboard-okres">{nazwaMiesiaca} {rok}</p>

      <div className="dashboard-siatka-gorna">
        <div className="karta stat-karta">
          <p className="stat-label">Dochód netto</p>
          <p className="stat-wartosc">{dochodNetto.toFixed(2)} zł</p>
        </div>
        <div className="karta stat-karta">
          <p className="stat-label">Stałe wydatki</p>
          <p className="stat-wartosc stat-szary">{staleWydatki.toFixed(2)} zł</p>
        </div>
        <div className="karta stat-karta">
          <p className="stat-label">Wydatki w {nazwaMiesiaca.toLowerCase()}</p>
          <p className="stat-wartosc stat-czerwony">{sumaWydatkow.toFixed(2)} zł</p>
        </div>
      </div>

      <div className="dashboard-siatka-dolna">
        <div className="karta stat-karta">
          <p className="stat-label">Wolne środki</p>
          <p className={`stat-wartosc ${wolneS >= 0 ? 'stat-zielony' : 'stat-czerwony'}`}>
            {wolneS.toFixed(2)} zł
          </p>
          <p className="stat-opis">{dochodNetto.toFixed(0)} − {staleWydatki.toFixed(0)} stałe − {sumaWydatkow.toFixed(0)} bieżące</p>
        </div>
        <div className="karta stat-karta">
          <p className="stat-label">Aktywne cele</p>
          <p className="stat-wartosc">{cele.length}</p>
        </div>
      </div>

      <div className="dashboard-dolny">
        <div className="karta">
          <h2>Ostatnie wydatki</h2>
          {ostatnieWydatki.length === 0 && <p className="brak-celow">Brak wydatków w tym miesiącu</p>}
          {ostatnieWydatki.map(w => (
            <div key={w.id} className="wydatek-row">
              <div>
                <strong>{w.nazwa}</strong>
                <span className="kategoria-tag">{w.kategoria}</span>
              </div>
              <div className="wydatek-prawa">
                <span>{w.data?.toString().split('T')[0]}</span>
                <strong>{Number(w.kwota).toFixed(2)} zł</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="karta">
          <h2>Cele oszczędnościowe</h2>
          {cele.length === 0 && <p className="brak-celow">Brak celów</p>}
          {cele.map(cel => {
            const procent = Math.min(Math.round((Number(cel.aktualna) / Number(cel.docelowa)) * 100), 100);
            return (
              <div key={cel.id} className="cel-dashboard">
                <div className="cel-top">
                  <span>{cel.nazwa}</span>
                  <span>{procent}%</span>
                </div>
                <div className="pasek-tlo">
                  <div className="pasek-wypelnienie" style={{ width: `${procent}%` }} />
                </div>
                <div className="cel-kwoty">
                  <span>{Number(cel.aktualna).toFixed(2)} zł</span>
                  <span>{Number(cel.docelowa).toFixed(2)} zł</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;