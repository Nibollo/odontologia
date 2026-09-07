'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ui from '../../admin-ui.module.css';
import styles from './page.module.css';

type MedicalInfoKey =
  | 'cardiovascularDisease'
  | 'alteredBloodPressure'
  | 'pulmonaryDisease'
  | 'bloodDisorder'
  | 'gastrointestinalDisease'
  | 'epilepsy'
  | 'kidneyDisease'
  | 'diabetes'
  | 'liverDisease'
  | 'drugAllergies'
  | 'oncologicalHistory'
  | 'pregnancy'
  | 'immuneSystemDisease';

interface PatientGeneralInfo {
  fluorideUse: string;
  visitReason: string;
  dentistVisitReason: string;
  lastDentalVisit: string;
  previousDentist: string;
  additionalInformation: string;
}

interface PatientMedicalInfo {
  cardiovascularDisease: boolean;
  alteredBloodPressure: boolean;
  pulmonaryDisease: boolean;
  bloodDisorder: boolean;
  gastrointestinalDisease: boolean;
  epilepsy: boolean;
  kidneyDisease: boolean;
  diabetes: boolean;
  liverDisease: boolean;
  drugAllergies: boolean;
  oncologicalHistory: boolean;
  pregnancy: boolean;
  immuneSystemDisease: boolean;
}

interface PatientCreateFormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: string;
  documentType: string;
  documentId: string;
  address: string;
  city: string;
  country: string;
  familyDoctor: string;
  insuranceName: string;
  communicationLanguage: string;
  isForeigner: boolean;
  annotations: string;
  generalInfo: PatientGeneralInfo;
  medicalInfo: PatientMedicalInfo;
}

const DEFAULT_FORM: PatientCreateFormState = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthDate: '',
  gender: '',
  documentType: 'CEDULA',
  documentId: '',
  address: '',
  city: '',
  country: 'Paraguay',
  familyDoctor: '',
  insuranceName: '',
  communicationLanguage: 'Español',
  isForeigner: false,
  annotations: '',
  generalInfo: {
    fluorideUse: '',
    visitReason: '',
    dentistVisitReason: '',
    lastDentalVisit: '',
    previousDentist: '',
    additionalInformation: '',
  },
  medicalInfo: {
    cardiovascularDisease: false,
    alteredBloodPressure: false,
    pulmonaryDisease: false,
    bloodDisorder: false,
    gastrointestinalDisease: false,
    epilepsy: false,
    kidneyDisease: false,
    diabetes: false,
    liverDisease: false,
    drugAllergies: false,
    oncologicalHistory: false,
    pregnancy: false,
    immuneSystemDisease: false,
  },
};

const GENERAL_QUESTIONS: Array<{ key: keyof PatientGeneralInfo; label: string; placeholder?: string }> = [
  { key: 'fluorideUse', label: '¿Usa productos con flúor?', placeholder: 'Pasta dental, enjuague, gel o comprimidos' },
  { key: 'visitReason', label: 'Motivo de la consulta', placeholder: 'Ej. dolor, control, limpieza, restauración' },
  { key: 'dentistVisitReason', label: '¿Por qué acudió al odontólogo?', placeholder: 'Ej. dolor, mantener salud bucal, reparar una pieza' },
  { key: 'lastDentalVisit', label: 'Última visita al odontólogo', placeholder: 'Ej. hace 6 meses, hace 1 año' },
  { key: 'previousDentist', label: 'Odontólogo o clínica habitual', placeholder: 'Nombre de profesional o clínica anterior' },
  { key: 'additionalInformation', label: 'Información adicional', placeholder: 'Detalles relevantes para el tratamiento' },
];

const MEDICAL_QUESTIONS: Array<{ key: MedicalInfoKey; label: string }> = [
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
  { key: 'immuneSystemDisease', label: 'Enfermedades que afectan al sistema inmune' },
];

export default function NewPatient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<PatientCreateFormState>(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) return 'Sin archivo cargado';
    const sizeInKb = Math.max(1, Math.round(selectedFile.size / 1024));
    return `${selectedFile.name} · ${sizeInKb} KB`;
  }, [selectedFile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const payload = new FormData();
    payload.set('firstName', formData.firstName);
    payload.set('lastName', formData.lastName);
    payload.set('phone', formData.phone);
    payload.set('email', formData.email);
    payload.set('birthDate', formData.birthDate);
    payload.set('gender', formData.gender);
    payload.set('documentType', formData.documentType);
    payload.set('documentId', formData.documentId);
    payload.set('address', formData.address);
    payload.set('city', formData.city);
    payload.set('country', formData.country);
    payload.set('familyDoctor', formData.familyDoctor);
    payload.set('insuranceName', formData.insuranceName);
    payload.set('communicationLanguage', formData.communicationLanguage);
    payload.set('isForeigner', String(formData.isForeigner));
    payload.set('annotations', formData.annotations);

    for (const [key, value] of Object.entries(formData.generalInfo)) {
      payload.set(key, value);
    }

    for (const [key, value] of Object.entries(formData.medicalInfo)) {
      payload.set(key, String(value));
    }

    if (selectedFile) {
      payload.set('profileAsset', selectedFile);
    }

    const response = await fetch('/api/patients', {
      method: 'POST',
      body: payload,
    });

    if (response.ok) {
      router.push('/patients');
      return;
    }

    const data = await response.json().catch(() => ({ error: 'No se pudo guardar el paciente.' }));
    setError(data.error || 'No se pudo guardar el paciente.');
    setLoading(false);
  };

  function handleInputChange<K extends keyof PatientCreateFormState>(key: K, value: PatientCreateFormState[K]) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function handleGeneralInfoChange(key: keyof PatientGeneralInfo, value: string) {
    setFormData((current) => ({
      ...current,
      generalInfo: {
        ...current.generalInfo,
        [key]: value,
      },
    }));
  }

  function handleMedicalInfoChange(key: MedicalInfoKey, value: boolean) {
    setFormData((current) => ({
      ...current,
      medicalInfo: {
        ...current.medicalInfo,
        [key]: value,
      },
    }));
  }

  function handleFileSelection(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file && file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    setSelectedFile(file);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    handleFileSelection(event.target.files?.[0] ?? null);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className={ui.page}>
      <section className={`${ui.hero} ${ui.heroCompact}`}>
        <div className={ui.heroText}>
          <Link href="/patients" className={styles.backLink}>
            {'<-'} Volver a pacientes
          </Link>
          <span className="eyebrow">Alta de paciente</span>
          <h1 className={ui.heroTitle}>Registro clínico claro, moderno y listo para consultorio paraguayo.</h1>
          <p className={ui.heroDescription}>
            Carga identidad, antecedentes y datos médicos en una sola pantalla, con lenguaje en español y foco en cédula, celular y contexto local.
          </p>
        </div>
        <div className={ui.heroMeta}>
          <div className={ui.heroMetaCard}>
            <div className={ui.metaLabel}>Documento</div>
            <div className={ui.metaValue}>Cédula primero</div>
            <div className={ui.metaCopy}>pasaporte disponible si el paciente es extranjero</div>
          </div>
          <div className={ui.heroMetaCard}>
            <div className={ui.metaLabel}>Formato</div>
            <div className={ui.metaValue}>Ficha clínica</div>
            <div className={ui.metaCopy}>datos personales, motivo de consulta y antecedentes</div>
          </div>
        </div>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Datos de identificación</div>
              <div className={styles.sectionCopy}>Información principal del paciente, foto o documento de apoyo y referencias de contacto.</div>
            </div>
          </div>

          <div className={styles.identityGrid}>
            <div className={styles.uploadColumn}>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className={styles.hiddenInput}
                onChange={onFileChange}
              />
              <button
                type="button"
                className={`${styles.uploadDropzone} ${isDragging ? styles.uploadDropzoneActive : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Vista previa" className={styles.uploadPreview} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <div className={styles.uploadIcon}>+</div>
                    <div className={styles.uploadText}>Arrastra aquí una foto o documento del paciente</div>
                    <div className={styles.uploadHint}>También puedes hacer clic para seleccionar archivo</div>
                  </div>
                )}
              </button>

              <div className={styles.uploadMeta}>
                <div className={styles.fileBadge}>{selectedFileLabel}</div>
                <div className={styles.uploadActions}>
                  <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
                    {selectedFile ? 'Reemplazar archivo' : 'Subir archivo'}
                  </button>
                  {selectedFile && (
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={() => {
                        handleFileSelection(null);
                        if (inputRef.current) inputRef.current.value = '';
                      }}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.fieldsColumn}>
              <div className={styles.fieldGrid}>
                <Field label="Nombres" required>
                  <input
                    className="input-base"
                    value={formData.firstName}
                    onChange={(event) => handleInputChange('firstName', event.target.value)}
                    required
                  />
                </Field>
                <Field label="Celular">
                  <input
                    className="input-base"
                    placeholder="+595 9xx xxx xxx"
                    value={formData.phone}
                    onChange={(event) => handleInputChange('phone', event.target.value)}
                  />
                </Field>
                <Field label="Apellidos" required>
                  <input
                    className="input-base"
                    value={formData.lastName}
                    onChange={(event) => handleInputChange('lastName', event.target.value)}
                    required
                  />
                </Field>
                <Field label="Correo electrónico">
                  <input
                    type="email"
                    className="input-base"
                    value={formData.email}
                    onChange={(event) => handleInputChange('email', event.target.value)}
                  />
                </Field>
                <Field label="Fecha de nacimiento">
                  <input
                    type="date"
                    className="input-base"
                    value={formData.birthDate}
                    onChange={(event) => handleInputChange('birthDate', event.target.value)}
                  />
                </Field>
                <Field label="Dirección">
                  <input
                    className="input-base"
                    value={formData.address}
                    onChange={(event) => handleInputChange('address', event.target.value)}
                  />
                </Field>
                <Field label="Género">
                  <select
                    className="input-base"
                    value={formData.gender}
                    onChange={(event) => handleInputChange('gender', event.target.value)}
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="NO_BINARIO">No binario</option>
                    <option value="PREFIERO_NO_DECIR">Prefiero no decir</option>
                  </select>
                </Field>
                <Field label="Médico de cabecera">
                  <input
                    className="input-base"
                    value={formData.familyDoctor}
                    onChange={(event) => handleInputChange('familyDoctor', event.target.value)}
                  />
                </Field>
                <Field label="Tipo de documento">
                  <select
                    className="input-base"
                    value={formData.documentType}
                    onChange={(event) => handleInputChange('documentType', event.target.value)}
                  >
                    <option value="CEDULA">Cédula de identidad</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </Field>
                <Field label="Número de documento">
                  <input
                    className="input-base"
                    value={formData.documentId}
                    onChange={(event) => handleInputChange('documentId', event.target.value)}
                  />
                </Field>
                <Field label="Idioma de comunicación">
                  <select
                    className="input-base"
                    value={formData.communicationLanguage}
                    onChange={(event) => handleInputChange('communicationLanguage', event.target.value)}
                  >
                    <option value="Español">Español</option>
                    <option value="Guaraní">Guaraní</option>
                    <option value="Portugués">Portugués</option>
                    <option value="Inglés">Inglés</option>
                  </select>
                </Field>
                <Field label="Seguro o cobertura">
                  <input
                    className="input-base"
                    placeholder="Ej. sin seguro, particular, aseguradora"
                    value={formData.insuranceName}
                    onChange={(event) => handleInputChange('insuranceName', event.target.value)}
                  />
                </Field>
              </div>

              <div className={styles.inlineRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isForeigner}
                    onChange={(event) => handleInputChange('isForeigner', event.target.checked)}
                  />
                  <span>Paciente extranjero</span>
                </label>

                <div className={styles.inlineCountryField}>
                  <Field label="País">
                    <input
                      className="input-base"
                      value={formData.country}
                      onChange={(event) => handleInputChange('country', event.target.value)}
                    />
                  </Field>
                </div>

                <div className={styles.inlineCountryField}>
                  <Field label="Ciudad / distrito">
                    <input
                      className="input-base"
                      value={formData.city}
                      onChange={(event) => handleInputChange('city', event.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Información general</div>
              <div className={styles.sectionCopy}>Motivo de consulta, hábitos y contexto para la primera evaluación clínica.</div>
            </div>
          </div>

          <div className={styles.questionGrid}>
            {GENERAL_QUESTIONS.map((question) => (
              <div key={question.key} className={styles.questionRow}>
                <div className={styles.questionLabel}>{question.label}</div>
                <textarea
                  className={`${styles.textarea} input-base`}
                  rows={question.key === 'additionalInformation' ? 5 : 3}
                  placeholder={question.placeholder ?? 'Anotaciones'}
                  value={formData.generalInfo[question.key]}
                  onChange={(event) => handleGeneralInfoChange(question.key, event.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Información médica</div>
              <div className={styles.sectionCopy}>Responde Sí o No según los antecedentes relevantes para la atención odontológica.</div>
            </div>
          </div>

          <div className={styles.medicalGrid}>
            {MEDICAL_QUESTIONS.map((question) => (
              <div key={question.key} className={styles.medicalRow}>
                <div className={styles.medicalLabel}>{question.label}</div>
                <div className={styles.binaryOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name={question.key}
                      checked={!formData.medicalInfo[question.key]}
                      onChange={() => handleMedicalInfoChange(question.key, false)}
                    />
                    <span>No</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name={question.key}
                      checked={formData.medicalInfo[question.key]}
                      onChange={() => handleMedicalInfoChange(question.key, true)}
                    />
                    <span>Sí</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Observaciones clínicas</div>
              <div className={styles.sectionCopy}>Espacio libre para notas de recepción, antecedentes relevantes o alertas del paciente.</div>
            </div>
          </div>

          <textarea
            className={`${styles.textareaLarge} input-base`}
            rows={6}
            placeholder="Ej. medicación actual, sensibilidad, datos de seguimiento o información para la recepción"
            value={formData.annotations}
            onChange={(event) => handleInputChange('annotations', event.target.value)}
          />
        </section>

        <div className={styles.footerBar}>
          <div className={styles.footerMeta}>
            <div className={styles.footerTitle}>Alta clínica preparada</div>
            <div className={styles.footerCopy}>Se guardarán datos personales, antecedentes médicos y archivo principal del paciente.</div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando paciente...' : 'Guardar paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}
