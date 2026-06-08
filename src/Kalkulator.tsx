import React, { useState } from 'react';

type TypUmowy = 'uop' | 'zlecenie' | 'b2b';
type TypB2B = 'liniowy' | 'ryczalt';
type TypZUSB2B = 'normalny' | 'preferencyjny' | 'ulga_na_start';
type TrybWprowadzania = 'miesiac_brutto' | 'miesiac_netto' | 'godzinowa' | 'roczna_brutto' | 'roczna_netto';

const ZUS_PRAC = { emerytalna: 0.0976, rentowa: 0.015, chorobowa: 0.0245 };
const ZUS_B2B_NORMALNY = 1648;
const ZUS_B2B_PREFERENCYJNY = 403;
const KWOTA_WOLNA = 30000 / 12;
const ULGA_MIESIECZNA = KWOTA_WOLNA * 0.12;
const KOSZTY_UOP = 250;

const STAWKI_RYCZALTU = [
  { label: 'IT / programowanie (12%)', value: 0.12 },
  { label: 'Wolne zawody (17%)', value: 0.17 },
  { label: 'Usługi (8.5%)', value: 0.085 },
  { label: 'Usługi techniczne (5.5%)', value: 0.055 },
  { label: 'Handel (3%)', value: 0.03 },
];

type Skladka = { nazwa: string; kwota: number };
type Wynik = { netto: number; brutto: number; skladki: Skladka[]; uwagi: string[] };

function obliczUoP(brutto: number, ulgaMlodych: boolean): Wynik {
  const em = brutto * ZUS_PRAC.emerytalna;
  const ren = brutto * ZUS_PRAC.rentowa;
  const cho = brutto * ZUS_PRAC.chorobowa;
  const zusSum = em + ren + cho;
  const zdrowotna = (brutto - zusSum) * 0.09;
  let podatek = 0;
  if (!ulgaMlodych) {
    const podstawa = Math.max(brutto - zusSum - KOSZTY_UOP, 0);
    podatek = Math.max(podstawa * 0.12 - ULGA_MIESIECZNA, 0);
  }
  const netto = brutto - zusSum - zdrowotna - podatek;
  return {
    netto, brutto,
    skladki: [
      { nazwa: 'Emerytalna (9.76%)', kwota: em },
      { nazwa: 'Rentowa (1.5%)', kwota: ren },
      { nazwa: 'Chorobowa (2.45%)', kwota: cho },
      { nazwa: 'Zdrowotna (9%)', kwota: zdrowotna },
      { nazwa: 'Zaliczka PIT (12%)', kwota: podatek },
    ],
    uwagi: ulgaMlodych ? ['Ulga dla młodych aktywna — brak PIT do limitu 85 528 zł/rok'] : [],
  };
}

function obliczZlecenie(brutto: number, studentDoLat26: boolean): Wynik {
  if (studentDoLat26) {
    return { netto: brutto, brutto, skladki: [], uwagi: ['Student lub osoba do 26 lat — brak ZUS i brak PIT'] };
  }
  const em = brutto * ZUS_PRAC.emerytalna;
  const ren = brutto * ZUS_PRAC.rentowa;
  const cho = brutto * ZUS_PRAC.chorobowa;
  const zusSum = em + ren + cho;
  const zdrowotna = (brutto - zusSum) * 0.09;
  const koszty = brutto * 0.2;
  const podatek = Math.max((brutto - zusSum - koszty) * 0.12 - ULGA_MIESIECZNA, 0);
  const netto = brutto - zusSum - zdrowotna - podatek;
  return {
    netto, brutto,
    skladki: [
      { nazwa: 'Emerytalna (9.76%)', kwota: em },
      { nazwa: 'Rentowa (1.5%)', kwota: ren },
      { nazwa: 'Chorobowa (2.45%)', kwota: cho },
      { nazwa: 'Zdrowotna (9%)', kwota: zdrowotna },
      { nazwa: 'Zaliczka PIT (12%)', kwota: podatek },
    ],
    uwagi: [],
  };
}

function obliczB2BLiniowy(brutto: number, typZUS: TypZUSB2B): Wynik {
  const zus = typZUS === 'normalny' ? ZUS_B2B_NORMALNY : typZUS === 'preferencyjny' ? ZUS_B2B_PREFERENCYJNY : 0;
  const dochod = Math.max(brutto - zus, 0);
  const zdrowotna = Math.max(dochod * 0.049, 229);
  const odliczenieZdrowotnej = Math.min(zdrowotna, 850);
  const podstawaPodatku = Math.max(dochod - odliczenieZdrowotnej, 0);
  const podatek = podstawaPodatku * 0.19;
  const netto = brutto - zus - zdrowotna - podatek;
  return {
    netto, brutto,
    skladki: [
      ...(zus > 0 ? [{ nazwa: `ZUS (${typZUS})`, kwota: zus }] : []),
      { nazwa: 'Składka zdrowotna (4.9%)', kwota: zdrowotna },
      { nazwa: 'Podatek liniowy (19%)', kwota: podatek },
    ],
    uwagi: [typZUS === 'ulga_na_start' ? 'Ulga na start — brak składek ZUS przez pierwsze 6 miesięcy' : typZUS === 'preferencyjny' ? 'ZUS preferencyjny — pierwsze 2 lata działalności' : 'ZUS normalny'],
  };
}

function obliczB2BRyczalt(brutto: number, typZUS: TypZUSB2B, stawka: number): Wynik {
  const zus = typZUS === 'normalny' ? ZUS_B2B_NORMALNY : typZUS === 'preferencyjny' ? ZUS_B2B_PREFERENCYJNY : 0;
  const zdrowotna = brutto < 5000 ? 462 : brutto < 25000 ? 769 : 1385;
  const podatek = brutto * stawka;
  const netto = brutto - zus - zdrowotna - podatek;
  return {
    netto, brutto,
    skladki: [
      ...(zus > 0 ? [{ nazwa: `ZUS (${typZUS})`, kwota: zus }] : []),
      { nazwa: 'Składka zdrowotna (ryczałtowa)', kwota: zdrowotna },
      { nazwa: `Podatek ryczałtowy (${(stawka * 100).toFixed(1)}%)`, kwota: podatek },
    ],
    uwagi: [typZUS === 'ulga_na_start' ? 'Ulga na start — brak składek ZUS przez pierwsze 6 miesięcy' : typZUS === 'preferencyjny' ? 'ZUS preferencyjny — pierwsze 2 lata działalności' : 'ZUS normalny'],
  };
}

function znajdzBrutto(
  doceloweNetto: number,
  oblicz: (brutto: number) => Wynik
): number {
  let min = doceloweNetto;
  let max = doceloweNetto * 3;
  for (let i = 0; i < 100; i++) {
    const mid = (min + max) / 2;
    const wynik = oblicz(mid);
    if (wynik.netto < doceloweNetto) {
      min = mid;
    } else {
      max = mid;
    }
  }
  return Math.round((min + max) / 2 * 100) / 100;
}

function Kalkulator() {
  const [trybWprowadzania, setTrybWprowadzania] = useState<TrybWprowadzania>('miesiac_brutto');
  const [wartosc, setWartosc] = useState('');
  const [godziny, setGodziny] = useState('168');
  const [typUmowy, setTypUmowy] = useState<TypUmowy>('uop');
  const [ulgaMlodych, setUlgaMlodych] = useState(false);
  const [studentDoLat26, setStudentDoLat26] = useState(false);
  const [typB2B, setTypB2B] = useState<TypB2B>('liniowy');
  const [typZUSB2B, setTypZUSB2B] = useState<TypZUSB2B>('normalny');
  const [stawkaRyczaltu, setStawkaRyczaltu] = useState(0.12);

  const obliczDlaTypu = (brutto: number): Wynik => {
    if (typUmowy === 'uop') return obliczUoP(brutto, ulgaMlodych);
    if (typUmowy === 'zlecenie') return obliczZlecenie(brutto, studentDoLat26);
    if (typB2B === 'liniowy') return obliczB2BLiniowy(brutto, typZUSB2B);
    return obliczB2BRyczalt(brutto, typZUSB2B, stawkaRyczaltu);
  };

  const oblicz = (): Wynik | null => {
    const val = parseFloat(wartosc);
    if (!val || val <= 0) return null;

    let brutto = val;

    if (trybWprowadzania === 'miesiac_brutto') {
      brutto = val;
    } else if (trybWprowadzania === 'miesiac_netto') {
      brutto = znajdzBrutto(val, obliczDlaTypu);
    } else if (trybWprowadzania === 'godzinowa') {
      const godz = parseFloat(godziny) || 168;
      brutto = val * godz;
    } else if (trybWprowadzania === 'roczna_brutto') {
      brutto = val / 12;
    } else if (trybWprowadzania === 'roczna_netto') {
      brutto = znajdzBrutto(val / 12, obliczDlaTypu);
    }

    const wynikMiesieczny = obliczDlaTypu(brutto);
    return wynikMiesieczny;
  };

  const wynik = oblicz();

  const labelWartosci = () => {
    switch (trybWprowadzania) {
      case 'miesiac_brutto': return 'Miesięczna brutto (zł)';
      case 'miesiac_netto': return 'Miesięczna netto (zł) — oblicz brutto';
      case 'godzinowa': return 'Stawka godzinowa brutto (zł)';
      case 'roczna_brutto': return 'Roczna brutto (zł)';
      case 'roczna_netto': return 'Roczna netto (zł) — oblicz brutto';
    }
  };

  return (
    <div className="karta">
      <h2>Kalkulator Wynagrodzeń</h2>

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
        <input
          type="number"
          value={wartosc}
          onChange={(e) => setWartosc(e.target.value)}
          placeholder="np. 5000"
        />

        {trybWprowadzania === 'godzinowa' && (
          <>
            <label>Liczba godzin w miesiącu</label>
            <input
              type="number"
              value={godziny}
              onChange={(e) => setGodziny(e.target.value)}
              placeholder="np. 168"
            />
          </>
        )}

        <label>Typ umowy</label>
        <select value={typUmowy} onChange={(e) => setTypUmowy(e.target.value as TypUmowy)}>
          <option value="uop">Umowa o pracę</option>
          <option value="zlecenie">Umowa zlecenie</option>
          <option value="b2b">B2B</option>
        </select>

        {typUmowy === 'uop' && (
          <label className="checkbox-label">
            <input type="checkbox" checked={ulgaMlodych} onChange={(e) => setUlgaMlodych(e.target.checked)} />
            Ulga dla młodych (do 26 lat, do 85 528 zł/rok)
          </label>
        )}

        {typUmowy === 'zlecenie' && (
          <label className="checkbox-label">
            <input type="checkbox" checked={studentDoLat26} onChange={(e) => setStudentDoLat26(e.target.checked)} />
            Student lub osoba do 26 lat (brak ZUS i PIT)
          </label>
        )}

        {typUmowy === 'b2b' && (
          <>
            <label>Forma opodatkowania</label>
            <select value={typB2B} onChange={(e) => setTypB2B(e.target.value as TypB2B)}>
              <option value="liniowy">Podatek liniowy (19%)</option>
              <option value="ryczalt">Ryczałt ewidencjonowany</option>
            </select>

            {typB2B === 'ryczalt' && (
              <>
                <label>Stawka ryczałtu</label>
                <select value={stawkaRyczaltu} onChange={(e) => setStawkaRyczaltu(parseFloat(e.target.value))}>
                  {STAWKI_RYCZALTU.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </>
            )}

            <label>Składki ZUS</label>
            <select value={typZUSB2B} onChange={(e) => setTypZUSB2B(e.target.value as TypZUSB2B)}>
              <option value="ulga_na_start">Ulga na start (~0 zł, pierwsze 6 mies.)</option>
              <option value="preferencyjny">Preferencyjny (~403 zł, pierwsze 2 lata)</option>
              <option value="normalny">Normalny (~1 648 zł)</option>
            </select>
          </>
        )}
      </div>

      {wynik && (
        <div className="wyniki">
          <div className="wynik-główny">
            <span>Netto na konto (miesięcznie)</span>
            <strong>{wynik.netto.toFixed(2)} zł</strong>
          </div>

          {(trybWprowadzania === 'miesiac_netto' || trybWprowadzania === 'roczna_netto' || trybWprowadzania === 'godzinowa' || trybWprowadzania === 'roczna_brutto') && (
            <div className="wynik-szczegoly" style={{ marginBottom: '1rem' }}>
              <p>Brutto miesięcznie: <span>{wynik.brutto.toFixed(2)} zł</span></p>
              <p>Brutto rocznie: <span>{(wynik.brutto * 12).toFixed(2)} zł</span></p>
              <p>Netto rocznie: <span>{(wynik.netto * 12).toFixed(2)} zł</span></p>
            </div>
          )}

          {wynik.uwagi.length > 0 && (
            <div className="uwagi">
              {wynik.uwagi.map((u, i) => <p key={i}>ℹ️ {u}</p>)}
            </div>
          )}

          <div className="wynik-szczegoly">
            {wynik.skladki.map((s, i) => (
              <p key={i}>{s.nazwa}: <span>{s.kwota.toFixed(2)} zł</span></p>
            ))}
          </div>

          <button
            className="przycisk-dodaj"
            style={{ marginTop: '1rem' }}
            onClick={async () => {
              await fetch('http://localhost:5000/api/profil', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                },
                body: JSON.stringify({ dochod_netto: Math.round(wynik.netto) }),
              });
              alert(`Zapisano ${wynik.netto.toFixed(2)} zł jako dochód netto w profilu`);
            }}
          >
            Zapisz jako dochód do profilu
          </button>
        </div>
      )}
    </div>
  );
}

export default Kalkulator;