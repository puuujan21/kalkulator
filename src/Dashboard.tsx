import React, { useState, useEffect } from 'react';

type Wydatek = {
  id: number;
  nazwa: string;
  kwota: number;
  kategoria: string;
  data: string;
};

type Cel = {
  id: number;
  nazwa: string;
  docelowa: number;
  aktualna: number;
};

const API = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

function Dashboard() {
  const [wydatki, setWydatki] = useState<Wydatek[]>([]);
  const [cele, setCele] = useState<Cel[]>([]);

  useEffect(() => {
    fetch(`${API}/wydatki`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(setWydatki);

    fetch(`${API}/cele`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(setCele);
  }, []);

  const sumaWydatkow = wydatki.reduce((acc, w) => acc + Number(w.kwota), 0);
  const ostatnieWydatki = wydatki.slice(0, 5);

  return (
    <div className="dashboard">
      <div className="dashboard-siatka">
        <div className="karta stat-karta">
          <p className="stat-label">Łączne wydatki</p>
          <p className="stat-wartosc">{sumaWydatkow.toFixed(2)} zł</p>
        </div>
        <div className="karta stat-karta">
          <p className="stat-label">Liczba wydatków</p>
          <p className="stat-wartosc">{wydatki.length}</p>
        </div>
        <div className="karta stat-karta">
          <p className="stat-label">Aktywne cele</p>
          <p className="stat-wartosc">{cele.length}</p>
        </div>
      </div>

      <div className="dashboard-dolny">
        <div className="karta">
          <h2>Ostatnie wydatki</h2>
          {ostatnieWydatki.length === 0 && <p className="brak-celow">Brak wydatków</p>}
          {ostatnieWydatki.map((w) => (
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
          {cele.map((cel) => {
            const procent = Math.round((Number(cel.aktualna) / Number(cel.docelowa)) * 100);
            return (
              <div key={cel.id} className="cel-dashboard">
                <div className="cel-top">
                  <span>{cel.nazwa}</span>
                  <span>{procent}%</span>
                </div>
                <div className="pasek-tlo">
                  <div className="pasek-wypelnienie" style={{ width: `${procent}%` }} />
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