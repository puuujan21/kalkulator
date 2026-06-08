import { useState } from 'react';

type TrybWprowadzania = 'miesiac_brutto' | 'miesiac_netto' | 'godzinowa' | 'roczna_brutto' | 'roczna_netto';
type TypUmowy = 'uop' | 'zlecenie' | 'b2b';
type TypB2B = 'liniowy' | 'ryczalt';
type TypZUSB2B = 'normalny' | 'preferencyjny' | 'ulga_na_start';

const ZUS_PRAC = { emerytalna: 0.0976, rentowa: 0.015, chorobowa: 0.0245 };
const ULGA_MIESIECZNA = (30000 / 12) * 0.12;
const KOSZTY_UOP = 250;
const ZUS_B2B_NORMALNY = 1648;
const ZUS_B2B_PREFERENCYJNY = 403;

const STAWKI_RYCZALTU = [
  { label: 'IT / programowanie (12%)', value: 0.12 },
  { label: 'Wolne zawody (17%)', value: 0.17 },
  { label: 'Usługi (8.5%)', value: 0.085 },
  { label: 'Usługi techniczne (5.5%)', value: 0.055 },
  { label: 'Handel (3%)', value: 0.03 },
];

const TRYBY: { value: TrybWprowadzania; label: string }[] = [
  { value: 'miesiac_brutto', label: 'Miesięczna brutto' },
  { value: 'miesiac_netto', label: 'Miesięczna netto' },
  { value: 'godzinowa', label: 'Stawka godzinowa' },
  { value: 'roczna_brutto', label: 'Roczna brutto' },
  { value: 'roczna_netto', label: 'Roczna netto' },
];

function obliczUoP(brutto: number, ulgaMlodych: boolean): number {
  const zusSum = brutto * (ZUS_PRAC.emerytalna + ZUS_PRAC.rentowa + ZUS_PRAC.chorobowa);
  const zdrowotna = (brutto - zusSum) * 0.09;
  const podatek = ulgaMlodych ? 0 : Math.max((brutto - zusSum - KOSZTY_UOP) * 0.12 - ULGA_MIESIECZNA, 0);
  return brutto - zusSum - zdrowotna - podatek;
}

function obliczZlecenie(brutto: number, student: boolean): number {
  if (student) return brutto;
  const zusSum = brutto * (ZUS_PRAC.emerytalna + ZUS_PRAC.rentowa + ZUS_PRAC.chorobowa);
  const zdrowotna = (brutto - zusSum) * 0.09;
  const podatek = Math.max((brutto - zusSum - brutto * 0.2) * 0.12 - ULGA_MIESIECZNA, 0);
  return brutto - zusSum - zdrowotna - podatek;
}

function obliczB2BLiniowy(brutto: number, typZUS: TypZUSB2B): number {
  const zus = typZUS === 'normalny' ? ZUS_B2B_NORMALNY : typZUS === 'preferencyjny' ? ZUS_B2B_PREFERENCYJNY : 0;
  const dochod = Math.max(brutto - zus, 0);
  const zdrowotna = Math.max(dochod * 0.049, 229);
  const podatek = Math.max(dochod - Math.min(zdrowotna, 850), 0) * 0.19;
  return brutto - zus - zdrowotna - podatek;
}

function obliczB2BRyczalt(brutto: number, typZUS: TypZUSB2B, stawka: number): number {
  const zus = typZUS === 'normalny' ? ZUS_B2B_NORMALNY : typZUS === 'preferencyjny' ? ZUS_B2B_PREFERENCYJNY : 0;
  const zdrowotna = brutto < 5000 ? 462 : brutto < 25000 ? 769 : 1385;
  return brutto - zus - zdrowotna - brutto * stawka;
}

function znajdzBrutto(doceloweNetto: number, oblicz: (b: number) => number): number {
  let min = doceloweNetto;
  let max = doceloweNetto * 3;
  for (let i = 0; i < 100; i++) {
    const mid = (min + max) / 2;
    if (oblicz(mid) < doceloweNetto) min = mid; else max = mid;
  }
  return Math.round((min + max) / 2 * 100) / 100;
}

type Props = { onUkoncz: () => void };

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  background: 'hsl(240,6%,10%)',
  border: '1px solid hsl(240,4%,16%)',
  borderRadius: '8px',
  color: 'hsl(0,0%,98%)',
  fontSize: '0.9375rem',
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

function Onboarding({ onUkoncz }: Props) {
  const [krok, setKrok] = useState(1);
  const [trybWprowadzania, setTrybWprowadzania] = useState<TrybWprowadzania>('miesiac_brutto');
  const [wartosc, setWartosc] = useState('');
  const [godziny, setGodziny] = useState('168');
  const [typUmowy, setTypUmowy] = useState<TypUmowy>('uop');
  const [ulgaMlodych, setUlgaMlodych] = useState(false);
  const [studentDoLat26, setStudentDoLat26] = useState(false);
  const [typB2B, setTypB2B] = useState<TypB2B>('liniowy');
  const [typZUSB2B, setTypZUSB2B] = useState<TypZUSB2B>('normalny');
  const [stawkaRyczaltu, setStawkaRyczaltu] = useState(0.12);
  const [nettoMiesieczne, setNettoMiesieczne] = useState<number | null>(null);
  const [staleWydatki, setStaleWydatki] = useState<{ nazwa: string; kwota: string }[]>([{ nazwa: '', kwota: '' }]);
  const [celNazwa, setCelNazwa] = useState('');
  const [celKwota, setCelKwota] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const focusStyle = (field: string): React.CSSProperties => ({
    borderColor: focusedField === field ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
  });

  const dostepneTryby = TRYBY.filter(t => {
    if (typUmowy === 'zlecenie' && studentDoLat26) {
      return t.value === 'miesiac_brutto' || t.value === 'godzinowa';
    }
    return true;
  });

  const obliczDlaTypu = (brutto: number): number => {
    if (typUmowy === 'uop') return obliczUoP(brutto, ulgaMlodych);
    if (typUmowy === 'zlecenie') return obliczZlecenie(brutto, studentDoLat26);
    if (typB2B === 'liniowy') return obliczB2BLiniowy(brutto, typZUSB2B);
    return obliczB2BRyczalt(brutto, typZUSB2B, stawkaRyczaltu);
  };

  const obliczNetto = (): number | null => {
    const val = parseFloat(wartosc);
    if (!val || val <= 0) return null;
    let brutto = val;
    if (trybWprowadzania === 'miesiac_netto') brutto = znajdzBrutto(val, obliczDlaTypu);
    else if (trybWprowadzania === 'godzinowa') brutto = val * (parseFloat(godziny) || 168);
    else if (trybWprowadzania === 'roczna_brutto') brutto = val / 12;
    else if (trybWprowadzania === 'roczna_netto') brutto = znajdzBrutto(val / 12, obliczDlaTypu);
    return obliczDlaTypu(brutto);
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
    await fetch('/api/profil/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
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
  const sumaWydatkow = staleWydatki.reduce((acc, w) => acc + (parseFloat(w.kwota) || 0), 0);
  const tytuly = ['Ile zarabiasz?', 'Stałe wydatki', 'Cel oszczędnościowy'];
  const opisy = [
    'Podaj swoje wynagrodzenie — obliczymy netto automatycznie',
    'Dodaj stałe miesięczne wydatki (czynsz, internet, subskrypcje)',
    'Opcjonalnie — możesz dodać to później w zakładce Cele',
  ];

  const btnStyle = (val: string, current: string): React.CSSProperties => ({
    padding: '0.375rem 0.625rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: current === val ? 'hsl(217,91%,60%)' : 'hsl(240,6%,12%)',
    color: current === val ? '#fff' : 'hsl(240,5%,60%)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(240,10%,3.9%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '36px', height: '36px', background: 'hsl(217,91%,60%)', borderRadius: '9px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,45%)', margin: 0 }}>Konfiguracja konta</p>
        </div>

        {/* Kroki */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {[1, 2, 3].map((k, i) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8125rem', fontWeight: 600,
                background: krok >= k ? 'hsl(217,91%,60%)' : 'hsl(240,6%,12%)',
                color: krok >= k ? '#fff' : 'hsl(240,5%,40%)',
                border: krok === k ? '2px solid hsl(217,91%,70%)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}>
                {krok > k ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : k}
              </div>
              {i < 2 && <div style={{ width: '48px', height: '2px', background: krok > k ? 'hsl(217,91%,60%)' : 'hsl(240,4%,13%)', transition: 'background 0.2s' }} />}
            </div>
          ))}
        </div>

        {/* Karta */}
        <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '16px', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: '0 0 0.375rem' }}>
            {tytuly[krok - 1]}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,45%)', margin: '0 0 1.5rem' }}>
            {opisy[krok - 1]}
          </p>

          {/* KROK 1 */}
          {krok === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              {/* Tryb wprowadzania */}
              <div>
                <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>Tryb wprowadzania</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {dostepneTryby.map(t => (
                    <button key={t.value} onClick={() => setTrybWprowadzania(t.value)} style={btnStyle(t.value, trybWprowadzania)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typ umowy */}
              <div>
                <p style={{ ...labelStyle, marginBottom: '0.5rem' }}>Typ umowy</p>
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.625rem' }}>
                  {([['uop', 'Umowa o pracę'], ['zlecenie', 'Zlecenie'], ['b2b', 'B2B']] as [TypUmowy, string][]).map(([val, label]) => (
                    <button key={val} onClick={() => setTypUmowy(val)} style={{ ...btnStyle(val, typUmowy), flex: 1 }}>
                      {label}
                    </button>
                  ))}
                </div>

                {typUmowy === 'uop' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'hsl(240,5%,65%)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={ulgaMlodych} onChange={e => setUlgaMlodych(e.target.checked)} style={{ accentColor: 'hsl(217,91%,60%)' }} />
                    Ulga dla młodych (do 26 lat)
                  </label>
                )}

                {typUmowy === 'zlecenie' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'hsl(240,5%,65%)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={studentDoLat26}
                      onChange={e => {
                        setStudentDoLat26(e.target.checked);
                        if (e.target.checked && trybWprowadzania !== 'miesiac_brutto' && trybWprowadzania !== 'godzinowa') {
                          setTrybWprowadzania('miesiac_brutto');
                        }
                      }}
                      style={{ accentColor: 'hsl(217,91%,60%)' }}
                    />
                    Student / osoba do 26 lat (brak ZUS i PIT)
                  </label>
                )}

                {typUmowy === 'b2b' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {([['liniowy', 'Liniowy 19%'], ['ryczalt', 'Ryczałt']] as [TypB2B, string][]).map(([val, label]) => (
                        <button key={val} onClick={() => setTypB2B(val)} style={{ ...btnStyle(val, typB2B), flex: 1 }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {typB2B === 'ryczalt' && (
                      <select value={stawkaRyczaltu} onChange={e => setStawkaRyczaltu(parseFloat(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {STAWKI_RYCZALTU.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    )}
                    <select value={typZUSB2B} onChange={e => setTypZUSB2B(e.target.value as TypZUSB2B)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="ulga_na_start">Ulga na start (~0 zł)</option>
                      <option value="preferencyjny">ZUS preferencyjny (~403 zł)</option>
                      <option value="normalny">ZUS normalny (~1 648 zł)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Kwota */}
              <div>
                <label style={labelStyle}>{labelWartosci()}</label>
                <input
                  type="number" value={wartosc} onChange={e => setWartosc(e.target.value)}
                  placeholder="np. 5000"
                  style={{ ...inputStyle, ...focusStyle('wartosc') }}
                  onFocus={() => setFocusedField('wartosc')} onBlur={() => setFocusedField(null)}
                />
              </div>

              {trybWprowadzania === 'godzinowa' && (
                <div>
                  <label style={labelStyle}>Godziny w miesiącu</label>
                  <input
                    type="number" value={godziny} onChange={e => setGodziny(e.target.value)}
                    placeholder="168"
                    style={{ ...inputStyle, ...focusStyle('godziny') }}
                    onFocus={() => setFocusedField('godziny')} onBlur={() => setFocusedField(null)}
                  />
                </div>
              )}

              {podglad && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: 'hsl(142,60%,8%)', border: '1px solid hsl(142,60%,16%)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)' }}>Netto miesięcznie</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(142,71%,55%)' }}>
                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(podglad)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* KROK 2 */}
          {krok === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {staleWydatki.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    placeholder="Nazwa (np. Czynsz)"
                    value={w.nazwa}
                    onChange={e => { const n = [...staleWydatki]; n[i].nazwa = e.target.value; setStaleWydatki(n); }}
                    style={{ ...inputStyle, flex: 2, ...focusStyle(`nazwa-${i}`) }}
                    onFocus={() => setFocusedField(`nazwa-${i}`)} onBlur={() => setFocusedField(null)}
                  />
                  <input
                    type="number" placeholder="Kwota" value={w.kwota}
                    onChange={e => { const n = [...staleWydatki]; n[i].kwota = e.target.value; setStaleWydatki(n); }}
                    style={{ ...inputStyle, flex: 1, ...focusStyle(`kwota-${i}`) }}
                    onFocus={() => setFocusedField(`kwota-${i}`)} onBlur={() => setFocusedField(null)}
                  />
                  {staleWydatki.length > 1 && (
                    <button
                      onClick={() => setStaleWydatki(staleWydatki.filter((_, j) => j !== i))}
                      style={{ width: '32px', height: '32px', background: 'transparent', border: 'none', color: 'hsl(240,5%,40%)', cursor: 'pointer', borderRadius: '6px', fontSize: '14px', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'hsl(0,60%,15%)'; e.currentTarget.style.color = 'hsl(0,72%,60%)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(240,5%,40%)'; }}
                    >✕</button>
                  )}
                </div>
              ))}

              <button
                onClick={() => setStaleWydatki([...staleWydatki, { nazwa: '', kwota: '' }])}
                style={{ padding: '0.5rem', background: 'transparent', border: '1px dashed hsl(240,4%,20%)', borderRadius: '8px', color: 'hsl(240,5%,50%)', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                + Dodaj kolejny wydatek
              </button>

              {sumaWydatkow > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: 'hsl(240,6%,10%)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)' }}>Suma stałych wydatków</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(0,0%,98%)' }}>
                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(sumaWydatkow)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* KROK 3 */}
          {krok === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nazwa celu</label>
                <input
                  value={celNazwa} onChange={e => setCelNazwa(e.target.value)}
                  placeholder="np. Nowy laptop, wakacje, wkład własny"
                  style={{ ...inputStyle, ...focusStyle('cel') }}
                  onFocus={() => setFocusedField('cel')} onBlur={() => setFocusedField(null)}
                />
              </div>
              <div>
                <label style={labelStyle}>Kwota docelowa (zł)</label>
                <input
                  type="number" value={celKwota} onChange={e => setCelKwota(e.target.value)}
                  placeholder="np. 3000"
                  style={{ ...inputStyle, ...focusStyle('celKwota') }}
                  onFocus={() => setFocusedField('celKwota')} onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>
          )}

          {/* Przyciski */}
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={krok < 3 ? przejdzDalej : () => zakoncz(false)}
              disabled={krok === 1 && !podglad}
              style={{
                width: '100%', padding: '0.6875rem',
                background: 'hsl(217,91%,60%)',
                border: 'none', borderRadius: '8px', color: '#fff',
                fontSize: '0.9375rem', fontWeight: 600,
                cursor: (krok === 1 && !podglad) ? 'not-allowed' : 'pointer',
                opacity: (krok === 1 && !podglad) ? 0.4 : 1,
              }}
            >
              {krok < 3 ? 'Dalej →' : 'Zakończ konfigurację'}
            </button>
            <button
              onClick={() => zakoncz(true)}
              style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: 'none', color: 'hsl(240,5%,45%)', fontSize: '0.875rem', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = 'hsl(240,5%,65%)'}
              onMouseLeave={e => e.currentTarget.style.color = 'hsl(240,5%,45%)'}
            >
              Pomiń konfigurację
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;