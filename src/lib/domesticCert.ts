import type { MaterialComposition } from '@/types/dpp';
import type {
  DomesticOrigin,
  EvaluateInput,
  ProcessKey,
  ProcessSource,
  RatioBasis,
  RatioWarning,
  TriState
} from '@/types/domesticCert';

/**
 * 제품/원단의 국산 공정 이력 요약 엔진 (순수 함수 — React 의존 없음)
 *
 * 핵심 규칙: null(미확인)을 false(국외)와 동일 취급하지 않는다.
 */

const PROCESS_KEYS: ProcessKey[] = ['yarn', 'weaving', 'dyeing', 'sewing'];

const ORIGIN_FIELD: Record<ProcessKey, keyof DomesticOrigin> = {
  yarn: 'is_domestic_yarn',
  weaving: 'is_domestic_weaving',
  dyeing: 'is_domestic_dyeing',
  sewing: 'is_domestic_sewing'
};

export const PROCESS_LABEL: Record<ProcessKey, string> = {
  yarn: '원사 방적',
  weaving: '제직·편직',
  dyeing: '염색·가공',
  sewing: '봉제'
};

// ==============================================================================
// 1. 공정 플래그 해석
// ==============================================================================

/** undefined/null 은 건너뛰고 false 는 값으로 유지한다. */
function pick(...candidates: Array<TriState | undefined>): TriState {
  for (const c of candidates) {
    if (c === true || c === false) return c;
  }
  return null;
}

function readFlag(origin: DomesticOrigin | undefined | null, key: ProcessKey): TriState {
  if (!origin) return null;
  const raw = origin[ORIGIN_FIELD[key]];
  return raw === true || raw === false ? raw : null;
}

export function resolveProcessFlags(input: EvaluateInput): {
  flags: Record<ProcessKey, TriState>;
  source: Record<ProcessKey, ProcessSource>;
  hasFabricLink: boolean;
} {
  const { subjectType, fabric, passport, override } = input;

  const snapshotOrigin = passport?.fabric_snapshot?.domestic_origin ?? null;
  const hasFabricLink = Boolean(passport?.fabric_id || passport?.fabric_snapshot?.id);

  const flags = {} as Record<ProcessKey, TriState>;
  const source = {} as Record<ProcessKey, ProcessSource>;

  for (const key of PROCESS_KEYS) {
    // 봉제는 완제품 전용 공정이다.
    if (key === 'sewing' && subjectType === 'fabric') {
      flags[key] = null;
      source[key] = 'none';
      continue;
    }

    const fromOverride = readFlag(override, key);
    const fromPassport = subjectType === 'passport' ? readFlag(passport?.domestic_origin, key) : null;
    const fromFabric = readFlag(fabric?.domestic_origin, key);
    const fromSnapshot = subjectType === 'passport' ? readFlag(snapshotOrigin, key) : null;

    const value = pick(fromOverride, fromPassport, fromFabric, fromSnapshot);
    flags[key] = value;

    if (value === null) {
      source[key] = 'none';
    } else if (fromOverride !== null) {
      source[key] = 'override';
    } else if (fromPassport !== null) {
      source[key] = 'passport';
    } else {
      source[key] = 'fabric';
    }
  }

  return { flags, source, hasFabricLink };
}

// ==============================================================================
// 2. 국산 혼용률 (참고 지표)
// ==============================================================================

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function computeDomesticRatio(input: EvaluateInput): {
  ratio: number | null;
  basis: RatioBasis;
  warning: RatioWarning;
} {
  const { subjectType, fabric, passport, override } = input;

  const comps: MaterialComposition[] =
    subjectType === 'passport'
      ? passport?.materials_summary?.length
        ? passport.materials_summary
        : passport?.fabric_snapshot?.composition ?? fabric?.composition ?? []
      : fabric?.composition ?? [];

  const valid = comps.filter(
    (c) => c && Number.isFinite(c.percentage) && (c.percentage as number) > 0
  );

  const flagged = valid.some((c) => typeof c.isDomestic === 'boolean');

  if (!flagged) {
    // 소재별 근거가 없으면 신고값으로만 폴백한다. 그것도 없으면 추정하지 않는다.
    const declared =
      override?.declaredDomesticRatio ??
      (subjectType === 'passport'
        ? passport?.domestic_origin?.declaredDomesticRatio
        : fabric?.domestic_origin?.declaredDomesticRatio);

    if (typeof declared === 'number' && Number.isFinite(declared)) {
      return { ratio: clamp(declared, 0, 100), basis: 'declared', warning: null };
    }
    return { ratio: null, basis: 'unavailable', warning: null };
  }

  const totalPct = valid.reduce((sum, c) => sum + (c.percentage as number), 0);
  if (totalPct <= 0) {
    return { ratio: null, basis: 'unavailable', warning: null };
  }

  const domesticPct = valid
    .filter((c) => c.isDomestic === true)
    .reduce((sum, c) => sum + (c.percentage as number), 0);

  // 합계가 100이 아니어도 실제 합계로 정규화하고, 사실은 경고로 알린다.
  const ratio = Math.round((domesticPct / totalPct) * 1000) / 10;
  const warning: RatioWarning =
    Math.abs(totalPct - 100) > 0.5 ? 'COMPOSITION_SUM_NOT_100' : null;

  return { ratio, basis: 'material_flags', warning };
}

// ==============================================================================
// 3. 제품 단위 국산 공정 요약
// ==============================================================================

export interface DomesticProcessSummary {
  processes: Record<ProcessKey, TriState>;
  processSource: Record<ProcessKey, ProcessSource>;
  /** 이 대상에서 의미 있는 공정 (원단은 봉제를 제외한 3개) */
  stages: ProcessKey[];
  domesticCount: number;
  foreignCount: number;
  unknownCount: number;
  hasFabricLink: boolean;
  domesticRatio: number | null;
  ratioBasis: 'material_flags' | 'declared' | 'unavailable';
  ratioWarning: 'COMPOSITION_SUM_NOT_100' | null;
}

export function summarizeDomesticProcesses(input: EvaluateInput): DomesticProcessSummary {
  const { flags, source, hasFabricLink } = resolveProcessFlags(input);
  const { ratio, basis, warning } = computeDomesticRatio(input);
  const stages: ProcessKey[] =
    input.subjectType === 'fabric'
      ? ['yarn', 'weaving', 'dyeing']
      : ['yarn', 'weaving', 'dyeing', 'sewing'];

  return {
    processes: flags,
    processSource: source,
    stages,
    domesticCount: stages.filter((s) => flags[s] === true).length,
    foreignCount: stages.filter((s) => flags[s] === false).length,
    unknownCount: stages.filter((s) => flags[s] === null).length,
    hasFabricLink,
    domesticRatio: ratio,
    ratioBasis: basis,
    ratioWarning: warning
  };
}
