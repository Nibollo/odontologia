'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function Register() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicName, userName, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError(data.error || 'Registration fallida');
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div>
          <span className={`eyebrow ${styles.eyebrow}`}>Alta de clinica</span>
          <h1 className={styles.heroTitle}>Configura una operacion dental que se vea y se sienta profesional.</h1>
          <p className={styles.heroCopy}>
            Crea tu espacio de trabajo para manejar equipo, turnos, pacientes y una ficha clinica con mejor presencia visual.
          </p>
          <div className={styles.heroGrid}>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>Clinica</div>
              <div className={styles.heroStatLabel}>Identidad y operacion en un panel unificado.</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>Equipo</div>
              <div className={styles.heroStatLabel}>Roles claros para administracion y asistencia.</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>Historia</div>
              <div className={styles.heroStatLabel}>Base lista para tratamientos y odontograma detallado.</div>
            </div>
          </div>
        </div>

        <div className={styles.heroFooter}>
          <div className={styles.heroFooterCard}>
            <div className={styles.heroFooterTitle}>Implementacion rapida</div>
            <div className={styles.heroFooterCopy}>Comienza con una estructura clara y despues escala a flujos mas completos.</div>
          </div>
          <div className={styles.heroFooterCard}>
            <div className={styles.heroFooterTitle}>Imagen de marca</div>
            <div className={styles.heroFooterCopy}>La herramienta transmite orden, confianza y nivel profesional desde el primer uso.</div>
          </div>
        </div>
      </section>

      <div className={styles.panel}>
        <form onSubmit={handleSubmit} className={styles.card}>
          <div className={styles.kicker}>Registro</div>
          <h1 className={styles.title}>Registra tu clinica</h1>
          <p className={styles.subtitle}>Crea una cuenta administradora para comenzar a trabajar con el panel.</p>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de clinica</label>
              <input type="text" className="input-base" required value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Clinica Dental Central" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre del responsable</label>
              <input type="text" className="input-base" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Dra. Ana Lopez" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email administrador</label>
              <input type="email" className="input-base" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@clinica.com" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contrasena</label>
              <input type="password" className="input-base" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crea una clave segura" />
            </div>
            <button type="submit" className={`btn-primary ${styles.submit}`}>Crear espacio de trabajo</button>
          </div>

          <p className={styles.footerText}>
            Ya tienes cuenta? <Link href="/login" className={styles.link}>Iniciar sesion</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
