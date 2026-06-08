import React, { useState, useEffect } from 'react';

type Kategoria = 'jedzenie' | 'transport' | 'mieszkanie' | 'rozrywka' | 'zdrowie' | 'inne';

type Wydatek = {
  id: number;
  nazwa: string;
  kwota: number;
  kategoria: Kategoria;
  data: string;
  staly: boolean;
};

const KATEGORIE: { value: Kategoria; label: string }[] = [
  { value: 'jedzenie', label: 'Jedzenie' },
  { value: 'transport', label: 'Transport' },
  { value: 'mieszkanie', label: 'Mieszkanie' },
  { value: 'rozrywka', label: 'Rozrywka' },
  { value: 'zdrowie', label: 'Zdrowie' },
  { value: 'inne', label: 'Inne' },
];

const NAZWY_MIESIECY = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
];

const API = 'http://localhost:5000/api';
function getToken() { return localStorage.getItem('token') || ''; }

function Wydatki() {
  const now = new Date();
  const [wydatki, setWydatki] = useState<Wydatek[]>([]);
  const [nazwa, setNazwa] = useState('');
  const [kwota, setKwota] = useState('');
  const [kategoria, setKategoria] = useState<Kategoria>('inne');
  const [data, setData] = useState(now.toISOString().split('T')[0]);
  const [staly, setStaly] = useState(false);
  const [filtrRok, setFiltrRok] = useState(now.getFullYear());
  const [filtrMiesiac, setFiltrMiesiac] = useState(now.getMonth() + 1);
  const [filtrWszystko, setFiltrWszystko] = useState(false);

  useEffect(() => {
    let url = `${API}/wydatki`;
    if (!filtrWszystko) url += `?rok=${filtrRok}&miesiac=${filtrMiesiac}`;
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(setWydatki);
  }, [filtrRok, filtrMiesiac, filtrWszystko]);

  const dodajWydatek = async () => {
    if (!nazwa || !kwota) return;
    const odpowiedz = await fetch(`${API}/wydatki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ nazwa, kwota: parseFloat(kwota), kategoria, data, staly }),
    });
    const nowy = await odpowiedz.json();
    setWydatki([nowy, ...wydatki]);
    setNazwa('');
    setKwota('');
    setStaly(false);
  };

  const usunWydatek = async (id: number) => {
    await fetch(`${API}/wydatki/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setWydatki(wydatki.filter(w => w.id !== id));
  };

  const suma = wydatki.reduce((acc, w) => acc + Number(w.kwota), 0);
  const sumaPoKategorii = KATEGORIE.map(kat => ({
    label: kat.label,
    suma: wydatki.filter(w => w.kategoria === kat.value).reduce((acc, w) => acc + Number(w.kwota), 0),
  })).filter(k => k.suma > 0);

  const lata = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="karta">
      <h2>Wydatki</h2>

      <div className="wydatki-filtr">
        <span className="wydatki-filtr-label">Okres:</span>
        <select value={filtrRok} onChange={e => setFiltrRok(Number(e.target.value))} disabled={filtrWszystko}>
          {lata.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filtrMiesiac} onChange={e => setFiltrMiesiac(Number(e.target.value))} disabled={filtrWszystko}>
          {NAZWY_MIESIECY.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <label className="checkbox-label">
          <input type="checkbox" checked={filtrWszystko} onChange={e => setFiltrWszystko(e.target.checked)} />
          Wszystkie
        </label>
      </div>

      <div className="formularz">
        <label>Nazwa</label>
        <input value={nazwa} onChange={e => setNazwa(e.target.value)} placeholder="np. Biedronka" />
        <label>Kwota (zł)</label>
        <input type="number" value={kwota} onChange={e => setKwota(e.target.value)} placeholder="np. 50" />
        <label>Kategoria</label>
        <select value={kategoria} onChange={e => setKategoria(e.target.value as Kategoria)}>
          {KATEGORIE.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <label>Data</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} />
        <label className="checkbox-label">
          <input type="checkbox" checked={staly} onChange={e => setStaly(e.target.checked)} />
          Stały wydatek (np. czynsz, abonament)
        </label>
        <button className="przycisk-dodaj" onClick={dodajWydatek}>Dodaj wydatek</button>
      </div>

      {wydatki.length > 0 ? (
        <>
          <div className="podsumowanie">
            <div className="wynik-główny">
              <span>Łączne wydatki</span>
              <strong>{suma.toFixed(2)} zł</strong>
            </div>
            <div className="kategorie-podsumowanie">
              {sumaPoKategorii.map(k => (
                <div key={k.label} className="kategoria-row">
                  <span>{k.label}</span>
                  <span>{k.suma.toFixed(2)} zł</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lista-wydatkow">
            {wydatki.map(w => (
              <div key={w.id} className="wydatek-row">
                <div>
                  <strong>{w.nazwa}</strong>
                  {w.staly && <span className="staly-tag">Stały</span>}
                  <span className="kategoria-tag">{KATEGORIE.find(k => k.value === w.kategoria)?.label}</span>
                </div>
                <div className="wydatek-prawa">
                  <span>{w.data?.toString().split('T')[0]}</span>
                  <strong>{Number(w.kwota).toFixed(2)} zł</strong>
                  <button className="przycisk-usun" onClick={() => usunWydatek(w.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="brak-celow">Brak wydatków w wybranym okresie</p>
      )}
    </div>
  );
}

export default Wydatki;