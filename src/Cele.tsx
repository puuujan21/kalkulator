import React, { useState, useEffect } from 'react';

type Cel = {
  id: number;
  nazwa: string;
  docelowa: number;
  aktualna: number;
};

function Cele() {
  const [cele, setCele] = useState<Cel[]>([]);
  const [nazwa, setNazwa] = useState('');
  const [docelowa, setDocelowa] = useState('');
  const [dodawanie, setDodawanie] = useState(false);
  const [wplacanaKwota, setWplacanaKwota] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    const zapisane = localStorage.getItem('cele');
    if (zapisane) setCele(JSON.parse(zapisane));
  }, []);

  const zapiszDoStorage = (noweCele: Cel[]) => {
    localStorage.setItem('cele', JSON.stringify(noweCele));
    setCele(noweCele);
  };

  const dodajCel = () => {
    if (!nazwa || !docelowa) return;
    const nowy: Cel = {
      id: Date.now(),
      nazwa,
      docelowa: parseFloat(docelowa),
      aktualna: 0,
    };
    zapiszDoStorage([...cele, nowy]);
    setNazwa('');
    setDocelowa('');
    setDodawanie(false);
  };

  const dodajSrodki = (id: number) => {
    const kwota = parseFloat(wplacanaKwota[id] || '0');
    if (!kwota) return;
    const zaktualizowane = cele.map((c) =>
      c.id === id ? { ...c, aktualna: Math.min(c.aktualna + kwota, c.docelowa) } : c
    );
    zapiszDoStorage(zaktualizowane);
    setWplacanaKwota((prev) => ({ ...prev, [id]: '' }));
  };

  const usunCel = (id: number) => {
    zapiszDoStorage(cele.filter((c) => c.id !== id));
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
          const procent = Math.round((cel.aktualna / cel.docelowa) * 100);
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
                <span>{cel.aktualna.toFixed(2)} zł odłożone</span>
                <span>{procent}% z {cel.docelowa.toFixed(2)} zł</span>
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
              {procent === 100 && <p className="cel-osiagniety">Cel osiągnięty!</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Cele;