import React, { useState, useEffect } from 'react';

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

function Cele() {
  const [cele, setCele] = useState<Cel[]>([]);
  const [nazwa, setNazwa] = useState('');
  const [docelowa, setDocelowa] = useState('');
  const [dodawanie, setDodawanie] = useState(false);
  const [wplacanaKwota, setWplacanaKwota] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    fetch(`${API}/cele`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(setCele);
  }, []);

  const dodajCel = async () => {
    if (!nazwa || !docelowa) return;
    const odpowiedz = await fetch(`${API}/cele`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ nazwa, docelowa: parseFloat(docelowa) }),
    });
    const nowy = await odpowiedz.json();
    setCele([...cele, nowy]);
    setNazwa('');
    setDocelowa('');
    setDodawanie(false);
  };

  const dodajSrodki = async (id: number) => {
    const kwota = parseFloat(wplacanaKwota[id] || '0');
    if (!kwota) return;
    const odpowiedz = await fetch(`${API}/cele/${id}/wplata`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ kwota }),
    });
    const zaktualizowany = await odpowiedz.json();
    setCele(cele.map((c) => (c.id === id ? zaktualizowany : c)));
    setWplacanaKwota((prev) => ({ ...prev, [id]: '' }));
  };

  const usunCel = async (id: number) => {
    await fetch(`${API}/cele/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setCele(cele.filter((c) => c.id !== id));
  };

  return (
    <div className="karta">
      <div className="cele-header">
        <h2>Cele Oszczędnościowe</h2>
        <button className="przycisk-dodaj" onClick={() => setDodawanie(!dodawanie)}>
          {dodawanie ? 'Anuluj' : '+ Nowy cel'}
        </button>
      </div>

      {dodawanie && (
        <div className="formularz">
          <label>Nazwa celu</label>
          <input value={nazwa} onChange={(e) => setNazwa(e.target.value)} placeholder="np. Nowy laptop" />
          <label>Kwota docelowa (zł)</label>
          <input type="number" value={docelowa} onChange={(e) => setDocelowa(e.target.value)} placeholder="np. 3000" />
          <button className="przycisk-dodaj" onClick={dodajCel}>Dodaj cel</button>
        </div>
      )}

      <div className="lista-celow">
        {cele.length === 0 && <p className="brak-celow">Nie masz jeszcze żadnych celów. Dodaj pierwszy!</p>}
        {cele.map((cel) => {
          const procent = Math.round((Number(cel.aktualna) / Number(cel.docelowa)) * 100);
          return (
            <div key={cel.id} className="cel-karta">
              <div className="cel-top">
                <strong>{cel.nazwa}</strong>
                <button className="przycisk-usun" onClick={() => usunCel(cel.id)}>✕</button>
              </div>
              <div className="pasek-tlo">
                <div className="pasek-wypelnienie" style={{ width: `${procent}%` }} />
              </div>
              <div className="cel-kwoty">
                <span>{Number(cel.aktualna).toFixed(2)} zł odłożone</span>
                <span>{procent}% z {Number(cel.docelowa).toFixed(2)} zł</span>
              </div>
              {procent < 100 && (
                <div className="cel-wplata">
                  <input
                    type="number"
                    placeholder="Dodaj kwotę"
                    value={wplacanaKwota[cel.id] || ''}
                    onChange={(e) => setWplacanaKwota((prev) => ({ ...prev, [cel.id]: e.target.value }))}
                  />
                  <button className="przycisk-dodaj" onClick={() => dodajSrodki(cel.id)}>Dodaj</button>
                </div>
              )}
              {procent >= 100 && <p className="cel-osiagniety">Cel osiągnięty!</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Cele;