'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * 목록 상단 필터 바 — 국산인증 / 패션 DPP / 원단 DPP 목록이 공유한다.
 *
 * 검색어 입력은 공통이고, 페이지별 조건(상태·트랙·브랜드·공급사 등)은 children 으로 받는다.
 * 조건 자체를 여기서 정의하지 않는 이유: 세 목록의 축이 서로 달라서
 * 하나의 스키마로 묶으면 각 페이지에 안 맞는 필터가 생긴다.
 */
interface ListToolbarProps {
  query: string;
  onQueryChange: (v: string) => void;
  placeholder: string;
  /** 필터 적용 후 건수 / 전체 건수 */
  shown: number;
  total: number;
  unit?: string;
  /** 강조색 — 페이지 테마에 맞춘다 */
  accent?: Accent;
  children?: React.ReactNode;
}

const ACCENT_RING: Record<'emerald' | 'purple', string> = {
  emerald: 'focus-within:border-emerald-500/50',
  purple: 'focus-within:border-purple-500/50'
};

export function ListToolbar({
  query,
  onQueryChange,
  placeholder,
  shown,
  total,
  unit = '건',
  accent = 'emerald',
  children
}: ListToolbarProps) {
  return (
    <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex flex-col lg:flex-row lg:items-center gap-3">
      <div
        className={`relative flex-1 min-w-0 rounded-xl border border-white/10 bg-slate-900/60 transition-colors ${ACCENT_RING[accent]}`}
      >
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label="목록 검색"
          className="w-full bg-transparent pl-9 pr-8 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="검색어 지우기"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}

      <span className="text-[11px] text-slate-500 whitespace-nowrap lg:ml-auto shrink-0">
        {shown === total ? (
          <>
            {total.toLocaleString()}
            {unit}
          </>
        ) : (
          <>
            <strong className="text-slate-300">{shown.toLocaleString()}</strong>
            {unit} / {total.toLocaleString()}
            {unit}
          </>
        )}
      </span>
    </div>
  );
}

type Accent = 'emerald' | 'purple';

/** 선택된 상태의 강조 스타일 — 페이지 테마(패션=emerald, 원단=purple)를 따른다 */
const ACCENT_ACTIVE: Record<Accent, string> = {
  emerald: 'border-emerald-500/40 text-emerald-200',
  purple: 'border-purple-500/40 text-purple-200'
};
const ACCENT_PILL: Record<Accent, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/40'
};

/** 필터 셀렉트 — 툴바 안에서 쓰는 작은 드롭다운 */
export function FilterSelect({
  value,
  onChange,
  options,
  label,
  accent = 'emerald'
}: {
  value: string;
  onChange: (v: string) => void;
  /** [value, label] — value 가 '' 이면 '전체' 항목 */
  options: Array<[string, string]>;
  label: string;
  accent?: Accent;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`rounded-xl border bg-slate-900/60 px-3 py-2.5 text-xs outline-none cursor-pointer ${
        value ? ACCENT_ACTIVE[accent] : 'border-white/10 text-slate-400 hover:text-slate-200'
      }`}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v} className="bg-slate-900 text-slate-100">
          {l}
        </option>
      ))}
    </select>
  );
}

/** 필터 칩 그룹 — 값 개수가 적고 한눈에 보여야 할 때 */
export function FilterPills({
  value,
  onChange,
  options,
  label,
  accent = 'emerald'
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
  label: string;
  accent?: Accent;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`px-2.5 py-2 rounded-lg text-[11px] font-bold transition-colors ${
            value === v
              ? `border ${ACCENT_PILL[accent]}`
              : 'bg-slate-900/60 text-slate-400 border border-white/10 hover:text-slate-200'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
