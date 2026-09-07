export type ToothSurface = 'vestibular' | 'mesial' | 'distal' | 'lingual' | 'occlusal';

export type SurfaceVisualZone = 'top' | 'right' | 'bottom' | 'left' | 'center';

export type SurfaceState = 'healthy' | 'caries' | 'filling';

export type OdontogramTool = 'caries' | 'filling' | 'absent' | 'clear';

export type OdontogramToothSelection =
  | 'none'
  | 'tooth-base'
  | 'milktooth'
  | 'implant'
  | 'tooth-crownprep'
  | 'tooth-under-gum'
  | 'no-tooth-after-extraction';

export type OdontogramEndoState =
  | 'none'
  | 'endo-medical-filling'
  | 'endo-filling'
  | 'endo-filling-incomplete'
  | 'endo-glass-pin'
  | 'endo-metal-pin';

export type OdontogramFillingMaterial = 'none' | 'amalgam' | 'composite' | 'gic' | 'temporary';

export type OdontogramBridgeUnit =
  | 'none'
  | 'removable'
  | 'zircon'
  | 'metal'
  | 'temporary'
  | 'bar'
  | 'bar-prosthesis';

export type OdontogramMobility = 'none' | 'm1' | 'm2' | 'm3';

export type OdontogramCrownMaterial =
  | 'natural'
  | 'broken'
  | 'radix'
  | 'emax'
  | 'zircon'
  | 'metal'
  | 'temporary'
  | 'telescope'
  | 'healing-abutment'
  | 'locator'
  | 'locator-prosthesis'
  | 'bar'
  | 'bar-prosthesis';

export type OdontogramMod = 'inflammation' | 'parodontal' | 'mobility';

export type OdontogramCaries =
  | 'caries-subcrown'
  | 'caries-buccal'
  | 'caries-lingual'
  | 'caries-mesial'
  | 'caries-distal'
  | 'caries-occlusal';

export type OdontogramFillingSurface = 'buccal' | 'lingual' | 'mesial' | 'distal' | 'occlusal';

export type MatrixRowValue = string | number[];

export interface ToothState {
  crown: SurfaceState;
  vestibular: SurfaceState;
  mesial: SurfaceState;
  distal: SurfaceState;
  lingual: SurfaceState;
  occlusal: SurfaceState;
  root: SurfaceState;
  absent?: boolean;
}

export type TeethStateRecord = Record<number, ToothState>;

export type PeriodontalMatrixState = Record<number, Record<string, MatrixRowValue>>;

export interface OdontogramToothSnapshot {
  toothSelection: OdontogramToothSelection;
  pulpInflam: boolean;
  endoResection: boolean;
  mods: OdontogramMod[];
  endo: OdontogramEndoState;
  caries: OdontogramCaries[];
  fillingMaterial: OdontogramFillingMaterial;
  fillingSurfaces: OdontogramFillingSurface[];
  fissureSealing: boolean;
  contactMesial: boolean;
  contactDistal: boolean;
  bruxismWear: boolean;
  bruxismNeckWear: boolean;
  brokenMesial: boolean;
  brokenIncisal: boolean;
  brokenDistal: boolean;
  extractionWound: boolean;
  extractionPlan: boolean;
  parapulpalPin: boolean;
  crownReplace: boolean;
  crownNeeded: boolean;
  missingClosed: boolean;
  bridgePillar: boolean;
  bridgeUnit: OdontogramBridgeUnit;
  mobility: OdontogramMobility;
  crownMaterial: OdontogramCrownMaterial;
  customStates: Record<string, unknown>;
  note: string;
  /** Simplified per-tooth periodontal chart (probing depth / attachment loss, in mm). */
  periodontal: { probingDepth?: number; attachmentLoss?: number } | null;
  /** Free-text notes keyed by finding id (e.g. "caries:11:caries-mesial"). */
  findingNotes: Record<string, string>;
}

export interface OdontogramSnapshot {
  version: string;
  globals: {
    wisdomVisible: boolean;
    showBase: boolean;
    occlusalVisible: boolean;
    showHealthyPulp: boolean;
    edentulous: boolean;
  };
  teeth: Record<number, OdontogramToothSnapshot>;
}

export interface OdontogramSummary {
  changedTeeth: number;
  cariesTeeth: number;
  restoredTeeth: number;
  missingTeeth: number;
  implantTeeth: number;
  endoTeeth: number;
  mobilityTeeth: number;
  noteTeeth: number;
  periodontalTeeth: number;
}

export interface MatrixRowDefinition {
  key: string;
  label: string;
  kind: 'input' | 'triple';
}

export type ClinicalSurfaceCode = 'V' | 'M' | 'D' | 'L' | 'O' | 'ROOT';

export type ClinicalFindingScopeDto = 'TOOTH' | 'SURFACE' | 'ROOT' | 'ARCH' | 'GENERAL';

export type ClinicalFindingStatusDto = 'ACTIVE' | 'RESOLVED' | 'PLANNED' | 'HISTORICAL';

export type TreatmentItemStatusDto = 'PROPOSED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ClinicalFindingDto {
  id: string;
  episodeId?: string | null;
  toothNumber?: string | null;
  surfaceCode?: ClinicalSurfaceCode | null;
  scope: ClinicalFindingScopeDto;
  code: string;
  label: string;
  category: string;
  severity?: string | null;
  status: ClinicalFindingStatusDto;
  payload?: Record<string, unknown> | null;
  notedAt: string;
  resolvedAt?: string | null;
}

export interface TreatmentItemDto {
  id: string;
  episodeId?: string | null;
  toothNumber?: string | null;
  surfaceCode?: ClinicalSurfaceCode | null;
  diagnosisCode?: string | null;
  title: string;
  description?: string | null;
  status: TreatmentItemStatusDto;
  estimatedCost?: number | null;
  actualCost?: number | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface ClinicalEpisodeDto {
  id: string;
  type: 'EXAM' | 'PERIODONTAL_CONTROL' | 'TREATMENT_VISIT' | 'EMERGENCY';
  title?: string | null;
  note?: string | null;
  snapshot?: OdontogramSnapshot | null;
  summary?: OdontogramSummary | Record<string, unknown> | null;
  createdAt: string;
  dentist?: {
    name: string;
  } | null;
  findings: ClinicalFindingDto[];
  treatments: TreatmentItemDto[];
}
