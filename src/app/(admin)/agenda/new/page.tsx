'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ui from '../../admin-ui.module.css';

interface PatientOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface DentistOption {
  id: string;
  name: string;
}

export default function NewAppointment() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [dentists, setDentists] = useState<DentistOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    patientId: '',
    dentistId: '',
    date: '',
    time: '',
    duration: '60',
    notes: ''
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/dentists').then(r => r.json())
    ]).then(([patientsData, dentistsData]) => {
      if (!active) return;
      if (Array.isArray(patientsData)) setPatients(patientsData);
      if (Array.isArray(dentistsData)) {
        setDentists(dentistsData);
        if (dentistsData.length > 0) {
          setFormData(prev => ({ ...prev, dentistId: dentistsData[0].id }));
        }
      }
      setLoading(false);
    }).catch(err => {
      if (!active) return;
      console.error(err);
      setError('Error al cargar datos necesarios.');
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.patientId || !formData.date || !formData.time) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    const startDateTime = new Date(`${formData.date}T${formData.time}`);
    const durationMinutes = parseInt(formData.duration);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: formData.patientId,
        dentistId: formData.dentistId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: formData.notes
      }),
    });

    if (res.ok) {
      router.push('/agenda');
    } else {
      const data = await res.json();
      setError(data.error || 'No se pudo agendar la cita.');
    }
  };

  return (
    <div className={ui.page}>
      <section className={ui.hero}>
        <div className={ui.heroText}>
          <Link href="/agenda" className={ui.backLink} style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--text-soft)', fontSize: '0.9rem' }}>
            ← Volver a la Agenda
          </Link>
          <span className="eyebrow">Agendamiento</span>
          <h1 className={ui.heroTitle}>Nueva cita clínica.</h1>
          <p className={ui.heroDescription}>
            Organiza el tiempo de tus especialistas y asegura la continuidad del tratamiento de tus pacientes.
          </p>
        </div>
      </section>

      <section className={ui.panel} style={{ maxWidth: '800px' }}>
        <div className={ui.panelHeader}>
          <div>
            <div className={ui.panelTitle}>Detalles de la cita</div>
            <div className={ui.panelCopy}>Completa la información para reservar el espacio en la agenda.</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              padding: '1rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Paciente
              </label>
              <select 
                className="input-base" 
                required
                value={formData.patientId}
                onChange={e => setFormData({...formData, patientId: e.target.value})}
                disabled={loading}
              >
                <option value="">{loading ? 'Cargando pacientes...' : 'Selecciona un paciente'}</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
              {patients.length === 0 && !loading && (
                <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  No hay pacientes registrados. <Link href="/patients/new" style={{ color: 'var(--primary)', fontWeight: 700 }}>Añade uno primero.</Link>
                </p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Odontólogo Responsable
              </label>
              <select 
                className="input-base" 
                required
                value={formData.dentistId}
                onChange={e => setFormData({...formData, dentistId: e.target.value})}
                disabled={loading || dentists.length === 0}
              >
                <option value="">Selecciona odontólogo</option>
                {dentists.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fecha
              </label>
              <input 
                type="date" 
                className="input-base" 
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hora de Inicio
              </label>
              <input 
                type="time" 
                className="input-base" 
                required
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Duración
              </label>
              <select 
                className="input-base" 
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1.5 horas</option>
                <option value="120">2 horas</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notas de la cita
            </label>
            <textarea 
              className="input-base" 
              rows={4} 
              placeholder="Ej. Revisión post-operatoria, limpieza profunda, etc."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || patients.length === 0}
            >
              Confirmar Cita
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
