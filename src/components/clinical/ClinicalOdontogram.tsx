'use client';

import { useEffect, useRef } from 'react';
import OdontogramApp from './odontogram-modul/App';
import { getFullStatus, setFullStatus, setChangeCallback } from './odontogram-modul/App';
import type { OdontogramSnapshot } from './types';

interface ClinicalOdontogramProps {
  initialState?: OdontogramSnapshot | null;
  onChange?: (state: OdontogramSnapshot) => void;
  readOnly?: boolean;
  enableNotes?: boolean;
}

export default function ClinicalOdontogram({
  initialState,
  onChange,
  readOnly = false,
  enableNotes = true,
}: ClinicalOdontogramProps) {
  const lastUpdateRef = useRef<string>('');

  useEffect(() => {
    if (!initialState) return;

    try {
      const current = JSON.stringify(getFullStatus());
      const target = JSON.stringify(initialState);
      if (current !== target) {
        setFullStatus(initialState);
        lastUpdateRef.current = target;
      }
    } catch (error) {
      console.error('Failed to load initial odontogram state', error);
    }
  }, [initialState]);

  useEffect(() => {
    if (readOnly) return;

    setChangeCallback((newStatus) => {
      const serialized = JSON.stringify(newStatus);
      if (serialized !== lastUpdateRef.current) {
        lastUpdateRef.current = serialized;
        onChange?.(newStatus);
      }
    });

    return () => {
      setChangeCallback(() => {});
    };
  }, [onChange, readOnly]);

  return (
    <div className="clinical-odontogram-wrapper" style={{ minHeight: '650px', background: 'transparent' }}>
      <OdontogramApp
        readOnly={readOnly}
        language="es"
        enableNotes={enableNotes}
      />
    </div>
  );
}
