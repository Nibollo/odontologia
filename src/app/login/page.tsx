'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError(data.error || 'Autenticacion fallida');
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div>
          <span className={`eyebrow ${styles.eyebrow}`}>Acceso Clinico</span>
          <h1 className={styles.heroTitle}>Controla tu clinica con una interfaz mas seria y clara.</h1>
          <p className={styles.heroCopy}>
            Organiza pacientes, equipo, agenda y ficha clinica desde un entorno visual pulido, pensado para recepcion y odontologos.
          </p>
          <div className={styles.heroGrid}>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>01</div>
              <div className={styles.heroStatLabel}>Agenda y panel de trabajo del dia</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>02</div>
              <div className={styles.heroStatLabel}>Pacientes y documentacion centralizada</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>03</div>
              <div className={styles.heroStatLabel}>Base ideal para evolucion odontologica</div>
            </div>
          </div>
        </div>

        <div className={styles.heroFooter}>
          <div className={styles.heroFooterCard}>
            <div className={styles.heroFooterTitle}>Flujo profesional</div>
            <div className={styles.heroFooterCopy}>Recepcion, doctor y seguimiento clinico dentro del mismo sistema.</div>
          </div>
          <div className={styles.heroFooterCard}>
            <div className={styles.heroFooterTitle}>Interfaz consistente</div>
            <div className={styles.heroFooterCopy}>La experiencia visual acompana el nivel de detalle que exige una clinica real.</div>
          </div>
        </div>
      </section>

      <div className={styles.panel}>
        <form onSubmit={handleSubmit} className={styles.card}>
          <div className={styles.kicker}>Ingreso</div>
          <h1 className={styles.title}>Bienvenido de nuevo</h1>
          <p className={styles.subtitle}>Inicia sesion para acceder al panel operativo de tu clinica.</p>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" className="input-base" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@clinica.com" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contrasena</label>
              <input type="password" className="input-base" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu clave" />
            </div>
            <button type="submit" className={`btn-primary ${styles.submit}`}>Ingresar al panel</button>
          </div>

          <p className={styles.footerText}>
            No tienes cuenta? <Link href="/register" className={styles.link}>Registrar clinica</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
