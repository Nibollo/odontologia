// Force recompile to refresh exports
import type {
  ClinicalEpisodeDto,
  ClinicalFindingDto,
  ClinicalSurfaceCode,
  OdontogramSnapshot,
  OdontogramSummary,
  OdontogramToothSnapshot,
  ToothSurface,
  TreatmentItemDto,
} from './types';

interface TreatmentLike {
  toothNumber?: string | null;
  surface?: string | null;
  description?: string | null;
  status?: string | null;
}

const ALL_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
] as const;

const SURFACE_CODE_MAP: Record<string, ToothSurface> = {
  V: 'vestibular',
  B: 'vestibular',
  F: 'vestibular',
  M: 'mesial',
  D: 'distal',
  L: 'lingual',
  P: 'lingual',
  O: 'occlusal',
  I: 'occlusal',
};

const SURFACE_TO_CARIES = {
  vestibular: 'caries-buccal',
  mesial: 'caries-mesial',
  distal: 'caries-distal',
  lingual: 'caries-lingual',
  occlusal: 'caries-occlusal',
} as const;

const SURFACE_TO_FILLING = {
  vestibular: 'buccal',
  mesial: 'mesial',
  distal: 'distal',
  lingual: 'lingual',
  occlusal: 'occlusal',
} as const;

const CARIES_CODE_TO_SURFACE: Record<string, ClinicalSurfaceCode> = {
  'caries-buccal': 'V',
  'caries-mesial': 'M',
  'caries-distal': 'D',
  'caries-lingual': 'L',
  'caries-occlusal': 'O',
  'caries-subcrown': 'ROOT',
};

const FILLING_SURFACE_TO_CODE: Record<string, ClinicalSurfaceCode> = {
  buccal: 'V',
  mesial: 'M',
  distal: 'D',
  lingual: 'L',
  occlusal: 'O',
};

export function createEmptyOdontogramTooth(): OdontogramToothSnapshot {
  return {
    toothSelection: 'tooth-base',
    pulpInflam: false,
    endoResection: false,
    mods: [],
    endo: 'none',
    caries: [],
    fillingMaterial: 'none',
    fillingSurfaces: [],
    fissureSealing: false,
    contactMesial: false,
    contactDistal: false,
    bruxismWear: false,
    bruxismNeckWear: false,
    brokenMesial: false,
    brokenIncisal: false,
    brokenDistal: false,
    extractionWound: false,
    extractionPlan: false,
    parapulpalPin: false,
    crownReplace: false,
    crownNeeded: false,
    missingClosed: false,
    bridgePillar: false,
    bridgeUnit: 'none',
    mobility: 'none',
    crownMaterial: 'natural',
    customStates: {},
    note: '',
  };
}

export function createEmptyOdontogramSnapshot(): OdontogramSnapshot {
  const teeth = ALL_TEETH.reduce<Record<number, OdontogramToothSnapshot>>((accumulator, toothNumber) => {
    accumulator[toothNumber] = createEmptyOdontogramTooth();
    return accumulator;
  }, {});

  return {
    version: '1.3',
    globals: {
      wisdomVisible: true,
      showBase: true,
      occlusalVisible: true,
      showHealthyPulp: true,
      edentulous: false,
    },
    teeth,
  };
}

export function normalizeOdontogramSnapshot(
  snapshot?: Partial<OdontogramSnapshot> | null,
): OdontogramSnapshot {
  const fallback = createEmptyOdontogramSnapshot();
  if (!snapshot || typeof snapshot !== 'object') {
    return fallback;
  }

  const rawTeeth = snapshot.teeth && typeof snapshot.teeth === 'object' ? snapshot.teeth : {};
  const teeth = ALL_TEETH.reduce<Record<number, OdontogramToothSnapshot>>((accumulator, toothNumber) => {
    const rawTooth = rawTeeth[toothNumber];
    accumulator[toothNumber] = {
      ...createEmptyOdontogramTooth(),
      ...(rawTooth ?? {}),
      mods: Array.isArray(rawTooth?.mods) ? rawTooth.mods : [],
      caries: Array.isArray(rawTooth?.caries) ? rawTooth.caries : [],
      fillingSurfaces: Array.isArray(rawTooth?.fillingSurfaces) ? rawTooth.fillingSurfaces : [],
      customStates:
        rawTooth?.customStates && typeof rawTooth.customStates === 'object' ? rawTooth.customStates : {},
      note: typeof rawTooth?.note === 'string' ? rawTooth.note : '',
    };
    return accumulator;
  }, {});

  return {
    version: typeof snapshot.version === 'string' ? snapshot.version : fallback.version,
    globals: {
      ...fallback.globals,
      ...(snapshot.globals ?? {}),
    },
    teeth,
  };
}

export function buildOdontogramSnapshotFromTreatments(
  treatments: TreatmentLike[],
): OdontogramSnapshot {
  const snapshot = createEmptyOdontogramSnapshot();

  for (const treatment of treatments) {
    const toothNumber = Number(treatment.toothNumber);
    if (!Number.isInteger(toothNumber) || !(toothNumber in snapshot.teeth)) {
      continue;
    }

    const current = snapshot.teeth[toothNumber];
    const description = (treatment.description ?? '').toLowerCase();
    const normalizedSurface = treatment.surface ? SURFACE_CODE_MAP[treatment.surface.toUpperCase()] : null;

    if (description.includes('implan')) {
      current.toothSelection = 'implant';
    }

    if (description.includes('ausente') || description.includes('extrac')) {
      current.toothSelection = 'no-tooth-after-extraction';
      current.extractionWound = description.includes('reciente') || description.includes('wound');
      continue;
    }

    if (description.includes('corona')) {
      current.crownMaterial = description.includes('zircon')
        ? 'zircon'
        : description.includes('metal')
          ? 'metal'
          : description.includes('tempo')
            ? 'temporary'
            : 'emax';
    }

    if (description.includes('endo') || description.includes('conducto') || description.includes('canal')) {
      current.endo = 'endo-filling';
    }

    if (description.includes('movilidad')) {
      current.mobility = 'm1';
    }

    if (description.includes('fract') || description.includes('quebrado')) {
      current.crownMaterial = 'broken';
    }

    if (description.includes('plan') && description.includes('extrac')) {
      current.extractionPlan = true;
    }

    if (!normalizedSurface) {
      const planned = treatment.status === 'PLANNED';
      if (planned || description.includes('caries')) {
        current.caries = ['caries-buccal', 'caries-mesial', 'caries-distal', 'caries-lingual', 'caries-occlusal'];
      } else if (description) {
        current.fillingMaterial = current.fillingMaterial === 'none' ? 'composite' : current.fillingMaterial;
        current.fillingSurfaces = ['buccal', 'mesial', 'distal', 'lingual', 'occlusal'];
      }
      continue;
    }

    if (treatment.status === 'PLANNED' || description.includes('caries')) {
      const cariesCode = SURFACE_TO_CARIES[normalizedSurface];
      if (!current.caries.includes(cariesCode)) {
        current.caries = [...current.caries, cariesCode];
      }
      continue;
    }

    const fillingSurface = SURFACE_TO_FILLING[normalizedSurface];
    current.fillingMaterial = current.fillingMaterial === 'none' ? 'composite' : current.fillingMaterial;
    if (!current.fillingSurfaces.includes(fillingSurface)) {
      current.fillingSurfaces = [...current.fillingSurfaces, fillingSurface];
    }
  }

  return snapshot;
}

export function summarizeOdontogramSnapshot(snapshot: OdontogramSnapshot): OdontogramSummary {
  const teeth = Object.values(snapshot.teeth);
  return {
    changedTeeth: teeth.filter(hasMeaningfulChanges).length,
    cariesTeeth: teeth.filter((tooth) => tooth.caries.length > 0).length,
    restoredTeeth: teeth.filter((tooth) => tooth.fillingMaterial !== 'none' || tooth.fillingSurfaces.length > 0).length,
    missingTeeth: teeth.filter((tooth) =>
      tooth.toothSelection === 'none' || tooth.toothSelection === 'no-tooth-after-extraction',
    ).length,
    implantTeeth: teeth.filter((tooth) => tooth.toothSelection === 'implant').length,
    endoTeeth: teeth.filter((tooth) => tooth.endo !== 'none').length,
    mobilityTeeth: teeth.filter((tooth) => tooth.mobility !== 'none').length,
    noteTeeth: teeth.filter((tooth) => (tooth.note || '').trim().length > 0).length,
  };
}

export function hasMeaningfulChanges(tooth: OdontogramToothSnapshot): boolean {
  return (
    tooth.toothSelection !== 'tooth-base' ||
    tooth.caries.length > 0 ||
    tooth.fillingMaterial !== 'none' ||
    tooth.fillingSurfaces.length > 0 ||
    tooth.endo !== 'none' ||
    tooth.mobility !== 'none' ||
    tooth.mods.length > 0 ||
    tooth.fissureSealing ||
    tooth.extractionPlan ||
    tooth.extractionWound ||
    tooth.pulpInflam ||
    tooth.endoResection ||
    tooth.parapulpalPin ||
    tooth.crownReplace ||
    tooth.crownNeeded ||
    tooth.bridgePillar ||
    tooth.bridgeUnit !== 'none' ||
    tooth.crownMaterial !== 'natural' ||
    (tooth.note || '').trim().length > 0
  );
}

export function formatRelativeSummary(summary: OdontogramSummary): string[] {
  return [
    `${summary.changedTeeth} piezas con hallazgos`,
    `${summary.cariesTeeth} con caries activas`,
    `${summary.restoredTeeth} restauradas`,
    `${summary.missingTeeth} ausentes`,
  ];
}

function createDraftFindingId(parts: Array<string | number | null | undefined>) {
  return parts.filter(Boolean).join(':');
}

function createDraftTreatmentId(key: string) {
  return `draft-treatment:${key}`;
}

export function extractClinicalFindingsFromSnapshot(snapshot: OdontogramSnapshot): ClinicalFindingDto[] {
  const findings: ClinicalFindingDto[] = [];
  const notedAt = new Date(0).toISOString();

  for (const [toothNumber, tooth] of Object.entries(snapshot.teeth)) {
    for (const caries of tooth.caries) {
      findings.push({
        id: createDraftFindingId(['caries', toothNumber, caries]),
        toothNumber,
        surfaceCode: CARIES_CODE_TO_SURFACE[caries] ?? 'ROOT',
        scope: caries === 'caries-subcrown' ? 'ROOT' : 'SURFACE',
        code: caries,
        label: `Caries ${caries.replace('caries-', '')}`,
        category: 'caries',
        status: 'ACTIVE',
        payload: null,
        notedAt,
      });
    }

    if (tooth.fillingMaterial !== 'none') {
      if (tooth.fillingSurfaces.length === 0) {
        findings.push({
          id: createDraftFindingId(['restoration', toothNumber, tooth.fillingMaterial]),
          toothNumber,
          surfaceCode: null,
          scope: 'TOOTH',
          code: `restoration-${tooth.fillingMaterial}`,
          label: `Restauracion ${tooth.fillingMaterial}`,
          category: 'restoration',
          status: 'ACTIVE',
          payload: {
            material: tooth.fillingMaterial,
          },
          notedAt,
        });
      }

      for (const surface of tooth.fillingSurfaces) {
        findings.push({
          id: createDraftFindingId(['restoration', toothNumber, surface, tooth.fillingMaterial]),
          toothNumber,
          surfaceCode: FILLING_SURFACE_TO_CODE[surface] ?? null,
          scope: 'SURFACE',
          code: `restoration-${surface}`,
          label: `Restauracion ${surface}`,
          category: 'restoration',
          status: 'ACTIVE',
          payload: {
            material: tooth.fillingMaterial,
          },
          notedAt,
        });
      }
    }

    if (tooth.endo !== 'none') {
      findings.push({
        id: createDraftFindingId(['endo', toothNumber, tooth.endo]),
        toothNumber,
        surfaceCode: null,
        scope: 'TOOTH',
        code: tooth.endo,
        label: 'Endodoncia / conducto',
        category: 'endo',
        status: 'ACTIVE',
        payload: {
          variant: tooth.endo,
          pulpInflam: tooth.pulpInflam,
          endoResection: tooth.endoResection,
        },
        notedAt,
      });
    }

    if (tooth.toothSelection === 'implant') {
      findings.push({
        id: createDraftFindingId(['implant', toothNumber]),
        toothNumber,
        surfaceCode: null,
        scope: 'TOOTH',
        code: 'implant',
        label: 'Implante',
        category: 'implant',
        status: 'ACTIVE',
        payload: null,
        notedAt,
      });
    }

    if (tooth.toothSelection === 'no-tooth-after-extraction' || tooth.extractionPlan) {
      findings.push({
        id: createDraftFindingId(['exodontia', toothNumber, tooth.extractionPlan ? 'plan' : 'missing']),
        toothNumber,
        surfaceCode: null,
        scope: 'TOOTH',
        code: tooth.extractionPlan ? 'extraction-plan' : 'missing-tooth',
        label: tooth.extractionPlan ? 'Extraccion planificada' : 'Pieza ausente',
        category: 'exodontia',
        status: tooth.extractionPlan ? 'PLANNED' : 'ACTIVE',
        payload: {
          extractionWound: tooth.extractionWound,
        },
        notedAt,
      });
    }

    if (tooth.mobility !== 'none') {
      findings.push({
        id: createDraftFindingId(['periodontal', toothNumber, tooth.mobility]),
        toothNumber,
        surfaceCode: null,
        scope: 'TOOTH',
        code: `mobility-${tooth.mobility}`,
        label: `Movilidad ${tooth.mobility.toUpperCase()}`,
        category: 'periodontal',
        status: 'ACTIVE',
        payload: {
          mobility: tooth.mobility,
        },
        notedAt,
      });
    }

    for (const mod of tooth.mods) {
      findings.push({
        id: createDraftFindingId(['periodontal', toothNumber, mod]),
        toothNumber,
        surfaceCode: null,
        scope: 'TOOTH',
        code: mod,
        label: mod === 'inflammation' ? 'Inflamacion periapical' : 'Hallazgo periodontal',
        category: 'periodontal',
        status: 'ACTIVE',
        payload: {
          mobility: tooth.mobility !== 'none' ? tooth.mobility : undefined,
        },
        notedAt,
      });
    }

    if ((tooth.note || '').trim()) {
      findings.push({
        id: createDraftFindingId(['note', toothNumber]),
        toothNumber,
        surfaceCode: null,
        scope: 'TOOTH',
        code: 'tooth-note',
        label: 'Nota clinica',
        category: 'note',
        status: 'ACTIVE',
        payload: {
          note: tooth.note.trim(),
        },
        notedAt,
      });
    }
  }

  return findings;
}

export function buildDetailedTreatmentPlan_V2(findings: ClinicalFindingDto[]): TreatmentItemDto[] {
  const items: TreatmentItemDto[] = [];
  const createdAt = new Date().toISOString();

  for (const finding of findings) {
    if (finding.category === 'note') continue; // Notes are not treatment items

    let title = '';
    let description = '';
    let estimatedCost = 0;
    const diagnosisCode = finding.category.toUpperCase();
    let status: TreatmentItemDto['status'] = 'PROPOSED';

    switch (finding.category) {
      case 'caries':
        title = finding.scope === 'SURFACE' ? `Obturación de superficie ${finding.surfaceCode}` : 'Obturación compleja';
        description = `Tratamiento restaurador para caries detectada en pieza ${finding.toothNumber}.`;
        estimatedCost = finding.scope === 'SURFACE' ? 180000 : 280000;
        status = 'PLANNED';
        break;
      
      case 'exodontia':
        if (finding.code === 'extraction-plan') {
          title = 'Exodoncia (Cirugía)';
          description = `Extracción quirúrgica planificada de la pieza ${finding.toothNumber}.`;
          estimatedCost = 150000;
          status = 'PLANNED';
        } else {
          title = 'Rehabilitación protésica';
          description = `Reposición de pieza ${finding.toothNumber} ausente.`;
          estimatedCost = 800000;
        }
        break;

      case 'endo':
        title = 'Tratamiento de conducto (Endodoncia)';
        description = `Tratamiento endodóntico para la pieza ${finding.toothNumber}.`;
        estimatedCost = 600000;
        status = 'PLANNED';
        break;

      case 'implant':
        title = 'Mantenimiento de implante';
        description = `Control y mantenimiento preventivo de implante en pieza ${finding.toothNumber}.`;
        estimatedCost = 250000;
        break;

      case 'periodontal':
        title = 'Tratamiento periodontal / Profilaxis';
        description = `Control de salud periodontal para la pieza ${finding.toothNumber}.`;
        estimatedCost = 120000;
        break;

      case 'restoration':
        // If it's already there, it's historical or needs check
        title = 'Control de restauración';
        description = `Verificación de estado de restauración previa en pieza ${finding.toothNumber}.`;
        estimatedCost = 0;
        status = 'COMPLETED';
        break;

      default:
        title = finding.label;
        description = `Tratamiento sugerido para: ${finding.label}`;
        estimatedCost = 0;
    }

    items.push({
      id: `draft-plan:${finding.id}`,
      title,
      description,
      status,
      estimatedCost,
      actualCost: null,
      createdAt,
      toothNumber: finding.toothNumber,
      surfaceCode: finding.surfaceCode,
      diagnosisCode,
      episodeId: finding.episodeId,
      completedAt: null,
    });
  }

  // Sort items: PLANNED first, then PROPOSED, then COMPLETED
  const statusWeight: Record<string, number> = {
    'PLANNED': 0,
    'IN_PROGRESS': 1,
    'PROPOSED': 2,
    'COMPLETED': 3,
    'CANCELLED': 4
  };

  return items.sort((a, b) => (statusWeight[a.status] ?? 5) - (statusWeight[b.status] ?? 5));
}

export function summarizeClinicalEpisode(
  snapshot: OdontogramSnapshot,
  findings: ClinicalFindingDto[],
  treatments: TreatmentItemDto[],
): ClinicalEpisodeDto['summary'] {
  return {
    ...summarizeOdontogramSnapshot(snapshot),
    activeFindings: findings.length,
    suggestedTreatments: treatments.length,
    estimatedCost: treatments.reduce((sum, treatment) => sum + (treatment.estimatedCost ?? 0), 0),
  };
}
// Backward compatibility alias
export { buildDetailedTreatmentPlan_V2 as buildTreatmentItemsFromFindings };
export { buildDetailedTreatmentPlan_V2 as buildDetailedTreatmentPlan };
