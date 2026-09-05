'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { EcoScores, DeepComplianceData } from '@/types/dpp';
import { useChartPalette } from '@/lib/useTheme';
import { Leaf, Award, Activity } from 'lucide-react';

interface LcaRadarChartProps {
  ecoScores: EcoScores;
  deepData?: DeepComplianceData;
}

export const LcaRadarChart: React.FC<LcaRadarChartProps> = ({ ecoScores, deepData }) => {
  // recharts 는 색을 props 로 받으므로 CSS 변수만으로는 테마를 못 따라온다.
  const c = useChartPalette();

  const radarData = [
    { subject: '탄소 효율', score: Math.min(100, Math.round(100 - (ecoScores.totalCarbonKg / 25) * 100)), fullMark: 100 },
    { subject: '내구성', score: ecoScores.durabilityIndex * 10, fullMark: 100 },
    { subject: '수리용이성', score: ecoScores.repairabilityScore * 10, fullMark: 100 },
    { subject: '재활용률', score: ecoScores.recyclabilityRate, fullMark: 100 },
    { subject: '종합 에코스코어', score: ecoScores.overallScore, fullMark: 100 },
  ];

  const scopeData = deepData ? [
    { name: 'Scope 1 (직접)', value: deepData.scope1EmissionsKg, fill: c.scope1 },
    { name: 'Scope 2 (간접)', value: deepData.scope2EmissionsKg, fill: c.scope2 },
    { name: 'Scope 3 (공급망)', value: deepData.scope3EmissionsKg, fill: c.scope3 },
  ] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 5대 순환성/환경 지표 레이더 차트 */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              순환경제 5대 지속가능 지수
            </h4>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Score: {ecoScores.overallScore}/100
            </span>
          </div>
          <p className="text-[11px] text-slate-400">EU PEFCR 의류 표준 산정 지표</p>
        </div>

        <div className="h-56 w-full my-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke={c.grid} strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="subject" stroke={c.axis} tick={{ fontSize: 11, fill: c.tick }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={c.axis} tick={false} />
              <Radar
                name="kDPP 지수"
                dataKey="score"
                stroke={c.radar}
                fill={c.radar}
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
          <div className="p-2 rounded-xl bg-slate-900/60">
            <span className="text-[10px] text-slate-400 block">수명 지수</span>
            <span className="text-xs font-bold text-white">{ecoScores.durabilityIndex}/10</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60">
            <span className="text-[10px] text-slate-400 block">수리 지수</span>
            <span className="text-xs font-bold text-emerald-400">{ecoScores.repairabilityScore}/10</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/60">
            <span className="text-[10px] text-slate-400 block">재활용률</span>
            <span className="text-xs font-bold text-sky-400">{ecoScores.recyclabilityRate}%</span>
          </div>
        </div>
      </div>

      {/* 온실가스 Scope 1, 2, 3 상세 배출량 */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              전과정평가(LCA) 탄소발자국
            </h4>
            <span className="text-xs font-bold text-emerald-400">
              총 {ecoScores.totalCarbonKg} kg CO₂e
            </span>
          </div>
          <p className="text-[11px] text-slate-400">동급 일반 제품 대비 약 65% 저감 달성</p>
        </div>

        {deepData && (
          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopeData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke={c.axis} tick={{ fontSize: 10, fill: c.tick }} unit=" kg" />
                <YAxis dataKey="name" type="category" stroke={c.axis} tick={{ fontSize: 11, fill: c.tick }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, color: c.tooltipFg, borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: c.tooltipFg }}
                  labelStyle={{ color: c.tooltipFg }}
                  formatter={(value: any) => [`${value} kg CO₂e`, '배출량']}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400">탄소 등급:</span>
          <span className="px-2.5 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {ecoScores.carbonRating} Grade (최우수 친환경)
          </span>
        </div>
      </div>
    </div>
  );
};
