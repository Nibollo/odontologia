'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', hint: 'Resumen' },
    { name: 'Pacientes', path: '/patients', hint: 'Historia' },
    { name: 'Agenda', path: '/agenda', hint: 'Turnos' },
    { name: 'Equipo', path: '/equipo', hint: 'Clinica' },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandKicker}>Odontologia</div>
          <div className={styles.brand}>Onix Dental Suite</div>
          <p className={styles.brandCopy}>Gestion clinica, agenda y evolucion odontologica en una sola experiencia.</p>
        </div>

        <nav className={styles.navSection}>
          <div className={styles.navLabel}>Navegacion</div>
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                {item.name}
                <span className={styles.navHint}>{item.hint}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.supportCard}>
            <div className={styles.supportTitle}>Estado del dia</div>
            <div className={styles.supportCopy}>Revisa agenda, pacientes pendientes y la documentacion clinica desde el panel.</div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <div className={styles.headerTitle}>Panel de gestion odontologica</div>
            <div className={styles.headerCopy}>Vista operativa para recepcion, doctores y seguimiento clinico.</div>
          </div>
          <div className={styles.headerActions}>
            <input className={`input-base ${styles.headerSearch}`} placeholder="Buscar paciente, turno o profesional" />
            <div className={styles.profileChip}>
              <span className={styles.avatar}>OA</span>
              <span className={styles.profileMeta}>
                <span className={styles.profileName}>Operador Admin</span>
                <span className={styles.profileRole}>Clinica principal</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.logoutButton}
              title="Cerrar sesión"
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
