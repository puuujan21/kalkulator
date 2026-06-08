import { useState } from 'react';

type Tryb = 'logowanie' | 'rejestracja';

type Props = {
  onZalogowany: (token: string, uzytkownik: { id: number; email: string; imie: string }) => void;
};

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
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'hsl(240,5%,55%)',
  marginBottom: '0.375rem',
  display: 'block',
};

function Auth({ onZalogowany }: Props) {
  const [tryb, setTryb] = useState<Tryb>('logowanie');
  const [imie, setImie] = useState('');
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');
  const [blad, setBlad] = useState('');
  const [ladowanie, setLadowanie] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const focusStyle = (field: string): React.CSSProperties => ({
    borderColor: focusedField === field ? 'hsl(217,91%,60%)' : 'hsl(240,4%,16%)',
  });

  const wyslij = async () => {
    setBlad('');
    setLadowanie(true);

    const url = tryb === 'logowanie'
? '/api/auth/logowanie'
: '/api/auth/rejestracja';

    const body = tryb === 'logowanie'
      ? { email, haslo }
      : { email, haslo, imie };

    try {
      const odpowiedz = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const dane = await odpowiedz.json();
      if (!odpowiedz.ok) {
        setBlad(dane.blad || 'Wystąpił błąd');
      } else {
        localStorage.setItem('token', dane.token);
        localStorage.setItem('uzytkownik', JSON.stringify(dane.uzytkownik));
        onZalogowany(dane.token, dane.uzytkownik);
      }
    } catch {
      setBlad('Nie można połączyć się z serwerem');
    } finally {
      setLadowanie(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') wyslij();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(240,10%,3.9%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'hsl(217,91%,60%)',
            borderRadius: '10px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(0,0%,98%)', letterSpacing: '-0.02em', margin: 0 }}>
            Planer Finansowy
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'hsl(240,5%,45%)', marginTop: '0.25rem' }}>
            {tryb === 'logowanie' ? 'Zaloguj się do swojego konta' : 'Utwórz nowe konto'}
          </p>
        </div>

        {/* Karta */}
        <div style={{
          background: 'hsl(240,6%,7%)',
          border: '1px solid hsl(240,4%,13%)',
          borderRadius: '16px',
          padding: '1.75rem',
        }}>
          {/* Przełącznik trybu */}
          <div style={{
            display: 'flex',
            background: 'hsl(240,6%,10%)',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '1.5rem',
          }}>
            {(['logowanie', 'rejestracja'] as Tryb[]).map(t => (
              <button
                key={t}
                onClick={() => { setTryb(t); setBlad(''); }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s',
                  background: tryb === t ? 'hsl(240,6%,16%)' : 'transparent',
                  color: tryb === t ? 'hsl(0,0%,98%)' : 'hsl(240,5%,50%)',
                }}
              >
                {t === 'logowanie' ? 'Logowanie' : 'Rejestracja'}
              </button>
            ))}
          </div>

          {/* Formularz */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tryb === 'rejestracja' && (
              <div>
                <label style={labelStyle}>Imię</label>
                <input
                  value={imie}
                  onChange={e => setImie(e.target.value)}
                  placeholder="np. Jan"
                  style={{ ...inputStyle, ...focusStyle('imie') }}
                  onFocus={() => setFocusedField('imie')}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan@email.com"
                style={{ ...inputStyle, ...focusStyle('email') }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label style={labelStyle}>Hasło</label>
              <input
                type="password"
                value={haslo}
                onChange={e => setHaslo(e.target.value)}
                placeholder="minimum 6 znaków"
                style={{ ...inputStyle, ...focusStyle('haslo') }}
                onFocus={() => setFocusedField('haslo')}
                onBlur={() => setFocusedField(null)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {blad && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'hsl(0,60%,10%)',
                border: '1px solid hsl(0,60%,20%)',
                borderRadius: '8px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(0,72%,60%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: '0.875rem', color: 'hsl(0,72%,60%)' }}>{blad}</span>
              </div>
            )}

            <button
              onClick={wyslij}
              disabled={ladowanie}
              style={{
                width: '100%',
                padding: '0.6875rem',
                background: ladowanie ? 'hsl(217,91%,45%)' : 'hsl(217,91%,60%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: ladowanie ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
                marginTop: '0.25rem',
              }}
              onMouseEnter={e => { if (!ladowanie) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {ladowanie ? 'Ładowanie...' : tryb === 'logowanie' ? 'Zaloguj się' : 'Zarejestruj się'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;