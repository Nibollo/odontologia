'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClinicalOdontogram from '@/components/clinical/ClinicalOdontogram';
import {
  buildOdontogramSnapshotFromTreatments,
  buildDetailedTreatmentPlan_V2,
  extractClinicalFindingsFromSnapshot,
  formatRelativeSummary,
  mergeHistoryTimeline,
  normalizeOdontogramSnapshot,
  summarizeOdontogramSnapshot,
} from '@/components/clinical/odontogramState';
import type {
  ClinicalEpisodeDto,
  OdontogramSnapshot,
  OdontogramSummary,
  TreatmentItemDto,
} from '@/components/clinical/types';
import styles from './page.module.css';

interface TreatmentRecord {
  id: string;
  toothNumber: string | null;
  surface: string | null;
  description: string;
  status: string;
  cost?: number | null;
  createdAt: string;
  dentist?: {
    name: string;
  } | null;
}

interface AppointmentRecord {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  dentist?: {
    name: string;
  } | null;
}

interface PatientGeneralInfo {
  fluorideUse?: string;
  visitReason?: string;
  dentistVisitReason?: string;
  lastDentalVisit?: string;
  previousDentist?: string;
  additionalInformation?: string;
}

interface PatientMedicalInfo {
  cardiovascularDisease?: boolean;
  alteredBloodPressure?: boolean;
  pulmonaryDisease?: boolean;
  bloodDisorder?: boolean;
  gastrointestinalDisease?: boolean;
  epilepsy?: boolean;
  kidneyDisease?: boolean;
  diabetes?: boolean;
  liverDisease?: boolean;
  drugAllergies?: boolean;
  oncologicalHistory?: boolean;
  pregnancy?: boolean;
  immuneSystemDisease?: boolean;
}

interface OdontogramEntryRecord {
  id: string;
  label?: string | null;
  note?: string | null;
  summary?: OdontogramSummary | null;
  state: OdontogramSnapshot;
  createdAt: string;
  dentist?: {
    name: string;
  } | null;
}

interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isForeigner?: boolean;
  familyDoctor?: string | null;
  insuranceName?: string | null;
  communicationLanguage?: string | null;
  profileImagePath?: string | null;
  documentType?: string | null;
  documentId?: string | null;
  annotations?: string | null;
  odontogramState?: OdontogramSnapshot | null;
  odontogramSummary?: OdontogramSummary | null;
  odontogramUpdatedAt?: string | null;
  generalInfo?: PatientGeneralInfo | null;
  medicalInfo?: PatientMedicalInfo | null;
  treatments: TreatmentRecord[];
  treatmentItems: TreatmentItemDto[];
  clinicalEpisodes: ClinicalEpisodeDto[];
  appointments: AppointmentRecord[];
  odontogramEntries: OdontogramEntryRecord[];
}

const MEDICAL_LABELS: Array<{ key: keyof PatientMedicalInfo; label: string }> = [
  { key: 'cardiovascularDisease', label: 'Enfermedades cardiovasculares / marcapasos' },
  { key: 'alteredBloodPressure', label: 'Presión arterial alterada' },
  { key: 'pulmonaryDisease', label: 'Enfermedades pulmonares / asma' },
  { key: 'bloodDisorder', label: 'Trastornos de coagulación' },
  { key: 'gastrointestinalDisease', label: 'Enfermedades gastrointestinales' },
  { key: 'epilepsy', label: 'Epilepsia' },
  { key: 'kidneyDisease', label: 'Enfermedades renales' },
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'liverDisease', label: 'Enfermedades hepáticas' },
  { key: 'drugAllergies', label: 'Alergias a medicamentos' },
  { key: 'oncologicalHistory', label: 'Antecedente oncológico / radioterapia / quimioterapia' },
  { key: 'pregnancy', label: 'Embarazo' },
  { key: 'immuneSystemDisease', label: 'Enfermedades del sistema inmune' },
];

const TAB_LABELS = ['Ficha clínica', 'Plan de tratamiento', 'Citas', 'Presupuesto'] as const;

export default function PatientProfile({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: patientId } = use(params);

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof TAB_LABELS)[number]>('Ficha clínica');
  const [odontogramState, setOdontogramState] = useState<OdontogramSnapshot | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [revisionNote, setRevisionNote] = useState('');
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>('current');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [loadError, setLoadError] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [budgetFilter, setBudgetFilter] = useState<string>('ALL');

  useEffect(() => {
    let active = true;

    async function fetchPatientData() {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();
      if (!active) return;
      if (!res.ok) {
        console.error("API Error Response:", data);
        throw new Error(data.error || `HTTP Error ${res.status}: ${res.statusText}`);
      }
      setLoadError('');

      const patientData = data as PatientRecord;
      const fallbackSnapshot = buildOdontogramSnapshotFromTreatments(patientData.treatments ?? []);
      const normalizedSnapshot = normalizeOdontogramSnapshot(patientData.odontogramState ?? fallbackSnapshot);
      const serialized = JSON.stringify(normalizedSnapshot);

      setPatient({
        ...patientData,
        odontogramState: normalizedSnapshot,
        treatments: patientData.treatments ?? [],
        treatmentItems: patientData.treatmentItems ?? [],
        appointments: patientData.appointments ?? [],
        clinicalEpisodes: (patientData.clinicalEpisodes ?? []).map((episode) => ({
          ...episode,
          findings: episode.findings ?? [],
          treatments: episode.treatments ?? [],
          snapshot: episode.snapshot ? normalizeOdontogramSnapshot(episode.snapshot) : null,
        })),
        odontogramEntries: (patientData.odontogramEntries ?? []).map((entry) => ({
          ...entry,
          state: normalizeOdontogramSnapshot(entry.state),
        })),
      });
      setOdontogramState(normalizedSnapshot);
      setSavedSnapshot(serialized);
      setLoading(false);
    }

    void fetchPatientData().catch((error) => {
      if (!active) return;
      console.error('Failed to fetch patient profile', error);
      setPatient(null);
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la ficha clínica.');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [patientId]);

  const positiveMedicalFlags = useMemo(() => {
    if (!patient?.medicalInfo) return [];
    return MEDICAL_LABELS.filter(({ key }) => patient.medicalInfo?.[key]).map(({ label }) => label);
  }, [patient]);

  const displayedSnapshot = useMemo(() => {
    if (!odontogramState) return null;
    if (selectedRevisionId === 'current') return odontogramState;
    const revision = patient?.odontogramEntries.find((entry) => entry.id === selectedRevisionId);
    return revision ? normalizeOdontogramSnapshot(revision.state) : odontogramState;
  }, [odontogramState, patient?.odontogramEntries, selectedRevisionId]);

  const displayedSummary = useMemo(() => {
    if (!displayedSnapshot) return null;
    return summarizeOdontogramSnapshot(displayedSnapshot);
  }, [displayedSnapshot]);

  const isReadOnlyPreview = selectedRevisionId !== 'current';
  const isDirty = Boolean(odontogramState) && JSON.stringify(odontogramState) !== savedSnapshot;
  const derivedFindings = useMemo(() => {
    if (!displayedSnapshot) return [];
    return extractClinicalFindingsFromSnapshot(displayedSnapshot);
  }, [displayedSnapshot]);

  const derivedTreatmentItems = useMemo(() => {
    return buildDetailedTreatmentPlan_V2(derivedFindings);
  }, [derivedFindings]);

  const historyTimeline = useMemo(() => {
    if (!patient) return [];
    return mergeHistoryTimeline(patient.odontogramEntries, patient.clinicalEpisodes);
  }, [patient]);

  const latestEpisode = patient?.clinicalEpisodes?.[0] ?? null;
  const persistedActiveFindings = useMemo(() => latestEpisode?.findings ?? [], [latestEpisode]);
  const persistedTreatmentItems = useMemo(() => patient?.treatmentItems ?? [], [patient?.treatmentItems]);

  const activeFindings = useMemo(() => {
    if (isReadOnlyPreview || isDirty || persistedActiveFindings.length === 0) {
      return derivedFindings;
    }
    return persistedActiveFindings;
  }, [derivedFindings, isDirty, isReadOnlyPreview, persistedActiveFindings]);

  const planTreatmentItems = useMemo(() => {
    if (isReadOnlyPreview || isDirty || persistedTreatmentItems.length === 0) {
      return derivedTreatmentItems;
    }
    return persistedTreatmentItems;
  }, [derivedTreatmentItems, isDirty, isReadOnlyPreview, persistedTreatmentItems]);

  const treatmentMetrics = useMemo(() => {
    const treatments = patient?.treatments ?? [];
    const completed = treatments.filter((treatment) => treatment.status === 'COMPLETED');
    const planned = treatments.filter((treatment) => treatment.status === 'PLANNED');
    const actualRevenue = completed.reduce((sum, treatment) => sum + (treatment.cost ?? 0), 0);
    const pipelineRevenue = planned.reduce((sum, treatment) => sum + (treatment.cost ?? 0), 0);
    const suggestedRevenue = planTreatmentItems.reduce((sum, treatment) => sum + (treatment.estimatedCost ?? 0), 0);

    return {
      actualRevenue,
      pipelineRevenue,
      suggestedRevenue,
    };
  }, [patient?.treatments, planTreatmentItems]);

  const generalInfo = patient?.generalInfo ?? {};
  const summaryBullets = displayedSummary ? formatRelativeSummary(displayedSummary) : [];

  async function updateTreatmentStatus(itemId: string, newStatus: TreatmentItemDto['status']) {
    if (!patient) return;

    // Optimistic update
    setPatient(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        treatmentItems: prev.treatmentItems.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      };
    });

    if (itemId.startsWith('draft-plan:')) {
      alert('Este es un item sugerido (borrador). Para gestionarlo, primero debes "Guardar revisión" del odontograma para persistir el plan de tratamiento.');
      return;
    }

    try {
      const res = await fetch(`/api/patients/${patient.id}/treatment-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
    } catch (err) {
      console.error(err);
      // Revert if error
      alert('Error al actualizar el estado en el servidor.');
    }
  }

  const filteredPlanItems = useMemo(() => {
    const items = planTreatmentItems;
    if (planFilter === 'ALL') return items;
    if (planFilter === 'ACTIVE') return items.filter(i => i.status !== 'COMPLETED' && i.status !== 'CANCELLED');
    if (planFilter === 'COMPLETED') return items.filter(i => i.status === 'COMPLETED');
    return items.filter(i => i.diagnosisCode === planFilter);
  }, [planTreatmentItems, planFilter]);

  async function persistOdontogram(label: string) {
    if (!odontogramState || !patient) return;

    setSaveState('saving');
    setSaveMessage('Guardando odontograma clínico...');

    try {
      const summary = summarizeOdontogramSnapshot(odontogramState);
      const response = await fetch(`/api/patients/${patient.id}/odontogram`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: odontogramState,
          summary,
          note: revisionNote,
          label,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo guardar el odontograma.');
      }

      const serialized = JSON.stringify(odontogramState);
      setSavedSnapshot(serialized);
      setSaveState('saved');
      setSaveMessage(payload.savedRevision ? 'Odontograma guardado con nueva revisión.' : 'Odontograma actualizado.');
      setRevisionNote('');
      setSelectedRevisionId('current');

      setPatient((current) => {
        if (!current) return current;
        const nextEntries = payload.entry
          ? [
              {
                ...payload.entry,
                state: normalizeOdontogramSnapshot(payload.entry.state),
              } as OdontogramEntryRecord,
              ...current.odontogramEntries,
            ]
          : current.odontogramEntries;
        const nextEpisodes = payload.episode
          ? [
              {
                ...payload.episode,
                snapshot: payload.episode.snapshot ? normalizeOdontogramSnapshot(payload.episode.snapshot) : odontogramState,
              } as ClinicalEpisodeDto,
              ...current.clinicalEpisodes,
            ]
          : current.clinicalEpisodes;
        const nextTreatmentItems = payload.episode?.treatments
          ? [...payload.episode.treatments, ...current.treatmentItems]
          : current.treatmentItems;

        return {
          ...current,
          odontogramState,
          odontogramSummary: summary,
          odontogramUpdatedAt: payload.patient.odontogramUpdatedAt,
          treatmentItems: nextTreatmentItems,
          clinicalEpisodes: nextEpisodes,
          odontogramEntries: nextEntries,
        };
      });
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'No se pudo guardar.');
    }
  }

  if (loading) {
    return <div className={styles.page}>Cargando ficha clínica...</div>;
  }

  if (loadError || !patient || !odontogramState || !displayedSnapshot || !displayedSummary) {
    return <div className={styles.page}>{loadError || 'No se pudo cargar la ficha clínica.'}</div>;
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroPrimary}>
          <button onClick={() => router.push('/patients')} className={styles.backLink}>
            {'<-'} Volver a pacientes
          </button>

          <div className={styles.patientBanner}>
            {patient.profileImagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patient.profileImagePath} alt={`${patient.firstName} ${patient.lastName}`} className={styles.patientAvatar} />
            ) : (
              <div className={styles.patientAvatarFallback}>
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
            )}

            <div>
              <span className="eyebrow">Ficha clínica ampliada</span>
              <h1 className={styles.heroTitle}>{patient.firstName} {patient.lastName}</h1>
              <p className={styles.heroDescription}>
                Un odontograma vivo, con historial, resumen clínico, sugerencias operativas y contexto de tratamiento en la misma vista.
              </p>
              <div className={styles.metaRow}>
                <span className={styles.metaChip}>Expediente {patient.id.slice(-6).toUpperCase()}</span>
                <span className={styles.metaChip}>{patient.documentType === 'PASAPORTE' ? 'Pasaporte' : 'CI'} {patient.documentId || 'S/D'}</span>
                <span className={styles.metaChip}>{displayedSummary.changedTeeth} piezas con registro</span>
                <span className={styles.metaChip}>{patient.odontogramEntries.length} revisiones clínicas</span>
                <span className={styles.metaChip}>{patient.clinicalEpisodes.length} episodios clínicos</span>
                <span className={styles.metaChip}>{isReadOnlyPreview ? 'Vista histórica' : isDirty ? 'Cambios sin guardar' : 'Sincronizado'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroActions}>
          <button className="btn-secondary" onClick={() => persistOdontogram('Borrador clínico')} disabled={saveState === 'saving' || !isDirty}>
            Guardar borrador
          </button>
          <button className="btn-primary" onClick={() => persistOdontogram('Cierre de consulta')} disabled={saveState === 'saving'}>
            Finalizar consulta
          </button>
        </div>
      </section>

      <div className={styles.tabs}>
        {TAB_LABELS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className={`${styles.profileGrid} ${styles.printArea}`}>
        <article className={styles.infoCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Resumen del paciente</div>
              <div className={styles.sectionCopy}>Datos personales y administrativos listos para consulta rápida en gabinete.</div>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <DetailItem label="Celular" value={patient.phone || 'Sin cargar'} />
            <DetailItem label="Correo" value={patient.email || 'Sin cargar'} />
            <DetailItem label="Fecha de nacimiento" value={formatDate(patient.birthDate)} />
            <DetailItem label="Género" value={normalizeValue(patient.gender)} />
            <DetailItem label="Dirección" value={patient.address || 'Sin cargar'} />
            <DetailItem label="Ciudad / distrito" value={patient.city || 'Sin cargar'} />
            <DetailItem label="País" value={patient.country || 'Paraguay'} />
            <DetailItem label="Idioma" value={patient.communicationLanguage || 'Español'} />
            <DetailItem label="Seguro" value={patient.insuranceName || 'Sin seguro registrado'} />
            <DetailItem label="Médico de cabecera" value={patient.familyDoctor || 'Sin cargar'} />
          </div>
        </article>

        <article className={styles.infoCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Motivo y antecedentes</div>
              <div className={styles.sectionCopy}>Información general para interpretar el contexto clínico del odontograma.</div>
            </div>
          </div>

          <div className={styles.softGrid}>
            <InfoField label="Productos con flúor" value={generalInfo.fluorideUse || 'Sin datos'} />
            <InfoField label="Motivo de consulta" value={generalInfo.visitReason || 'Sin datos'} />
            <InfoField label="Razón de la visita" value={generalInfo.dentistVisitReason || 'Sin datos'} />
            <InfoField label="Última visita al odontólogo" value={generalInfo.lastDentalVisit || 'Sin datos'} />
            <InfoField label="Odontólogo o clínica previa" value={generalInfo.previousDentist || 'Sin datos'} />
            <InfoField label="Información adicional" value={generalInfo.additionalInformation || patient.annotations || 'Sin observaciones'} />
          </div>
        </article>
      </section>

      {activeTab === 'Ficha clínica' && (
        <section className={`${styles.contentGrid} ${styles.printArea}`}>
            <article className={styles.content}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.sectionTitle}>Odontograma y evolución</div>
                  <div className={styles.sectionCopy}>
                    Edición clínica completa con historial de revisiones, notas por pieza y persistencia real del estado.
                  </div>
                </div>
                <div className={styles.statusStack}>
                  <span className={`${styles.statusBadge} ${isReadOnlyPreview ? styles.statusPreview : isDirty ? styles.statusDirty : styles.statusSynced}`}>
                    {isReadOnlyPreview ? 'Vista histórica' : isDirty ? 'Pendiente de guardado' : 'Guardado'}
                  </span>
                  <span className={styles.statusMeta}>
                    {patient.odontogramUpdatedAt ? `Última actualización: ${formatDateTime(patient.odontogramUpdatedAt)}` : 'Sin guardados previos'}
                  </span>
                </div>
              </div>

              <div className={styles.summaryGrid}>
                <SummaryCard label="Piezas con hallazgos" value={displayedSummary.changedTeeth} />
                <SummaryCard label="Caries activas" value={displayedSummary.cariesTeeth} />
                <SummaryCard label="Restauraciones" value={displayedSummary.restoredTeeth} />
                <SummaryCard label="Piezas ausentes" value={displayedSummary.missingTeeth} />
              </div>

              <div className={styles.odontoPanel}>
                <ClinicalOdontogram
                  initialState={displayedSnapshot}
                  onChange={isReadOnlyPreview ? undefined : setOdontogramState}
                  readOnly={isReadOnlyPreview}
                  enableNotes
                />
              </div>

              <div className={`${styles.sideCard} ${styles.clinicalSummaryCard}`}>
                <div className={styles.sectionTitle}>Resumen clínico</div>
                <div className={styles.sectionCopy}>Lectura rápida del estado actual del odontograma.</div>
                <div className={styles.bulletList}>
                  {summaryBullets.map((item) => (
                    <span key={item} className={styles.metricPill}>{item}</span>
                  ))}
                </div>
              </div>
            </article>

          <div className={styles.bottomCardsGrid}>
              <div className={styles.softTissuePanel}>
                <div className={styles.sectionTitle}>Información médica relevante</div>
                <div className={styles.sectionCopy}>Alertas positivas registradas en admisión y anamnesis.</div>

                {positiveMedicalFlags.length === 0 ? (
                  <div className={styles.emptyMedical}>No hay antecedentes médicos marcados como positivos.</div>
                ) : (
                  <div className={styles.flagList}>
                    {positiveMedicalFlags.map((label) => (
                      <span key={label} className={styles.flagChip}>{label}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.sideCard}>
                <div className={styles.sectionTitle}>Guardar revisión</div>
                <div className={styles.sectionCopy}>Deja una nota de contexto para la próxima sesión o para auditoría clínica.</div>
                <textarea
                  value={revisionNote}
                  onChange={(event) => setRevisionNote(event.target.value)}
                  className={styles.noteInput}
                  placeholder="Ej.: control post endodoncia, cambios oclusales, seguimiento de caries proximal..."
                />
                {saveMessage ? <div className={styles.saveMessage}>{saveMessage}</div> : null}
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sectionTitle}>Historial clínico</div>
                <div className={styles.sectionCopy}>Cada guardado del odontograma queda como una entrada de este historial, lista para revisar.</div>
                <div className={styles.historyList}>
                  <button
                    className={`${styles.historyItem} ${selectedRevisionId === 'current' ? styles.historyItemActive : ''}`}
                    onClick={() => setSelectedRevisionId('current')}
                  >
                    <span className={styles.historyTitle}>Versión actual</span>
                    <span className={styles.historyMeta}>{isDirty ? 'Con cambios pendientes' : 'Lista para consulta'}</span>
                  </button>

                  {historyTimeline.length === 0 ? (
                    <div className={styles.emptyMedical}>Todavía no hay revisiones guardadas.</div>
                  ) : (
                    historyTimeline.map((item) =>
                      item.selectable ? (
                        <button
                          key={item.id}
                          className={`${styles.historyItem} ${selectedRevisionId === item.id ? styles.historyItemActive : ''}`}
                          onClick={() => setSelectedRevisionId(item.id)}
                        >
                          <span className={styles.historyTitle}>{item.title}</span>
                          <span className={styles.historyMeta}>{item.meta}</span>
                          {item.note ? <p className={styles.timelineNotes}>{item.note}</p> : null}
                        </button>
                      ) : (
                        <article key={item.id} className={styles.historyStaticItem}>
                          <span className={styles.historyTitle}>{item.title}</span>
                          <span className={styles.historyMeta}>{item.meta}</span>
                          {item.note ? <p className={styles.timelineNotes}>{item.note}</p> : null}
                        </article>
                      ),
                    )
                  )}
                </div>
              </div>
          </div>
        </section>
      )}

      {activeTab === 'Plan de tratamiento' && (
        <section className={`${styles.content} ${styles.printArea}`}>
          <div className={styles.planContainer}>
            <aside className={styles.planSidebar}>
              <div className={styles.sideCard}>
                <div className={styles.sectionTitle}>Métricas del plan</div>
                <div className={styles.metricsBox}>
                  <div className={styles.metricRow}>
                    <span>Presupuesto estimado</span>
                    <strong>{formatCurrency(treatmentMetrics.suggestedRevenue)}</strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Progreso del caso</span>
                    <strong>{Math.round((planTreatmentItems.filter(i => i.status === 'COMPLETED').length / (planTreatmentItems.length || 1)) * 100)}%</strong>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div 
                      className={styles.progressBarFill} 
                      style={{ width: `${(planTreatmentItems.filter(i => i.status === 'COMPLETED').length / (planTreatmentItems.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sectionTitle}>Filtros clínicos</div>
                <div className={styles.filterList}>
                  <button className={`${styles.filterBtn} ${planFilter === 'ALL' ? styles.filterBtnActive : ''}`} onClick={() => setPlanFilter('ALL')}>Todos</button>
                  <button className={`${styles.filterBtn} ${planFilter === 'ACTIVE' ? styles.filterBtnActive : ''}`} onClick={() => setPlanFilter('ACTIVE')}>Pendientes</button>
                  <button className={`${styles.filterBtn} ${planFilter === 'CARIES' ? styles.filterBtnActive : ''}`} onClick={() => setPlanFilter('CARIES')}>Caries</button>
                  <button className={`${styles.filterBtn} ${planFilter === 'ENDO' ? styles.filterBtnActive : ''}`} onClick={() => setPlanFilter('ENDO')}>Endodoncia</button>
                  <button className={`${styles.filterBtn} ${planFilter === 'EXODONTIA' ? styles.filterBtnActive : ''}`} onClick={() => setPlanFilter('EXODONTIA')}>Cirugía</button>
                  <button className={`${styles.filterBtn} ${planFilter === 'COMPLETED' ? styles.filterBtnActive : ''}`} onClick={() => setPlanFilter('COMPLETED')}>Completados</button>
                </div>
              </div>
            </aside>

            <main className={styles.planBoard}>
              <div className={styles.boardHeader}>
                <h2 className={styles.sectionTitle}>Plan de Tratamiento sugerido</h2>
                <p className={styles.sectionCopy}>Basado en los hallazgos del odontograma vivo. Puedes actualizar el estado de cada item según la evolución real.</p>
              </div>

              <div className={styles.treatmentGrid}>
                {filteredPlanItems.length === 0 ? (
                  <div className={styles.emptyState}>No hay items que coincidan con el filtro seleccionado.</div>
                ) : (
                  filteredPlanItems.map((item) => (
                    <article key={item.id} className={`${styles.treatmentCard} ${styles[`priority_${item.diagnosisCode?.toLowerCase()}`]}`}>
                      <div className={styles.cardHeader}>
                        <div className={styles.toothBadge}>
                          Pieza {item.toothNumber || 'General'} {item.surfaceCode ? `· ${item.surfaceCode}` : ''}
                        </div>
                        <span className={styles.itemCost}>{formatCurrency(item.estimatedCost ?? 0)}</span>
                      </div>
                      
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      <p className={styles.itemDesc}>{item.description}</p>

                      <div className={styles.cardFooter}>
                        <select 
                          className={styles.statusSelect}
                          value={item.status}
                          onChange={(e) => updateTreatmentStatus(item.id, e.target.value as TreatmentItemDto['status'])}
                        >
                          <option value="PROPOSED">Propuesto</option>
                          <option value="PLANNED">Planificado</option>
                          <option value="IN_PROGRESS">En curso</option>
                          <option value="COMPLETED">Completado</option>
                          <option value="CANCELLED">Cancelado</option>
                        </select>

                        <span className={`${styles.statusPill} ${styles[`status_${item.status.toLowerCase()}`]}`}>
                          {item.status}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {patient.treatments.length > 0 && (
                <div className={styles.legacySection}>
                  <h3 className={styles.historySectionLabel}>Tratamientos previos (Historial)</h3>
                  <div className={styles.timeline}>
                    {patient.treatments.map((t) => (
                      <div key={t.id} className={styles.timelineItem}>
                        <div className={styles.timelineDate}>{formatDate(t.createdAt)}</div>
                        <div className={styles.timelineBody}>
                          <strong>{t.description}</strong>
                          <span className={styles.timelineMeta}>Pieza {t.toothNumber || 'G'} · {t.status} · {formatCurrency(t.cost ?? 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </section>
      )}

      {activeTab === 'Citas' && (
        <section className={`${styles.content} ${styles.printArea}`}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Agenda y continuidad</div>
              <div className={styles.sectionCopy}>Historial y próximas citas vinculadas a la evolución clínica del paciente.</div>
            </div>
          </div>

          <div className={styles.timeline}>
            {patient.appointments.length === 0 ? (
              <div className={styles.emptyMedical}>No hay citas registradas.</div>
            ) : (
              patient.appointments.map((appointment) => (
                <article key={appointment.id} className={styles.timelineItem}>
                  <div className={styles.timelineDate}>{formatDateTime(appointment.startTime)}</div>
                  <div className={styles.timelineBody}>
                    <div className={styles.timelineTitle}>{appointment.status}</div>
                    <div className={styles.timelineMeta}>
                      {appointment.dentist?.name ? `Profesional: ${appointment.dentist.name}` : 'Profesional sin asignar'}
                    </div>
                    <div className={styles.timelineMeta}>
                      Duración: {formatDateTime(appointment.startTime, true)} - {formatDateTime(appointment.endTime, true)}
                    </div>
                    {appointment.notes ? <p className={styles.timelineNotes}>{appointment.notes}</p> : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'Presupuesto' && (
        <section className={`${styles.content} ${styles.printArea}`}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Dashboard Financiero</div>
              <div className={styles.sectionCopy}>Análisis consolidado de la inversión del paciente y proyecciones de tratamiento.</div>
            </div>
            <div className={styles.budgetActions}>
               <button className={styles.filterBtn} onClick={() => window.print()}>Exportar Presupuesto</button>
            </div>
          </div>

          <div className={styles.budgetDashboard}>
            <div className={`${styles.budgetMainCard} ${styles.bg_primary_gradient}`}>
              <div className={styles.mainCardLabel}>Inversión Total Estimada</div>
              <div className={styles.mainCardValue}>
                {formatCurrency(treatmentMetrics.actualRevenue + treatmentMetrics.pipelineRevenue + treatmentMetrics.suggestedRevenue)}
              </div>
              <div className={styles.mainCardMeta}>Combinación de realizado, planeado y sugerido</div>
            </div>

            <div className={styles.budgetStatsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Facturado (Realizado)</div>
                <div className={styles.statValue}>{formatCurrency(treatmentMetrics.actualRevenue)}</div>
                <div className={styles.statProgress}>
                  <div className={styles.progressTrack}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${(treatmentMetrics.actualRevenue / (treatmentMetrics.actualRevenue + treatmentMetrics.pipelineRevenue + treatmentMetrics.suggestedRevenue || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Pipeline (Planeado)</div>
                <div className={styles.statValue}>{formatCurrency(treatmentMetrics.pipelineRevenue)}</div>
                <div className={styles.statProgress}>
                  <div className={styles.progressTrack} style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${(treatmentMetrics.pipelineRevenue / (treatmentMetrics.actualRevenue + treatmentMetrics.pipelineRevenue + treatmentMetrics.suggestedRevenue || 1)) * 100}%`, background: '#4f46e5' }}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Potencial (Sugerido)</div>
                <div className={styles.statValue}>{formatCurrency(treatmentMetrics.suggestedRevenue)}</div>
                <div className={styles.statProgress}>
                  <div className={styles.progressTrack} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${(treatmentMetrics.suggestedRevenue / (treatmentMetrics.actualRevenue + treatmentMetrics.pipelineRevenue + treatmentMetrics.suggestedRevenue || 1)) * 100}%`, background: '#f59e0b' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.budgetTableContainer}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>Desglose de Procedimientos</h3>
              <div className={styles.tableFilters}>
                <button 
                  className={`${styles.miniFilter} ${budgetFilter === 'ALL' ? styles.miniFilterActive : ''}`}
                  onClick={() => setBudgetFilter('ALL')}
                >
                  Todos
                </button>
                <button 
                  className={`${styles.miniFilter} ${budgetFilter === 'COMPLETED' ? styles.miniFilterActive : ''}`}
                  onClick={() => setBudgetFilter('COMPLETED')}
                >
                  Completados
                </button>
                <button 
                  className={`${styles.miniFilter} ${budgetFilter === 'PENDING' ? styles.miniFilterActive : ''}`}
                  onClick={() => setBudgetFilter('PENDING')}
                >
                  Pendientes
                </button>
              </div>
            </div>

            <table className={styles.budgetTable}>
              <thead>
                <tr>
                  <th>Fecha/Origen</th>
                  <th>Procedimiento</th>
                  <th>Pieza</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Costo</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Realizados */}
                {patient.treatments.filter(t => t.status === 'COMPLETED' && (budgetFilter === 'ALL' || budgetFilter === 'COMPLETED')).map((t) => (
                  <tr key={t.id}>
                    <td className={styles.tdDate}>{formatDate(t.createdAt)}</td>
                    <td>
                      <div className={styles.tdTitle}>{t.description}</div>
                      <div className={styles.tdMeta}>Procedimiento ejecutado</div>
                    </td>
                    <td><span className={styles.tdTooth}>{t.toothNumber || 'G'}</span></td>
                    <td><span className={`${styles.statusPill} ${styles.status_completed}`}>Realizado</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatCurrency(t.cost ?? 0)}</td>
                  </tr>
                ))}

                {/* 2. Planeados */}
                {patient.treatmentItems.filter(t => (t.status === 'PLANNED' || t.status === 'IN_PROGRESS') && (budgetFilter === 'ALL' || budgetFilter === 'PENDING')).map((t) => (
                  <tr key={t.id}>
                    <td className={styles.tdDate}>{formatDate(t.createdAt)}</td>
                    <td>
                      <div className={styles.tdTitle}>{t.title}</div>
                      <div className={styles.tdMeta}>{t.description || 'En plan de tratamiento'}</div>
                    </td>
                    <td><span className={styles.tdTooth}>{t.toothNumber || 'G'}</span></td>
                    <td><span className={`${styles.statusPill} ${styles.status_planned}`}>Planeado</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatCurrency(t.estimatedCost ?? 0)}</td>
                  </tr>
                ))}

                {/* 3. Sugeridos (Solo si no hay planeados que los cubran o en vista ALL/PENDING) */}
                {(budgetFilter === 'ALL' || budgetFilter === 'PENDING') && planTreatmentItems.filter(t => t.id.startsWith('draft-plan:')).map((t) => (
                  <tr key={t.id}>
                    <td className={styles.tdDate}><span className={styles.draftBadge}>Sugerido</span></td>
                    <td>
                      <div className={styles.tdTitle}>{t.title}</div>
                      <div className={styles.tdMeta}>Derivado del odontograma actual</div>
                    </td>
                    <td><span className={styles.tdTooth}>{t.toothNumber || 'G'}</span></td>
                    <td><span className={`${styles.statusPill} ${styles.status_proposed}`}>Sugerido</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-muted)' }}>{formatCurrency(t.estimatedCost ?? 0)}</td>
                  </tr>
                ))}

                {patient.treatments.length === 0 && patient.treatmentItems.length === 0 && planTreatmentItems.length === 0 && (
                   <tr>
                    <td colSpan={5} className={styles.tdEmpty}>No hay registros financieros para este paciente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className={styles.footerBar}>
        <button className={styles.footerButton} onClick={() => window.print()}>
          <span>Descargar PDF clínico</span>
          <span>[PDF]</span>
        </button>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailItem}>
      <div className={styles.detailLabel}>{label}</div>
      <div className={styles.detailValue}>{value}</div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.softField}>
      <label className={styles.softLabel}>{label}</label>
      <div className={styles.softValue}>{value}</div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryLabel}>{label}</div>
      <div className={styles.summaryValue}>{value}</div>
    </div>
  );
}


function formatDate(value?: string | null) {
  if (!value) return 'Sin cargar';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin cargar';
  return parsed.toLocaleDateString('es-PY', { dateStyle: 'medium' });
}

function formatDateTime(value?: string | null, onlyTime = false) {
  if (!value) return 'Sin dato';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin dato';
  if (onlyTime) {
    return parsed.toLocaleTimeString('es-PY', { timeStyle: 'short' });
  }
  return parsed.toLocaleString('es-PY', { dateStyle: 'medium', timeStyle: 'short' });
}

function normalizeValue(value?: string | null) {
  if (!value) return 'Sin cargar';
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (character) => character.toUpperCase());
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0,
  }).format(value);
}
