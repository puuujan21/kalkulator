import React, { useState } from 'react';

type Tryb = 'logowanie' | 'rejestracja';

type Props = {
  onZalogowany: (token: string, uzytkownik: { id: number; email: string; imie: string }) => void;
};

function Auth({ onZalogowany }: Props) {
  const [tryb, setTryb] = useState<Tryb>('logowanie');
  const [imie, setImie] = useState('');
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');
  const [blad, setBlad] = useState('');
  const [ladowanie, setLadowanie] = useState(false);

  const wyslij = async () => {
    setBlad('');
    setLadowanie(true);

    const url = tryb === 'logowanie'
      ? 'http://localhost:5000/api/auth/logowanie'
      : 'http://localhost:5000/api/auth/rejestracja';

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

  return (
    <div className="auth-container">
      <div className="auth-karta">
        <h1 className="auth-tytul">Planer Finansowy</h1>

        <div className="tryb-przelacznik">
          <button
            className={tryb === 'logowanie' ? 'aktywny' : ''}
            onClick={() => setTryb('logowanie')}
          >
            Logowanie
          </button>
          <button
            className={tryb === 'rejestracja' ? 'aktywny' : ''}
            onClick={() => setTryb('rejestracja')}
          >
            Rejestracja
          </button>
        </div>

        <div className="formularz">
          {tryb === 'rejestracja' && (
            <>
              <label>Imię</label>
              <input
                value={imie}
                onChange={(e) => setImie(e.target.value)}
                placeholder="np. Jan"
              />
            </>
          )}
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="np. jan@email.com"
          />
          <label>Hasło</label>
          <input
            type="password"
            value={haslo}
            onChange={(e) => setHaslo(e.target.value)}
            placeholder="minimum 6 znaków"
          />

          {blad && <p className="auth-blad">{blad}</p>}

          <button className="przycisk-dodaj" onClick={wyslij} disabled={ladowanie}>
            {ladowanie ? 'Ładowanie...' : tryb === 'logowanie' ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;