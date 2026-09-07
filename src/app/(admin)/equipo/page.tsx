'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ui from '../admin-ui.module.css';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function roleName(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'DENTIST':
      return 'Odontologo';
    case 'ASSISTANT':
      return 'Asistente';
    default:
      return role;
  }
}

function roleClass(role: string) {
  switch (role) {
    case 'ADMIN':
      return `${ui.badge} ${ui.badgeAdmin}`;
    case 'DENTIST':
      return `${ui.badge} ${ui.badgeDentist}`;
    case 'ASSISTANT':
      return `${ui.badge} ${ui.badgeAssistant}`;
    default:
      return ui.badge;
  }
}

export default function Equipo() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className={ui.page}>
      <section className={`${ui.hero} ${ui.heroCompact}`}>
        <div className={ui.heroText}>
          <span className="eyebrow">Equipo</span>
          <h1 className={ui.heroTitle}>Roles claros para una operacion mas ordenada.</h1>
          <p className={ui.heroDescription}>
            Administra personal, diferencia permisos y mantén una estructura interna mas profesional para la clinica.
          </p>
        </div>
        <div className={ui.heroActions}>
          <Link href="/equipo/new" className="btn-primary">Anadir empleado</Link>
        </div>
      </section>

      <section className={ui.panel}>
        <div className={ui.panelHeader}>
          <div>
            <div className={ui.panelTitle}>Directorio del equipo</div>
            <div className={ui.panelCopy}>Vista limpia de usuarios, correos y roles de trabajo.</div>
          </div>
        </div>

        <div className={ui.tableWrap}>
          {loading ? (
            <div className={ui.emptyState}>Cargando personal...</div>
          ) : users.length === 0 ? (
            <div className={ui.emptyState}>No hay otros usuarios registrados en esta clinica.</div>
          ) : (
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={ui.rowTitle}>{user.name}</div>
                      <div className={ui.rowMuted}>Miembro activo del equipo</div>
                    </td>
                    <td className={ui.rowMuted}>{user.email}</td>
                    <td><span className={roleClass(user.role)}>{roleName(user.role)}</span></td>
                    <td><button className="btn-secondary">Editar</button></td>
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
