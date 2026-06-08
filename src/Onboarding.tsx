import React, { useState } from 'react';

type TrybWprowadzania = 'miesiac_brutto' | 'miesiac_netto' | 'godzinowa' | 'roczna_brutto' | 'roczna_netto';

const ZUS_PRAC = { emerytalna: 0.0976, rentowa: 0.015, chorobowa: 0.0245 };
const ULGA_MIESIECZNA = (30000 / 12) * 0.12;
const KOSZTY_UOP = 250;

function obliczUoP(brutto: number, ulgaMlodych: boolean): number {
  const zusSum = brutto * (ZUS_PRAC.emerytalna + ZUS_PRAC.rentowa + ZUS_PRAC.chorobowa);
  const zdrowotna = (brutto - zusSum) * 0.09;
  const podatek = ulgaMlodych ? 0 : Math.max((brutto - zusSum - KOSZTY_UOP) * 0.12 - ULGA_MIESIECZNA, 0);
  return brutto - zusSum - zdrowotna - podatek;
}

function znajdzBrutto(doceloweNetto: number, oblicz: (b: number) => number): number {
  let min = doceloweNetto;
  let max = doceloweNetto * 3;
  for (let i = 0; i < 100; i++) {
    const mid = (min + max) / 2;
    if (oblicz(mid) < doceloweNetto) min = mid;
    else max = mid;
  }
  return Math.round((min + max) / 2 * 100) / 100;
}

type Props = {
  onUkoncz: () => void;
};

function Onboarding({ onUkoncz }: Props) {
  const [krok, setKrok] = useState(1);
  const [trybWprowadzania, setTrybWprowadzania] = useState<TrybWprowadzania>('miesiac_brutto');
  const [wartosc, setWartosc] = useState('');
  const [godziny, setGodziny] = useState('168');
  const [ulgaMlodych, setUlgaMlodych] = useState(false);
  const [nettoMiesieczne, setNettoMiesieczne] = useState<number | null>(null);
  const [staleWydatki, setStaleWydatki] = useState<{ nazwa: string; kwota: string }[]>([{ nazwa: '', kwota: '' }]);
  const [celNazwa, setCelNazwa] = useState('');
  const [celKwota, setCelKwota] = useState('');

  const obliczNetto = (): number | null => {
    const val = parseFloat(wartosc);
    if (!val || val <= 0) return null;
    const oblicz = (b: number) => obliczUoP(b, ulgaMlodych);
    let brutto = val;
    if (trybWprowadzania === 'miesiac_brutto') brutto = val;
    else if (trybWprowadzania === 'miesiac_netto') brutto = znajdzBrutto(val, oblicz);
    else if (trybWprowadzania === 'godzinowa') brutto = val * (parseFloat(godziny) || 168);
    else if (trybWprowadzania === 'roczna_brutto') brutto = val / 12;
    else if (trybWprowadzania === 'roczna_netto') brutto = znajdzBrutto(val / 12, oblicz);
    return oblicz(brutto);
  };

  const przejdzDalej = () => {
    if (krok === 1) {
      const netto = obliczNetto();
      if (!netto) return;
      setNettoMiesieczne(netto);
      setKrok(2);
    } else if (krok === 2) {
      setKrok(3);
    }
  };

  const zakoncz = async (pomin = false) => {
    const sumaWydatkow = pomin ? 0 : staleWydatki.reduce((acc, w) => acc + (parseFloat(w.kwota) || 0), 0);
    await fetch('http://localhost:5000/api/profil/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({
        dochod_netto: nettoMiesieczne || 0,
        stale_wydatki: sumaWydatkow,
        cel_nazwa: celNazwa || null,
        cel_kwota: celKwota ? parseFloat(celKwota) : null,
      }),
    });
    onUkoncz();
  };

  const labelWartosci = () => {
    switch (trybWprowadzania) {
      case 'miesiac_brutto': return 'Miesięczna brutto (zł)';
      case 'miesiac_netto': return 'Miesięczna netto (zł)';
      case 'godzinowa': return 'Stawka godzinowa brutto (zł)';
      case 'roczna_brutto': return 'Roczna brutto (zł)';
      case 'roczna_netto': return 'Roczna netto (zł)';
    }
  };

  const podglad = obliczNetto();

  return (
    <div className="auth-container">
      <div className="auth-karta" style={{ maxWidth: '520px' }}>
        <div className="onboarding-kroki">
          {[1, 2, 3].map((k) => (
            <div key={k} className={`onboarding-krok ${krok >= k ? 'aktywny' : ''}`}>{k}</div>
          ))}
        </div>

        {krok === 1 && (
          <>
            <h2 className="auth-tytul" style={{ fontSize: '1.4rem' }}>Ile zarabiasz?</h2>
            <div className="formularz">
              <label>Tryb wprowadzania</label>
              <select value={trybWprowadzania} onChange={(e) => setTrybWprowadzania(e.target.value as TrybWprowadzania)}>
                <option value="miesiac_brutto">Miesięczna brutto → netto</option>
                <option value="miesiac_netto">Miesięczna netto → brutto</option>
                <option value="godzinowa">Stawka godzinowa</option>
                <option value="roczna_brutto">Roczna brutto → netto</option>
                <option value="roczna_netto">Roczna netto → brutto</option>
              </select>

              <label>{labelWartosci()}</label>
              <input type="number" value={wartosc} onChange={(e) => setWartosc(e.target.value)} placeholder="np. 5000" />

              {trybWprowadzania === 'godzinowa' && (
                <>
                  <label>Liczba godzin w miesiącu</label>
                  <input type="number" value={godziny} onChange={(e) => setGodziny(e.target.value)} placeholder="168" />
                </>
              )}

              <label className="checkbox-label">
                <input type="checkbox" checked={ulgaMlodych} onChange={(e) => setUlgaMlodych(e.target.checked)} />
                Ulga dla młodych (do 26 lat)
              </label>

              {podglad && (
                <div className="dostepne-srodki">
                  <span>Netto miesięcznie:</span>
                  <strong className="zielony">{podglad.toFixed(2)} zł</strong>
                </div>
              )}
            </div>
            <div className="onboarding-przyciski">
              <button className="przycisk-dodaj" onClick={przejdzDalej} disabled={!podglad}>Dalej →</button>
              <button className="przycisk-pomin" onClick={() => zakoncz(true)}>Pomiń konfigurację</button>
            </div>
          </>
        )}

        {krok === 2 && (
          <>
            <h2 className="auth-tytul" style={{ fontSize: '1.4rem' }}>Stałe wydatki</h2>
            <p style={{ color: '#4a5568', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Dodaj stałe miesięczne wydatki (czynsz, internet, telefon itd.)
            </p>
            <div className="formularz">
              {staleWydatki.map((w, i) => (
                <div key={i} className="staly-wydatek-row">
                  <input
                    placeholder="Nazwa (np. Czynsz)"
                    value={w.nazwa}
                    onChange={(e) => {
                      const nowe = [...staleWydatki];
                      nowe[i].nazwa = e.target.value;
                      setStaleWydatki(nowe);
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Kwota (zł)"
                    value={w.kwota}
                    onChange={(e) => {
                      const nowe = [...staleWydatki];
                      nowe[i].kwota = e.target.value;
                      setStaleWydatki(nowe);
                    }}
                  />
                  {staleWydatki.length > 1 && (
                    <button className="przycisk-usun" onClick={() => setStaleWydatki(staleWydatki.filter((_, j) => j !== i))}>✕</button>
                  )}
                </div>
              ))}
              <button
                className="przycisk-harmonogram"
                onClick={() => setStaleWydatki([...staleWydatki, { nazwa: '', kwota: '' }])}
              >
                + Dodaj kolejny wydatek
              </button>
              <div className="dostepne-srodki">
                <span>Suma stałych wydatków:</span>
                <strong>{staleWydatki.reduce((acc, w) => acc + (parseFloat(w.kwota) || 0), 0).toFixed(2)} zł</strong>
              </div>
            </div>
            <div className="onboarding-przyciski">
              <button className="przycisk-dodaj" onClick={przejdzDalej}>Dalej →</button>
              <button className="przycisk-pomin" onClick={() => zakoncz(true)}>Pomiń</button>
            </div>
          </>
        )}

        {krok === 3 && (
          <>
            <h2 className="auth-tytul" style={{ fontSize: '1.4rem' }}>Pierwszy cel oszczędnościowy</h2>
            <p style={{ color: '#4a5568', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Opcjonalnie — możesz dodać to później.
            </p>
            <div className="formularz">
              <label>Nazwa celu</label>
              <input value={celNazwa} onChange={(e) => setCelNazwa(e.target.value)} placeholder="np. Nowy laptop" />
              <label>Kwota docelowa (zł)</label>
              <input type="number" value={celKwota} onChange={(e) => setCelKwota(e.target.value)} placeholder="np. 3000" />
            </div>
            <div className="onboarding-przyciski">
              <button className="przycisk-dodaj" onClick={() => zakoncz(false)}>Zakończ konfigurację</button>
              <button className="przycisk-pomin" onClick={() => zakoncz(true)}>Pomiń</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Onboarding;