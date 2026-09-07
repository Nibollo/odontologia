import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className="eyebrow">Plataforma Clinica</span>
          <h1 className={styles.title}>Gestion odontologica con presencia profesional.</h1>
          <p className={styles.subtitle}>
            Un entorno para agenda, pacientes, equipo y documentacion clinica pensado para consultorios que necesitan orden, velocidad y una experiencia visual de nivel premium.
          </p>
          <div className={styles.actions}>
            <Link href="/login" className="btn-primary">Iniciar sesion</Link>
            <Link href="/register" className="btn-secondary">Registrar clinica</Link>
          </div>
          <div className={styles.proofGrid}>
            <div className={styles.proofCard}>
              <div className={styles.proofValue}>Historia</div>
              <div className={styles.proofLabel}>Seguimiento centralizado del paciente y la evolucion clinica.</div>
            </div>
            <div className={styles.proofCard}>
              <div className={styles.proofValue}>Agenda</div>
              <div className={styles.proofLabel}>Turnos, disponibilidad del equipo y control operativo del dia.</div>
            </div>
            <div className={styles.proofCard}>
              <div className={styles.proofValue}>Equipo</div>
              <div className={styles.proofLabel}>Gestion de roles y trabajo coordinado para clinicas en crecimiento.</div>
            </div>
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Pensado para recepcion y doctores</div>
            <p className={styles.infoCopy}>Una interfaz clara, sobria y elegante para operar rapido sin perder contexto clinico.</p>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>01</span>
                <span>Ficha de paciente mas ordenada y lista para odontograma avanzado.</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>02</span>
                <span>Paneles y tablas consistentes para que todo el producto se sienta unificado.</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>03</span>
                <span>Base visual lista para seguir construyendo laboratorio, tratamientos y evolucion.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
