import { useState, useEffect } from 'react';

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'hsl(240,6%,10%)',
  border: '1px solid hsl(240,4%,16%)',
  borderRadius: '8px',
  color: 'hsl(0,0%,98%)',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'hsl(240,5%,55%)',
  marginBottom: '0.375rem',
  display: 'block',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'hsl(240,5%,55%)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '0.875rem',
};

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
  const [nazwaZakupu, setNazwaZakupu] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [dodanoDoCelow, setDodanoDoCelow] = useState(false);
  const [dodanoDoWydatkow, setDodanoDoWydatkow] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/profil', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then(r => r.json())
      .then(dane => {
        if (dane.dochod_netto) setDochodNetto(dane.dochod_netto.toString());
        if (dane.stale_wydatki) setStaleWydatki(dane.stale_wydatki.toString());
      });
  }, []);

  const focusStyle = (field: string): React.CSSProperties => ({
    borderColor: focusedField === field ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
  });

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

  const fmt = (n: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n);

const dodajJakoCel = async () => {
  if (!cenaGotowka) return;
  await fetch('http://localhost:5000/api/cele', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    body: JSON.stringify({
      nazwa: nazwaZakupu.trim() || 'Zakup gotówkowy',
      docelowa: parseFloat(cenaGotowka),
    }),
  });
  setDodanoDoCelow(true);
  setTimeout(() => setDodanoDoCelow(false), 3000);
};

  const dodajJakoWydatek = async () => {
    if (!calkowitaMiesiecznaRata) return;
    await fetch('http://localhost:5000/api/wydatki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: JSON.stringify({
        nazwa: 'Rata kredytu',
        kwota: Math.round(calkowitaMiesiecznaRata * 100) / 100,
        kategoria: 'mieszkanie',
        data: new Date().toISOString().split('T')[0],
        staly: true,
      }),
    });
    setDodanoDoWydatkow(true);
    setTimeout(() => setDodanoDoWydatkow(false), 3000);
  };

  const karta: React.CSSProperties = {
    background: 'hsl(240,6%,7%)',
    border: '1px solid hsl(240,4%,13%)',
    borderRadius: '12px',
    padding: '1.25rem',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Nagłówek */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>
          Czy mnie na to stać?
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)', marginTop: '0.25rem' }}>
          Sprawdź zdolność kredytową lub czas oszczędzania
        </p>
      </div>

      {/* Przełącznik trybu */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
        {[{ value: 'kredyt', label: 'Na kredyt' }, { value: 'gotowka', label: 'Za gotówkę' }].map(t => (
          <button
            key={t.value}
            onClick={() => setTryb(t.value as Tryb)}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tryb === t.value ? 'hsl(217,91%,60%)' : 'hsl(240,6%,10%)',
              color: tryb === t.value ? '#fff' : 'hsl(240,5%,65%)',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        {/* Lewa — finanse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={karta}>
            <p style={sectionTitle}>Twoje finanse</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={labelStyle}>Dochód netto miesięcznie</label>
                <input type="number" value={dochodNetto} onChange={e => setDochodNetto(e.target.value)} placeholder="np. 5000"
                  style={{ ...inputStyle, ...focusStyle('dochod') }}
                  onFocus={() => setFocusedField('dochod')} onBlur={() => setFocusedField(null)} />
              </div>
              <div>
                <label style={labelStyle}>Stałe wydatki miesięcznie</label>
                <input type="number" value={staleWydatki} onChange={e => setStaleWydatki(e.target.value)} placeholder="np. 2000"
                  style={{ ...inputStyle, ...focusStyle('wydatki') }}
                  onFocus={() => setFocusedField('wydatki')} onBlur={() => setFocusedField(null)} />
              </div>
              {dochodNetto && staleWydatki && (
                <div style={{ padding: '0.875rem', background: 'hsl(240,6%,10%)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>Wolne środki</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: dostepneSrodki >= 0 ? 'hsl(142,71%,55%)' : 'hsl(0,72%,60%)' }}>
                    {fmt(dostepneSrodki)}
                  </span>
                </div>
              )}
            </div>
          </div>

     {tryb === 'gotowka' && (
  <div style={karta}>
    <p style={sectionTitle}>Zakup za gotówkę</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <label style={labelStyle}>Nazwa zakupu</label>
        <input type="text" value={nazwaZakupu} onChange={e => setNazwaZakupu(e.target.value)} placeholder="np. Nowy laptop, Auto, Wakacje"
          style={{ ...inputStyle, ...focusStyle('nazwa') }}
          onFocus={() => setFocusedField('nazwa')} onBlur={() => setFocusedField(null)} />
      </div>
      <div>
        <label style={labelStyle}>Cena zakupu</label>
        <input type="number" value={cenaGotowka} onChange={e => setCenaGotowka(e.target.value)} placeholder="np. 50000"
          style={{ ...inputStyle, ...focusStyle('cena') }}
          onFocus={() => setFocusedField('cena')} onBlur={() => setFocusedField(null)} />
      </div>
    </div>
  </div>
)}
        </div>

        {/* Prawa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tryb === 'kredyt' && (
            <div style={karta}>
              <p style={sectionTitle}>Parametry kredytu</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Kwota kredytu</label>
                  <input type="number" value={kwota} onChange={e => setKwota(e.target.value)} placeholder="np. 300000"
                    style={{ ...inputStyle, ...focusStyle('kwota') }}
                    onFocus={() => setFocusedField('kwota')} onBlur={() => setFocusedField(null)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Oprocentowanie (%)</label>
                    <input type="number" value={oprocentowanie} onChange={e => setOprocentowanie(e.target.value)} step="0.01"
                      style={{ ...inputStyle, ...focusStyle('opr') }}
                      onFocus={() => setFocusedField('opr')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Prowizja (%)</label>
                    <input type="number" value={prowizja} onChange={e => setProwizja(e.target.value)} step="0.1"
                      style={{ ...inputStyle, ...focusStyle('prow') }}
                      onFocus={() => setFocusedField('prow')} onBlur={() => setFocusedField(null)} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Ubezpieczenie (% od kwoty/mies.)</label>
                  <input type="number" value={ubezpieczenie} onChange={e => setUbezpieczenie(e.target.value)} step="0.01"
                    style={{ ...inputStyle, ...focusStyle('ubez') }}
                    onFocus={() => setFocusedField('ubez')} onBlur={() => setFocusedField(null)} />
                </div>
                <div>
                  <label style={labelStyle}>Okres spłaty</label>
                  <select value={okres} onChange={e => setOkres(e.target.value)} style={selectStyle}>
                    <option value="60">5 lat</option>
                    <option value="120">10 lat</option>
                    <option value="180">15 lat</option>
                    <option value="240">20 lat</option>
                    <option value="300">25 lat</option>
                    <option value="360">30 lat</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Typ rat</label>
                  <select value={typRat} onChange={e => setTypRat(e.target.value as TypRat)} style={selectStyle}>
                    <option value="rowne">Raty równe (annuitetowe)</option>
                    <option value="malejace">Raty malejące</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Wyniki kredytu */}
          {tryb === 'kredyt' && harmonogram.length > 0 && (
            <>
              <div style={karta}>
                <p style={sectionTitle}>Wynik</p>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)', marginBottom: '0.25rem' }}>
                    {typRat === 'rowne' ? 'Miesięczna rata' : 'Pierwsza rata'}
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>
                    {fmt(calkowitaMiesiecznaRata)}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.875rem', borderTop: '1px solid hsl(240,4%,13%)' }}>
                  {ubezpieczenieMiesieczne > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>w tym ubezpieczenie</span>
                      <span style={{ fontSize: '0.8125rem', color: 'hsl(0,0%,80%)' }}>{fmt(ubezpieczenieMiesieczne)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>Łącznie do spłaty</span>
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(0,0%,80%)' }}>{fmt(lacznie)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>w tym odsetki</span>
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(0,72%,60%)' }}>{fmt(laczneOdsetki)}</span>
                  </div>
                  {prowizjaKwota > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>Prowizja banku</span>
                      <span style={{ fontSize: '0.8125rem', color: 'hsl(0,0%,80%)' }}>{fmt(prowizjaKwota)}</span>
                    </div>
                  )}
                </div>
              </div>

              {dochodNetto && staleWydatki && (
                <div style={{
                  padding: '1rem',
                  background: moznaWziacKredyt ? 'hsl(142,60%,8%)' : 'hsl(0,60%,8%)',
                  border: `1px solid ${moznaWziacKredyt ? 'hsl(142,60%,18%)' : 'hsl(0,60%,18%)'}`,
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={moznaWziacKredyt ? 'hsl(142,71%,55%)' : 'hsl(0,72%,60%)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {moznaWziacKredyt
                        ? <polyline points="20 6 9 17 4 12"/>
                        : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                      }
                    </svg>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: moznaWziacKredyt ? 'hsl(142,71%,55%)' : 'hsl(0,72%,60%)' }}>
                      {moznaWziacKredyt ? 'Stać Cię na ten kredyt' : 'Rata przekracza bezpieczny limit'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)', margin: 0 }}>
                    Maks. bezpieczna rata: {fmt(maxRata)} (35% wolnych środków)
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => setPokazHarmonogram(!pokazHarmonogram)}
                  style={{ padding: '0.5rem 1rem', background: 'hsl(240,6%,10%)', border: '1px solid hsl(240,4%,16%)', borderRadius: '8px', color: 'hsl(0,0%,75%)', fontSize: '0.8125rem', cursor: 'pointer' }}
                >
                  {pokazHarmonogram ? 'Ukryj harmonogram' : 'Pokaż harmonogram spłaty'}
                </button>
                <button
                  onClick={dodajJakoWydatek}
                  style={{
                    padding: '0.5rem 1rem', background: 'hsl(240,6%,10%)', border: '1px solid hsl(240,4%,16%)',
                    borderRadius: '8px', fontSize: '0.8125rem', cursor: 'pointer',
                    color: dodanoDoWydatkow ? 'hsl(142,71%,55%)' : 'hsl(0,0%,75%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                    transition: 'color 0.15s',
                  }}
                >
                  {dodanoDoWydatkow ? (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Dodano jako stały wydatek</>
                  ) : '+ Dodaj ratę jako stały wydatek'}
                </button>
              </div>
            </>
          )}

          {/* Wyniki gotówki */}
          {tryb === 'gotowka' && miesiaceNaGotowke !== null && cenaGotowka && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{
                ...karta,
                background: dostepneSrodki > 0 ? 'hsl(217,60%,8%)' : 'hsl(0,60%,8%)',
                border: `1px solid ${dostepneSrodki > 0 ? 'hsl(217,60%,18%)' : 'hsl(0,60%,18%)'}`,
              }}>
                {dostepneSrodki <= 0 ? (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(0,72%,60%)', fontWeight: 600, margin: 0 }}>
                    Brak wolnych środków do oszczędzania
                  </p>
                ) : miesiaceNaGotowke <= 1 ? (
                  <p style={{ fontSize: '0.875rem', color: 'hsl(142,71%,55%)', fontWeight: 600, margin: 0 }}>
                    Stać Cię na to już teraz!
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(217,91%,70%)', marginBottom: '0.375rem' }}>Czas oszczędzania</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: '0 0 0.375rem' }}>
                      {miesiaceNaGotowke} mies. ({(miesiaceNaGotowke / 12).toFixed(1)} lat)
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)', margin: 0 }}>
                      Odkładając {fmt(dostepneSrodki)} miesięcznie
                    </p>
                  </>
                )}
              </div>

              {dostepneSrodki > 0 && miesiaceNaGotowke > 1 && (
                <button
                  onClick={dodajJakoCel}
                  style={{
                    width: '100%', padding: '0.5rem 1rem',
                    background: 'hsl(240,6%,10%)', border: '1px solid hsl(240,4%,16%)',
                    borderRadius: '8px', fontSize: '0.8125rem', cursor: 'pointer',
                    color: dodanoDoCelow ? 'hsl(142,71%,55%)' : 'hsl(0,0%,75%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                    transition: 'color 0.15s',
                  }}
                >
                  {dodanoDoCelow ? (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Dodano jako cel oszczędnościowy</>
                  ) : '+ Dodaj jako cel oszczędnościowy'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Harmonogram */}
      {pokazHarmonogram && harmonogram.length > 0 && (
        <div style={{ ...karta, marginTop: '1rem', overflowX: 'auto' }}>
          <p style={sectionTitle}>Harmonogram spłaty</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                {['Miesiąc', 'Rata', 'Kapitał', 'Odsetki', 'Pozostało'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'hsl(240,5%,45%)', fontWeight: 500, borderBottom: '1px solid hsl(240,4%,13%)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {harmonogram.map(w => (
                <tr key={w.miesiac} style={{ borderBottom: '1px solid hsl(240,4%,10%)' }}>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(240,5%,55%)' }}>{w.miesiac}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(0,0%,90%)' }}>{w.rata.toFixed(2)} zł</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(142,71%,55%)' }}>{w.kapital.toFixed(2)} zł</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(0,72%,60%)' }}>{w.odsetki.toFixed(2)} zł</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'hsl(0,0%,80%)' }}>{w.pozostalo.toFixed(2)} zł</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CzyStac;