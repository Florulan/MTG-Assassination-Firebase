import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAppCode, getAppCode } from '../lib/appCode';

export default function UnlockPage() {
  const nav = useNavigate();
  const [code, setCode] = useState('');

  useEffect(() => {
    const existing = getAppCode();
    if (existing) {
      nav('/', { replace: true });
    }
  }, [nav]);

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: '40px auto' }}>
        <h1>Déverrouiller l’app</h1>
        <p className="small">
          Entrez le code de groupe. Il sera stocké sur ce téléphone.
        </p>
        <label className="small">Code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="mtg-potes-2026"
        />
        <div style={{ height: 10 }} />
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!code.trim()) return;
            setAppCode(code);
            nav('/', { replace: true });
          }}
        >
          Entrer
        </button>
        <div style={{ marginTop: 12 }} className="small">
          Astuce: vous pouvez changer ce code à tout moment dans Firestore (config/app).
        </div>
      </div>
    </div>
  );
}
