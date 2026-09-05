'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

/**
 * 라이트/다크 전환.
 *
 * 정적 export 라 서버가 없다 — 테마는 브라우저에서만 정해진다.
 * 첫 페인트 전에 layout.tsx 의 인라인 스크립트가 data-theme 을 이미 박아 두므로
 * 이 컴포넌트는 '현재 값을 읽어 UI 를 맞추고, 바꾸면 저장'하는 역할만 한다.
 *
 * 세 상태를 돈다: 시스템 → 라이트 → 다크 → 시스템
 * '시스템'을 남겨 둔 이유는 OS 설정을 따르고 싶은 사용자가 실제로 있기 때문이고,
 * 저장값이 없을 때의 기본값이기도 하다.
 */
export type ThemePref = 'system' | 'light' | 'dark';

export const THEME_KEY = 'godpp_theme';

function systemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(pref: ThemePref) {
  const resolved = pref === 'system' ? systemTheme() : pref;
  document.documentElement.setAttribute('data-theme', resolved);
}

const NEXT: Record<ThemePref, ThemePref> = {
  system: 'light',
  light: 'dark',
  dark: 'system'
};

const META: Record<ThemePref, { icon: typeof Sun; label: string }> = {
  system: { icon: Monitor, label: '시스템 설정' },
  light: { icon: Sun, label: '라이트 모드' },
  dark: { icon: Moon, label: '다크 모드' }
};

export function ThemeToggle({ className = '' }: { className?: string }) {
  // 서버 렌더 결과와 어긋나지 않도록 마운트 전에는 아이콘을 확정하지 않는다.
  const [pref, setPref] = useState<ThemePref>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {
      /* 프라이빗 모드 등에서 접근이 막힐 수 있다 — 기본값으로 계속 간다 */
    }
    const initial: ThemePref =
      stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    setPref(initial);
    setMounted(true);
  }, []);

  // '시스템'일 때는 OS 설정 변경을 따라간다.
  useEffect(() => {
    if (!mounted || pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mounted, pref]);

  const cycle = () => {
    const next = NEXT[pref];
    setPref(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* 저장이 막혀도 이번 세션 동안은 전환이 유지된다 */
    }
  };

  const { icon: Icon, label } = META[pref];

  return (
    <button
      type="button"
      onClick={cycle}
      title={`테마: ${label} (클릭하면 ${META[NEXT[pref]].label})`}
      aria-label={`테마 전환 — 현재 ${label}`}
      className={`p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 border border-white/10 transition-colors ${className}`}
    >
      {/* 마운트 전에는 아이콘을 비워 서버/클라이언트 렌더가 갈리지 않게 한다 */}
      {mounted ? <Icon className="w-4 h-4" /> : <span className="block w-4 h-4" />}
    </button>
  );
}
