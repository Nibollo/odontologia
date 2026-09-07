'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ui from '../admin-ui.module.css';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPatients(data);
        }
        setLoading(false);
      });
  }, []);

  const filteredPatients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return patients;
    return patients.filter((patient) =>
      `${patient.firstName} ${patient.lastName} ${patient.phone ?? ''}`.toLowerCase().includes(normalized),
    );
  }, [patients, query]);

  return (
    <div className={ui.page}>
      <section className={`${ui.hero} ${ui.heroCompact}`}>
        <div className={ui.heroText}>
          <span className="eyebrow">Pacientes</span>
          <h1 className={ui.heroTitle}>Base clinica ordenada y facil de recorrer.</h1>
          <p className={ui.heroDescription}>
            Encuentra rapido a cada paciente, entra a su ficha y mantén la operacion del consultorio bajo control.
          </p>
        </div>
        <div className={ui.heroActions}>
          <Link href="/patients/new" className="btn-primary">Nuevo paciente</Link>
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.panelHeader}>
          <div>
            <div className={ui.panelTitle}>Listado de pacientes</div>
            <div className={ui.panelCopy}>Busqueda simple y acceso directo a la ficha clinica.</div>
          </div>
        </div>

        <div className={ui.toolbar}>
          <div className={ui.searchWrap}>
            <span className={ui.searchIcon}>⌕</span>
            <input
              className={`input-base ${ui.searchInput}`}
              placeholder="Buscar por nombre o telefono"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className={ui.tableWrap} style={{ marginTop: '1rem' }}>
          {loading ? (
            <div className={ui.emptyState}>Cargando pacientes...</div>
          ) : filteredPatients.length === 0 ? (
            <div className={ui.emptyState}>No encontramos pacientes con ese criterio.</div>
          ) : (
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className={ui.rowTitle}>{patient.firstName} {patient.lastName}</div>
                      <div className={ui.rowMuted}>ID {patient.id.slice(-8).toUpperCase()}</div>
                    </td>
                    <td className={ui.rowMuted}>{patient.phone || 'Sin telefono cargado'}</td>
                    <td><span className={ui.badge} style={{ background: 'rgba(15, 118, 110, 0.12)', color: 'var(--primary)' }}>Activo</span></td>
                    <td><Link href={`/patients/${patient.id}`} className={ui.listAction}>Ver ficha</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
