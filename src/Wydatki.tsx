import { useState, useEffect, useRef } from 'react';

type Wydatek = {
  id: number;
  nazwa: string;
  kwota: number;
  kategoria: string;
  data: string;
  staly: boolean;
};

const DOMYSLNE_KATEGORIE: { value: string; label: string; kolor: string }[] = [
  { value: 'jedzenie', label: 'Jedzenie', kolor: 'hsl(38,92%,60%)' },
  { value: 'transport', label: 'Transport', kolor: 'hsl(217,91%,60%)' },
  { value: 'mieszkanie', label: 'Mieszkanie', kolor: 'hsl(270,70%,65%)' },
  { value: 'rozrywka', label: 'Rozrywka', kolor: 'hsl(330,80%,65%)' },
  { value: 'zdrowie', label: 'Zdrowie', kolor: 'hsl(142,71%,55%)' },
  { value: 'inne', label: 'Inne', kolor: 'hsl(240,5%,55%)' },
];

const KOLORY_CUSTOM = [
  'hsl(0,72%,60%)', 'hsl(25,90%,60%)', 'hsl(55,85%,55%)',
  'hsl(180,60%,50%)', 'hsl(200,80%,60%)', 'hsl(300,60%,65%)',
];

const NAZWY_MIESIECY = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
];

const API = 'http://localhost:5000/api';
function getToken() { return localStorage.getItem('token') || ''; }

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

function getKolor(kat: string, wszystkie: { value: string; kolor: string }[]) {
  return wszystkie.find(k => k.value === kat)?.kolor ?? 'hsl(240,5%,55%)';
}

function getLabel(kat: string, wszystkie: { value: string; label: string }[]) {
  return wszystkie.find(k => k.value === kat)?.label ?? kat;
}

function KategoriaDropdown({
  value, onChange, kategorie, onDodajKategorie,
}: {
  value: string;
  onChange: (v: string) => void;
  kategorie: { value: string; label: string; kolor: string }[];
  onDodajKategorie: (nazwa: string, kolor: string) => void;
}) {
  const [otwarty, setOtwarty] = useState(false);
  const [nowaKat, setNowaKat] = useState('');
  const [wybranyKolor, setWybranyKolor] = useState(KOLORY_CUSTOM[0]);
  const [tryb, setTryb] = useState<'lista' | 'nowa'>('lista');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOtwarty(false);
        setTryb('lista');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const aktualnaKat = kategorie.find(k => k.value === value);

  const dodaj = () => {
    if (!nowaKat.trim()) return;
    onDodajKategorie(nowaKat.trim(), wybranyKolor);
    onChange(nowaKat.trim().toLowerCase().replace(/\s+/g, '_'));
    setNowaKat('');
    setOtwarty(false);
    setTryb('lista');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOtwarty(!otwarty)}
        style={{
          ...inputStyle,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          cursor: 'pointer', textAlign: 'left',
          border: `1px solid ${otwarty ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)'}`,
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: aktualnaKat?.kolor ?? 'hsl(240,5%,55%)', flexShrink: 0 }} />
        <span style={{ flex: 1, color: 'hsl(0,0%,98%)' }}>{aktualnaKat?.label ?? value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(240,5%,50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: otwarty ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {otwarty && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'hsl(240,6%,9%)', border: '1px solid hsl(240,4%,16%)', borderRadius: '10px',
          overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {tryb === 'lista' ? (
            <>
              <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {kategorie.map(k => (
                  <button key={k.value} type="button"
                    onClick={() => { onChange(k.value); setOtwarty(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                      padding: '0.625rem 0.875rem',
                      background: value === k.value ? 'hsl(240,6%,14%)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (value !== k.value) e.currentTarget.style.background = 'hsl(240,6%,12%)'; }}
                    onMouseLeave={e => { if (value !== k.value) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: k.kolor, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: value === k.value ? 'hsl(0,0%,98%)' : 'hsl(240,5%,75%)' }}>{k.label}</span>
                    {value === k.value && (
                      <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(217,91%,60%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ borderTop: '1px solid hsl(240,4%,13%)', padding: '0.375rem' }}>
                <button type="button" onClick={() => setTryb('nowa')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'hsl(240,6%,12%)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(217,91%,60%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span style={{ fontSize: '0.8125rem', color: 'hsl(217,91%,60%)', fontWeight: 500 }}>Nowa kategoria</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button type="button" onClick={() => setTryb('lista')}
                  style={{ background: 'transparent', border: 'none', color: 'hsl(240,5%,55%)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'hsl(0,0%,85%)' }}>Nowa kategoria</span>
              </div>
              <input
                autoFocus
                value={nowaKat}
                onChange={e => setNowaKat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && dodaj()}
                placeholder="Nazwa kategorii..."
                style={{ ...inputStyle, marginBottom: '0.625rem' }}
              />
              <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem' }}>
                {KOLORY_CUSTOM.map(k => (
                  <button key={k} type="button" onClick={() => setWybranyKolor(k)}
                    style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: k,
                      border: 'none', cursor: 'pointer',
                      outline: wybranyKolor === k ? '2px solid hsl(0,0%,80%)' : '2px solid transparent',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
              <button type="button" onClick={dodaj} disabled={!nowaKat.trim()}
                style={{
                  width: '100%', padding: '0.5rem',
                  background: nowaKat.trim() ? 'hsl(217,91%,60%)' : 'hsl(240,6%,12%)',
                  border: 'none', borderRadius: '6px', color: '#fff',
                  fontSize: '0.8125rem', fontWeight: 500,
                  cursor: nowaKat.trim() ? 'pointer' : 'not-allowed',
                  opacity: nowaKat.trim() ? 1 : 0.5,
                }}
              >
                Dodaj kategorię
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Wydatki() {
  const now = new Date();
  const [wydatki, setWydatki] = useState<Wydatek[]>([]);
  const [nazwa, setNazwa] = useState('');
  const [kwota, setKwota] = useState('');
  const [kategoria, setKategoria] = useState('inne');
  const [data, setData] = useState(now.toISOString().split('T')[0]);
  const [staly, setStaly] = useState(false);
  const [filtrRok, setFiltrRok] = useState(now.getFullYear());
  const [filtrMiesiac, setFiltrMiesiac] = useState(now.getMonth() + 1);
  const [filtrWszystko, setFiltrWszystko] = useState(false);
  const [pokazFormularz, setPokazFormularz] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [kategorie, setKategorie] = useState(DOMYSLNE_KATEGORIE);
  const [dataRejestracji, setDataRejestracji] = useState<Date>(
    new Date(now.getFullYear() - 1, now.getMonth(), 1)
  );

  useEffect(() => {
    fetch(`${API}/profil`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(dane => {
        if (dane.created_at) setDataRejestracji(new Date(dane.created_at));
      });
  }, []);

  useEffect(() => {
    let url = `${API}/wydatki`;
    if (!filtrWszystko) url += `?rok=${filtrRok}&miesiac=${filtrMiesiac}`;
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(setWydatki);
  }, [filtrRok, filtrMiesiac, filtrWszystko]);

  const generujMiesiace = () => {
    const lista = [];
    const start = new Date(dataRejestracji.getFullYear(), dataRejestracji.getMonth(), 1);
    const koniec = new Date(now.getFullYear(), now.getMonth(), 1);
    const cursor = new Date(start);
    while (cursor <= koniec) {
      lista.push({ rok: cursor.getFullYear(), miesiac: cursor.getMonth() + 1 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return lista.reverse();
  };

  const dostepneMiesiace = generujMiesiace();

  const dodajWydatek = async () => {
    if (!nazwa || !kwota) return;
    const odpowiedz = await fetch(`${API}/wydatki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ nazwa, kwota: parseFloat(kwota), kategoria, data, staly }),
    });
    const nowy = await odpowiedz.json();
    setWydatki([nowy, ...wydatki]);
    setNazwa(''); setKwota(''); setStaly(false);
    setPokazFormularz(false);
  };

  const usunWydatek = async (id: number) => {
    await fetch(`${API}/wydatki/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    setWydatki(wydatki.filter(w => w.id !== id));
  };

  const dodajKategorie = (nazwa: string, kolor: string) => {
    const value = nazwa.toLowerCase().replace(/\s+/g, '_');
    if (kategorie.find(k => k.value === value)) return;
    setKategorie([...kategorie, { value, label: nazwa, kolor }]);
  };

  const suma = wydatki.reduce((acc, w) => acc + Number(w.kwota), 0);

  const katZWydatkow = wydatki
    .map(w => w.kategoria)
    .filter((k, i, arr) => arr.indexOf(k) === i && !kategorie.find(kat => kat.value === k))
    .map((k, i) => ({ value: k, label: k, kolor: KOLORY_CUSTOM[i % KOLORY_CUSTOM.length] }));
  const wszystkieKategorie = [...kategorie, ...katZWydatkow];

  const sumaPoKategorii = wszystkieKategorie.map(kat => ({
    ...kat,
    suma: wydatki.filter(w => w.kategoria === kat.value).reduce((acc, w) => acc + Number(w.kwota), 0),
  })).filter(k => k.suma > 0);

  const focusStyle = (field: string): React.CSSProperties => ({
    borderColor: focusedField === field ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
  });

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Nagłówek */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>Wydatki</h1>
          <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)', marginTop: '0.25rem' }}>
            {filtrWszystko ? 'Wszystkie wydatki' : `${NAZWY_MIESIECY[filtrMiesiac - 1]} ${filtrRok}`}
          </p>
        </div>
        <button
          onClick={() => setPokazFormularz(!pokazFormularz)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: pokazFormularz ? 'hsl(240,6%,10%)' : 'hsl(217,91%,60%)',
            border: pokazFormularz ? '1px solid hsl(240,4%,16%)' : 'none',
            borderRadius: '8px', color: '#fff', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
          }}
        >
          {pokazFormularz ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Anuluj</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Dodaj wydatek</>
          )}
        </button>
      </div>

      {/* Formularz */}
      {pokazFormularz && (
        <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nazwa</label>
            <input value={nazwa} onChange={e => setNazwa(e.target.value)} placeholder="np. Biedronka"
              style={{ ...inputStyle, ...focusStyle('nazwa') }}
              onFocus={() => setFocusedField('nazwa')} onBlur={() => setFocusedField(null)} />
          </div>
          <div>
            <label style={labelStyle}>Kwota (zł)</label>
            <input type="number" value={kwota} onChange={e => setKwota(e.target.value)} placeholder="np. 50"
              style={{ ...inputStyle, ...focusStyle('kwota') }}
              onFocus={() => setFocusedField('kwota')} onBlur={() => setFocusedField(null)} />
          </div>
          <div>
            <label style={labelStyle}>Kategoria</label>
            <KategoriaDropdown
              value={kategoria}
              onChange={setKategoria}
              kategorie={wszystkieKategorie}
              onDodajKategorie={dodajKategorie}
            />
          </div>
          <div>
            <label style={labelStyle}>Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              style={{ ...inputStyle, ...focusStyle('data'), colorScheme: 'dark' }}
              onFocus={() => setFocusedField('data')} onBlur={() => setFocusedField(null)} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'hsl(240,5%,65%)' }}>
              <input type="checkbox" checked={staly} onChange={e => setStaly(e.target.checked)} style={{ accentColor: 'hsl(217,91%,60%)' }} />
              Stały wydatek (czynsz, abonament)
            </label>
            <button onClick={dodajWydatek}
              style={{ padding: '0.5rem 1.25rem', background: 'hsl(217,91%,60%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              Dodaj
            </button>
          </div>
        </div>
      )}

      {/* Filtr miesięcy */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'hsl(240,5%,55%)', cursor: 'pointer' }}>
            <input type="checkbox" checked={filtrWszystko} onChange={e => setFiltrWszystko(e.target.checked)} style={{ accentColor: 'hsl(217,91%,60%)' }} />
            Wszystkie miesiące
          </label>
        </div>
        {!filtrWszystko && (
          <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {dostepneMiesiace.map(({ rok, miesiac }) => {
              const aktywny = rok === filtrRok && miesiac === filtrMiesiac;
              return (
                <button
                  key={`${rok}-${miesiac}`}
                  onClick={() => { setFiltrRok(rok); setFiltrMiesiac(miesiac); }}
                  style={{
                    padding: '0.375rem 0.875rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: aktywny ? 600 : 400,
                    cursor: 'pointer',
                    border: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: aktywny ? 'hsl(217,91%,60%)' : 'hsl(240,6%,10%)',
                    color: aktywny ? '#fff' : 'hsl(240,5%,60%)',
                    transition: 'all 0.15s',
                  }}
                >
                  {NAZWY_MIESIECY[miesiac - 1].slice(0, 3)} {rok}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {wydatki.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          {/* Lista wydatków */}
          <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', overflow: 'hidden' }}>
            {wydatki.map((w, i) => (
              <div key={w.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1.25rem',
                borderBottom: i < wydatki.length - 1 ? '1px solid hsl(240,4%,11%)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '3px', height: '32px', borderRadius: '999px', background: getKolor(w.kategoria, wszystkieKategorie), flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'hsl(0,0%,98%)' }}>{w.nazwa}</span>
                      {w.staly && (
                        <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', background: 'hsl(217,60%,15%)', color: 'hsl(217,91%,70%)', borderRadius: '999px', fontWeight: 500 }}>
                          Stały
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(240,5%,45%)' }}>
                      {getLabel(w.kategoria, wszystkieKategorie)} · {w.data?.toString().split('T')[0]}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(0,72%,60%)' }}>
                    -{Number(w.kwota).toFixed(2)} zł
                  </span>
                  <button onClick={() => usunWydatek(w.id)}
                    style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: '6px', color: 'hsl(240,5%,40%)', cursor: 'pointer', fontSize: '14px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'hsl(0,60%,15%)'; e.currentTarget.style.color = 'hsl(0,72%,60%)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(240,5%,40%)'; }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid hsl(240,4%,13%)', display: 'flex', justifyContent: 'space-between', background: 'hsl(240,6%,6%)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,55%)' }}>Łącznie</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'hsl(0,0%,98%)' }}>{suma.toFixed(2)} zł</span>
            </div>
          </div>

          {/* Podział na kategorie */}
          <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(240,5%,55%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Według kategorii
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {sumaPoKategorii.map(k => (
                <div key={k.value}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(0,0%,85%)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: k.kolor, display: 'inline-block' }} />
                      {k.label}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'hsl(240,5%,65%)' }}>{k.suma.toFixed(2)} zł</span>
                  </div>
                  <div style={{ height: '3px', background: 'hsl(240,4%,13%)', borderRadius: '999px' }}>
                    <div style={{ height: '100%', width: `${Math.round((k.suma / suma) * 100)}%`, background: k.kolor, borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'hsl(240,6%,7%)', border: '1px solid hsl(240,4%,13%)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,45%)' }}>Brak wydatków w wybranym okresie</p>
        </div>
      )}
    </div>
  );
}

export default Wydatki;