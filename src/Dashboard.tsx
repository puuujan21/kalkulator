import { useState, useEffect } from 'react';

interface ProfilData {
  dochod_netto: number;
  stale_wydatki: number;
}

interface Wydatek {
  id: number;
  nazwa: string;
  kwota: number;
  kategoria: string;
  data: string;
}

interface Cel {
  id: number;
  nazwa: string;
  docelowa: number;
  aktualna: number;
}

const karta: React.CSSProperties = {
  background: 'hsl(240, 6%, 7%)',
  border: '1px solid hsl(240, 4%, 13%)',
  borderRadius: '12px',
  padding: '1.5rem',
};

const kartaTytul: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'hsl(240, 5%, 55%)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.5rem',
};

const kartaWartosc: React.CSSProperties = {
  fontSize: '1.875rem',
  fontWeight: 600,
  color: 'hsl(0, 0%, 98%)',
  letterSpacing: '-0.02em',
};

export default function Dashboard() {
  const [profil, setProfil] = useState<ProfilData | null>(null);
  const [wydatki, setWydatki] = useState<Wydatek[]>([]);
  const [cele, setCele] = useState<Cel[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const rok = now.getFullYear();
  const miesiac = now.getMonth() + 1;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
fetch('http://localhost:5000/api/profil', { headers }).then(r => r.json()),
fetch(`http://localhost:5000/api/wydatki?rok=${rok}&miesiac=${miesiac}`, { headers }).then(r => r.json()),
fetch('http://localhost:5000/api/cele', { headers }).then(r => r.json()),
    ]).then(([profilData, wydatkiData, celeData]) => {
      setProfil(profilData);
      setWydatki(Array.isArray(wydatkiData) ? wydatkiData : []);
      setCele(Array.isArray(celeData) ? celeData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sumaWydatkow = wydatki.reduce((s, w) => s + Number(w.kwota), 0);
  const dochodNetto = profil?.dochod_netto ?? 0;
  const staleWydatki = profil?.stale_wydatki ?? 0;
  const wolneKonto = dochodNetto - staleWydatki - sumaWydatkow;

  const formatKwota = (kwota: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(kwota);

  const nazwyMiesiecy = [
    '', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <div style={{ width: '20px', height: '20px', border: '2px solid hsl(240,4%,13%)', borderTopColor: 'hsl(217,91%,60%)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Nagłówek */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)', marginTop: '0.25rem' }}>
          {nazwyMiesiecy[miesiac]} {rok}
        </p>
      </div>

      {/* Górna siatka — 3 karty statystyk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div style={karta}>
          <p style={kartaTytul}>Dochód netto</p>
          <p style={{ ...kartaWartosc, color: 'hsl(142,71%,55%)' }}>{formatKwota(dochodNetto)}</p>
          <p style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)', marginTop: '0.5rem' }}>miesięcznie</p>
        </div>

        <div style={karta}>
          <p style={kartaTytul}>Stałe wydatki</p>
          <p style={{ ...kartaWartosc, color: 'hsl(0,72%,60%)' }}>{formatKwota(staleWydatki)}</p>
          <p style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)', marginTop: '0.5rem' }}>co miesiąc</p>
        </div>

        <div style={karta}>
          <p style={kartaTytul}>Wolne środki</p>
          <p style={{ ...kartaWartosc, color: wolneKonto >= 0 ? 'hsl(217,91%,60%)' : 'hsl(0,72%,60%)' }}>
            {formatKwota(wolneKonto)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)', marginTop: '0.5rem' }}>
            po bieżących wydatkach
          </p>
        </div>
      </div>

      {/* Dolna siatka — wydatki + cele */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Ostatnie wydatki */}
        <div style={karta}>
          <p style={{ ...kartaTytul, marginBottom: '1rem' }}>Ostatnie wydatki</p>
          {wydatki.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)' }}>Brak wydatków w tym miesiącu</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {wydatki.slice(0, 5).map(w => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'hsl(0,0%,98%)', fontWeight: 500 }}>{w.nazwa}</p>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)' }}>{w.kategoria}</p>
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'hsl(0,72%,60%)', fontWeight: 500 }}>
                    -{formatKwota(Number(w.kwota))}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid hsl(240,4%,13%)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)' }}>Suma wydatków</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(0,0%,98%)' }}>{formatKwota(sumaWydatkow)}</span>
          </div>
        </div>

        {/* Cele */}
        <div style={karta}>
          <p style={{ ...kartaTytul, marginBottom: '1rem' }}>Cele oszczędnościowe</p>
          {cele.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,55%)' }}>Brak aktywnych celów</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {cele.slice(0, 4).map(c => {
                const procent = Math.min(100, Math.round((Number(c.aktualna) / Number(c.docelowa)) * 100));
                return (
                  <div key={c.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'hsl(0,0%,98%)', fontWeight: 500 }}>{c.nazwa}</span>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(240,5%,55%)' }}>{procent}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'hsl(240,4%,13%)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${procent}%`,
                        background: 'hsl(217,91%,60%)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'hsl(240,5%,45%)', marginTop: '0.25rem' }}>
                      {formatKwota(Number(c.aktualna))} / {formatKwota(Number(c.docelowa))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}