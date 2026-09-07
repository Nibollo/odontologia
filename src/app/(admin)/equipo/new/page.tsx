'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewStaff() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DENTIST'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      router.push('/equipo');
    } else {
      const data = await res.json();
      setError(data.error || 'No se pudo crear el empleado.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/equipo" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
          ← Volver al Equipo
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Añadir Empleado</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '500px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Tú asignarás la contraseña temporal. El empleado deberá usar su correo y esta contraseña para iniciar sesión en {typeof window !== 'undefined' ? window.location.hostname : 'el sistema'}.
        </p>

        {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}
        
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nombre Completo</label>
          <input 
            type="text" 
            className="input-base" 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo Electrónico (Para Login)</label>
          <input 
            type="email" 
            className="input-base" 
            required
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña Asignada</label>
          <input 
            type="password" 
            className="input-base" 
            required
            minLength={6}
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            placeholder="Min. 6 caracteres"
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Rol del Empleado</label>
          <select 
            className="input-base" 
            required
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            <option value="DENTIST">Odontólogo (Tiene Agenda propia)</option>
            <option value="ASSISTANT">Recepción/Asistente (Gestiona citas de otros)</option>
            <option value="ADMIN">Administrador Ejecutivo</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creando cuenta...' : 'Crear Cuenta y Dar Acceso'}
        </button>
      </form>
    </div>
  );
}
