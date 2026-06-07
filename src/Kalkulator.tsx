import React, { useState } from 'react';

type TypUmowy = 'uop' | 'b2b' | 'zlecenie';

function Kalkulator() {
  const [brutto, setBrutto] = useState('');
  const [typUmowy, setTypUmowy] = useState<TypUmowy>('uop');

  const oblicz = () => {
    const kwota = parseFloat(brutto);
    if (!kwota) return null;

    if (typUmowy === 'uop') {
      const emerytalna = kwota * 0.0976;
      const rentowa = kwota * 0.015;
      const chorobowa = kwota * 0.0245;
      const zusLacznie = emerytalna + rentowa + chorobowa;
      const podstawaZdrowotna = kwota - zusLacznie;
      const zdrowotna = podstawaZdrowotna * 0.09;
      const podstawaPodatku = kwota - zusLacznie - 300;
      const podatek = Math.max(podstawaPodatku * 0.12 - 300, 0);
      const netto = kwota - zusLacznie - zdrowotna - podatek;

      return { netto, zusLacznie, zdrowotna, podatek };
    }

    if (typUmowy === 'b2b') {
      const zus = 1600;
      const zdrowotna = kwota * 0.049;
      const podatek = (kwota - zus - zdrowotna) * 0.19;
      const netto = kwota - zus - zdrowotna - podatek;
      return { netto, zusLacznie: zus, zdrowotna, podatek };
    }

    if (typUmowy === 'zlecenie') {
      const emerytalna = kwota * 0.0976;
      const rentowa = kwota * 0.015;
      const chorobowa = kwota * 0.0245;
      const zusLacznie = emerytalna + rentowa + chorobowa;
      const zdrowotna = (kwota - zusLacznie) * 0.09;
      const podatek = (kwota - zusLacznie) * 0.5 * 0.12;
      const netto = kwota - zusLacznie - zdrowotna - podatek;
      return { netto, zusLacznie, zdrowotna, podatek };
    }

    return null;
  };

  const wynik = oblicz();

  return (
    <div className="karta">
      <h2>Kalkulator Wynagrodzeń</h2>

      <div className="formularz">
        <label>Kwota brutto (zł)</label>
        <input
          type="number"
          value={brutto}
          onChange={(e) => setBrutto(e.target.value)}
          placeholder="np. 5000"
        />

        <label>Typ umowy</label>
        <select value={typUmowy} onChange={(e) => setTypUmowy(e.target.value as TypUmowy)}>
          <option value="uop">Umowa o pracę</option>
          <option value="b2b">B2B</option>
          <option value="zlecenie">Umowa zlecenie</option>
        </select>
      </div>

      {wynik && (
        <div className="wyniki">
          <div className="wynik-główny">
            <span>Netto</span>
            <strong>{wynik.netto.toFixed(2)} zł</strong>
          </div>
          <div className="wynik-szczegoly">
            <p>ZUS: <span>{wynik.zusLacznie.toFixed(2)} zł</span></p>
            <p>Składka zdrowotna: <span>{wynik.zdrowotna.toFixed(2)} zł</span></p>
            <p>Podatek: <span>{wynik.podatek.toFixed(2)} zł</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kalkulator;