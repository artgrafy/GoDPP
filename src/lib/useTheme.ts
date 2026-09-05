'use client';

import { useEffect, useState } from 'react';

/**
 * 현재 적용된 테마를 읽는다.
 *
 * CSS 변수로 색이 뒤집히는 부분은 마크업 수정이 필요 없지만,
 * recharts 처럼 색을 **props 로 받는** 라이브러리는 JS 에서 값을 알아야 한다.
 * data-theme 속성을 관찰해 전환 즉시 다시 그리게 한다.
 */
export type ResolvedTheme = 'light' | 'dark';

export function useTheme(): ResolvedTheme {
  // 서버 렌더와 어긋나지 않도록 기본값은 다크(=layout 의 초기 속성)로 둔다.
  const [theme, setTheme] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    const read = (): ResolvedTheme =>
      document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

    setTheme(read());
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

/** 차트처럼 색을 값으로 받아야 하는 곳에서 쓰는 팔레트 */
export interface ChartPalette {
  grid: string;
  axis: string;
  tick: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipFg: string;
  scope1: string;
  scope2: string;
  scope3: string;
  radar: string;
}

const PALETTE: Record<ResolvedTheme, ChartPalette> = {
  dark: {
    grid: '#334155',
    axis: '#64748b',
    tick: '#cbd5e1',
    tooltipBg: '#0f172a',
    tooltipBorder: '#334155',
    tooltipFg: '#f8fafc',
    scope1: '#10b981',
    scope2: '#0ea5e9',
    scope3: '#8b5cf6',
    radar: '#10b981'
  },
  light: {
    grid: '#cbd5e1',
    axis: '#94a3b8',
    // 밝은 바탕에서 읽히도록 축 글자를 진하게 내린다(다크의 #cbd5e1 은 흰 배경에서 안 보인다)
    tick: '#334155',
    tooltipBg: '#ffffff',
    tooltipBorder: '#cbd5e1',
    tooltipFg: '#0f172a',
    scope1: '#047857',
    scope2: '#0369a1',
    scope3: '#6d28d9',
    radar: '#047857'
  }
};

export function useChartPalette(): ChartPalette {
  return PALETTE[useTheme()];
}
