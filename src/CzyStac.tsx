import React, { useState } from 'react';

type Tryb = 'kredyt' | 'gotowka';
type TypRat = 'rowne' | 'malejace';

type WierszHarmonogramu = {
  miesiac: number;
  rata: number;
  kapital: number;
  odsetki: number;
  pozostalo: number;
};

function obliczHarmonogramRowne(kwota: number, oprocentowanie: number, miesiaceSplaty: number): WierszHarmonogramu[] {
  const r = oprocentowanie / 12;
  const rata = (kwota * r * Math.pow(1 + r, miesiaceSplaty)) / (Math.pow(1 + r, miesiaceSplaty) - 1);
  const harmonogram: WierszHarmonogramu[] = [];
  let pozostalo = kwota;

  for (let i = 1; i <= miesiaceSplaty; i++) {
    const odsetki = pozostalo * r;
    const kapital = rata - odsetki;
    pozostalo = Math.max(pozostalo - kapital, 0);
    harmonogram.push({ miesiac: i, rata, kapital, odsetki, pozostalo });
  }
  return harmonogram;
}

function obliczHarmonogramMalejace(kwota: number, oprocentowanie: number, miesiaceSplaty: number): WierszHarmonogramu[] {
  const r = oprocentowanie / 12;
  const kapitalMiesieczny = kwota / miesiaceSplaty;
  const harmonogram: WierszHarmonogramu[] = [];
  let pozostalo = kwota;

  for (let i = 1; i <= miesiaceSplaty; i++) {
    const odsetki = pozostalo * r;
    const rata = kapitalMiesieczny + odsetki;
    pozostalo = Math.max(pozostalo - kapitalMiesieczny, 0);
    harmonogram.push({ miesiac: i, rata, kapital: kapitalMiesieczny, odsetki, pozostalo });
  }
  return harmonogram;
}

function CzyStac() {
  const [tryb, setTryb] = useState<Tryb>('kredyt');

  const [kwota, setKwota] = useState('');
  const [oprocentowanie, setOprocentowanie] = useState('8.89');
  const [okres, setOkres] = useState('360');
  const [typRat, setTypRat] = useState<TypRat>('rowne');
  const [prowizja, setProwizja] = useState('2');
  const [ubezpieczenie, setUbezpieczenie] = useState('0.03');
  const [pokazHarmonogram, setPokazHarmonogram] = useState(false);

  const [dochodNetto, setDochodNetto] = useState('');
  const [staleWydatki, setStaleWydatki] = useState('');
  const [cenaGotowka, setCenaGotowka] = useState('');

  const dostepneSrodki = parseFloat(dochodNetto || '0') - parseFloat(staleWydatki || '0');
  const maxRata = dostepneSrodki * 0.35;

  const kwotaNum = parseFloat(kwota || '0');
  const oprocentowanieNum = parseFloat(oprocentowanie || '0') / 100;
  const okresNum = parseInt(okres || '0');
  const prowizjaKwota = kwotaNum * (parseFloat(prowizja || '0') / 100);
  const kwotaZProwizja = kwotaNum + prowizjaKwota;

  const harmonogram = kwotaNum && oprocentowanieNum && okresNum
    ? typRat === 'rowne'
      ? obliczHarmonogramRowne(kwotaZProwizja, oprocentowanieNum, okresNum)
      : obliczHarmonogramMalejace(kwotaZProwizja, oprocentowanieNum, okresNum)
    : [];

  const pierwszaRata = harmonogram[0]?.rata ?? 0;
  const ubezpieczenieMiesieczne = kwotaNum * (parseFloat(ubezpieczenie || '0') / 100);
  const calkowitaMiesiecznaRata = pierwszaRata + ubezpieczenieMiesieczne;
  const lacznie = harmonogram.reduce((acc, w) => acc + w.rata, 0) + ubezpieczenieMiesieczne * okresNum;
  const laczneOdsetki = harmonogram.reduce((acc, w) => acc + w.odsetki, 0);
  const moznaWziacKredyt = calkowitaMiesiecznaRata > 0 && calkowitaMiesiecznaRata <= maxRata;

  const miesiaceNaGotowke = cenaGotowka && dostepneSrodki > 0
    ? Math.ceil(parseFloat(cenaGotowka) / dostepneSrodki)
    : null;

  return (
    <div className="karta">
      <h2>Czy mnie na to stać?</h2>

      <div className="tryb-przelacznik">
        <button className={tryb === 'kredyt' ? 'aktywny' : ''} onClick={() => setTryb('kredyt')}>Na kredyt</button>
        <button className={tryb === 'gotowka' ? 'aktywny' : ''} onClick={() => setTryb('gotowka')}>Za gotówkę</button>
      </div>

      <div className="czy-stac-siatka">
        <div>
          <h3>Twoje finanse</h3>
          <div className="formularz">
            <label>Dochód netto miesięcznie (zł)</label>
            <input type="number" value={dochodNetto} onChange={(e) => setDochodNetto(e.target.value)} placeholder="np. 5000" />
            <label>Stałe wydatki miesięcznie (zł)</label>
            <input type="number" value={staleWydatki} onChange={(e) => setStaleWydatki(e.target.value)} placeholder="np. 2000" />
            {dochodNetto && staleWydatki && (
              <div className="dostepne-srodki">
                <span>Wolne środki miesięcznie:</span>
                <strong className={dostepneSrodki > 0 ? 'zielony' : 'czerwony'}>{dostepneSrodki.toFixed(2)} zł</strong>
              </div>
            )}
          </div>
        </div>

        <div>
          {tryb === 'kredyt' && (
            <>
              <h3>Parametry kredytu</h3>
              <div className="formularz">
                <label>Kwota kredytu (zł)</label>
                <input type="number" value={kwota} onChange={(e) => setKwota(e.target.value)} placeholder="np. 300000" />

                <label>Oprocentowanie roczne (%)</label>
                <input type="number" value={oprocentowanie} onChange={(e) => setOprocentowanie(e.target.value)} placeholder="np. 8.89" step="0.01" />

                <label>Okres spłaty</label>
                <select value={okres} onChange={(e) => setOkres(e.target.value)}>
                  <option value="60">5 lat</option>
                  <option value="120">10 lat</option>
                  <option value="180">15 lat</option>
                  <option value="240">20 lat</option>
                  <option value="300">25 lat</option>
                  <option value="360">30 lat</option>
                </select>

                <label>Typ rat</label>
                <select value={typRat} onChange={(e) => setTypRat(e.target.value as TypRat)}>
                  <option value="rowne">Raty równe (annuitetowe)</option>
                  <option value="malejace">Raty malejące</option>
                </select>

                <label>Prowizja banku (%)</label>
                <input type="number" value={prowizja} onChange={(e) => setProwizja(e.target.value)} placeholder="np. 2" step="0.1" />

                <label>Ubezpieczenie miesięczne (% od kwoty kredytu)</label>
                <input type="number" value={ubezpieczenie} onChange={(e) => setUbezpieczenie(e.target.value)} placeholder="np. 0.03" step="0.01" />
              </div>

              {harmonogram.length > 0 && (
                <div className="wyniki">
                  <div className="wynik-główny">
                    <span>{typRat === 'rowne' ? 'Miesięczna rata' : 'Pierwsza rata'}</span>
                    <strong>{calkowitaMiesiecznaRata.toFixed(2)} zł</strong>
                  </div>
                  <div className="wynik-szczegoly">
                    {ubezpieczenieMiesieczne > 0 && (
                      <p>w tym ubezpieczenie: <span>{ubezpieczenieMiesieczne.toFixed(2)} zł/mies.</span></p>
                    )}
                    {prowizjaKwota > 0 && (
                      <p>Prowizja banku: <span>{prowizjaKwota.toFixed(2)} zł</span></p>
                    )}
                    <p>Łącznie do spłaty: <span>{lacznie.toFixed(2)} zł</span></p>
                    <p>w tym odsetki: <span>{laczneOdsetki.toFixed(2)} zł</span></p>
                    <p>w tym prowizja: <span>{prowizjaKwota.toFixed(2)} zł</span></p>
                    <p>w tym ubezpieczenie łącznie: <span>{(ubezpieczenieMiesieczne * okresNum).toFixed(2)} zł</span></p>
                  </div>

                  {dochodNetto && staleWydatki && (
                    <div className={`ocena-kredytu ${moznaWziacKredyt ? 'ocena-tak' : 'ocena-nie'}`}>
                      <strong>{moznaWziacKredyt ? '✓ Stać Cię na ten kredyt' : '✗ Rata przekracza bezpieczny limit'}</strong>
                      <p>Maksymalna bezpieczna rata: {maxRata.toFixed(2)} zł (35% wolnych środków)</p>
                    </div>
                  )}

                  <button
                    className="przycisk-harmonogram"
                    onClick={() => setPokazHarmonogram(!pokazHarmonogram)}
                  >
                    {pokazHarmonogram ? 'Ukryj harmonogram' : 'Pokaż harmonogram spłaty'}
                  </button>

                  {pokazHarmonogram && (
                    <div className="harmonogram">
                      <table>
                        <thead>
                          <tr>
                            <th>Miesiąc</th>
                            <th>Rata</th>
                            <th>Kapitał</th>
                            <th>Odsetki</th>
                            <th>Pozostało</th>
                          </tr>
                        </thead>
                        <tbody>
                          {harmonogram.map((w) => (
                            <tr key={w.miesiac}>
                              <td>{w.miesiac}</td>
                              <td>{w.rata.toFixed(2)} zł</td>
                              <td>{w.kapital.toFixed(2)} zł</td>
                              <td>{w.odsetki.toFixed(2)} zł</td>
                              <td>{w.pozostalo.toFixed(2)} zł</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tryb === 'gotowka' && (
            <>
              <h3>Zakup za gotówkę</h3>
              <div className="formularz">
                <label>Cena zakupu (zł)</label>
                <input type="number" value={cenaGotowka} onChange={(e) => setCenaGotowka(e.target.value)} placeholder="np. 50000" />
              </div>

              {miesiaceNaGotowke !== null && cenaGotowka && (
                <div className="wyniki">
                  <div className={`ocena-kredytu ${dostepneSrodki > 0 ? 'ocena-tak' : 'ocena-nie'}`}>
                    {dostepneSrodki <= 0 ? (
                      <strong>✗ Brak wolnych środków do oszczędzania</strong>
                    ) : miesiaceNaGotowke <= 1 ? (
                      <strong>✓ Stać Cię na to już teraz!</strong>
                    ) : (
                      <>
                        <strong>Czas oszczędzania: {miesiaceNaGotowke} miesięcy ({(miesiaceNaGotowke / 12).toFixed(1)} lat)</strong>
                        <p>Odkładając {dostepneSrodki.toFixed(2)} zł miesięcznie</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CzyStac;