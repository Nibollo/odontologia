'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ui from '../admin-ui.module.css';

interface RecentAppointment {
  id: string;
  patientId: string;
  startTime: string;
  patient: {
    firstName: string;
    lastName: string;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    recentAppointments: [] as RecentAppointment[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setStats(data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className={ui.page}>
      <section className={ui.hero}>
        <div className={ui.heroText}>
          <span className="eyebrow">Centro de control</span>
          <h1 className={ui.heroTitle}>Dashboard operativo para la clinica.</h1>
          <p className={ui.heroDescription}>
            Visualiza carga de pacientes, actividad reciente y acceso rapido a la ficha clinica desde un panel mas limpio y profesional.
          </p>
          <div className={ui.heroActions}>
            <Link href="/patients" className="btn-primary">Ver pacientes</Link>
            <Link href="/agenda" className="btn-secondary">Abrir agenda</Link>
          </div>
        </div>
        <div className={ui.heroMeta}>
          <div className={ui.heroMetaCard}>
            <div className={ui.metaLabel}>Hoy</div>
            <div className={ui.metaValue}>{loading ? '...' : stats.appointmentsToday}</div>
            <div className={ui.metaCopy}>citas programadas para la jornada actual</div>
          </div>
          <div className={ui.heroMetaCard}>
            <div className={ui.metaLabel}>Base activa</div>
            <div className={ui.metaValue}>{loading ? '...' : stats.totalPatients}</div>
            <div className={ui.metaCopy}>pacientes registrados en la clinica</div>
          </div>
        </div>
      </section>

      <section className={ui.statsGrid}>
        <article className={ui.statCard}>
          <div className={ui.statLabel}>Pacientes totales</div>
          <div className={ui.statValue}>{loading ? '...' : stats.totalPatients}</div>
          <div className={ui.statFoot}>Seguimiento general de la cartera de pacientes.</div>
        </article>
        <article className={ui.statCard}>
          <div className={ui.statLabel}>Citas de hoy</div>
          <div className={ui.statValue}>{loading ? '...' : stats.appointmentsToday}</div>
          <div className={ui.statFoot}>Vista rapida del volumen operativo diario.</div>
        </article>
        <article className={ui.statCard}>
          <div className={ui.statLabel}>Estado</div>
          <div className={ui.statValue}>Listo</div>
          <div className={ui.statFoot}>La plataforma ya tiene una base visual coherente para seguir creciendo.</div>
        </article>
      </section>

      <section className={ui.panel}>
        <div className={ui.panelHeader}>
          <div>
            <div className={ui.panelTitle}>Actividad reciente</div>
            <div className={ui.panelCopy}>Ultimas citas creadas con acceso inmediato al perfil del paciente.</div>
          </div>
        </div>

        {loading ? (
          <div className={ui.emptyState}>Cargando actividad...</div>
        ) : stats.recentAppointments.length === 0 ? (
          <div className={ui.emptyState}>No hay citas para mostrar por ahora.</div>
        ) : (
          <div className={ui.list}>
            {stats.recentAppointments.map((appt) => (
              <div key={appt.id} className={ui.listItem}>
                <div>
                  <div className={ui.listTitle}>{appt.patient.firstName} {appt.patient.lastName}</div>
                  <div className={ui.listSubtitle}>
                    {new Date(appt.startTime).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <Link href={`/patients/${appt.patientId}`} className={ui.listAction}>Abrir ficha</Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
