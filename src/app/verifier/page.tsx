'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { getPassports, getFabrics, getAuditLogs } from '@/lib/supabase';
import { FashionDPP, FabricDPP, AuditLog } from '@/types/dpp';
import { DeepDataModal } from '@/components/DeepDataModal';
import { 
  ShieldCheck, 
  FileText, 
  Search, 
  Lock, 
  Download, 
  Building, 
  CheckCircle2, 
  Activity, 
  History,
  ExternalLink,
  Cpu
} from 'lucide-react';

export default function VerifierPortalPage() {
  const router = useRouter();
  const [passports, setPassports] = useState<FashionDPP[]>([]);
  const [fabrics, setFabrics] = useState<FabricDPP[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPassportForDeep, setSelectedPassportForDeep] = useState<FashionDPP | null>(null);

  useEffect(() => {
    async function load() {
      const [p, f] = await Promise.all([getPassports(), getFabrics()]);
      setPassports(p);
      setFabrics(f);
      setAuditLogs(getAuditLogs());
    }
    load();
  }, []);

  const filteredPassports = passports.filter(
    (p) =>
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Header currentRole="verifier" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-white">국가·검증기관 심층 감사 포털</h1>
            </div>
            <p className="text-xs text-slate-400">
              세관 통관, 시장 감시, 공인 시험인증기관을 위한 EU ESPR 규제 적합성 검증 및 LCA 원장 조회
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              인증기관 보안 세션 활성화
            </span>
          </div>
        </div>

        {/* 4대 규제 검증 지표 요약 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">감사 대상 완제품 DPP</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{passports.length}건</div>
            <span className="text-[11px] text-emerald-400 mt-1 block">100% 규제 적합성 통과</span>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">추적 등록 원단 소재</span>
              <Building className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{fabrics.length}종</div>
            <span className="text-[11px] text-sky-400 mt-1 block">공인 시험인증서 연동</span>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">유해물질(PFAS/SVHC)</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">0 건 검출</div>
            <span className="text-[11px] text-slate-400 mt-1 block">전수 불검출 보증</span>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">온체인 위변조 방지</span>
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">100%</div>
            <span className="text-[11px] text-amber-400 mt-1 block">DID 서명 검증 완료</span>
          </div>
        </div>

        {/* 규제 감사 목록 & 검색 */}
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                완제품 DPP 규제 심사 목록
              </h3>
              <p className="text-xs text-slate-400">
                원하는 제품의 [심층 감사 데이터 조회]를 클릭하여 세부 LCA 및 세관 정보를 열람합니다.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="제품명, DPP ID, 브랜드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full glass-input pl-9 pr-4 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-white/5">
                <tr>
                  <th className="p-4">DPP ID / 제품명</th>
                  <th className="p-4">HS 통관코드</th>
                  <th className="p-4">LCA 산정 표준</th>
                  <th className="p-4">Scope 1/2/3 배출</th>
                  <th className="p-4">SVHC 유해화학</th>
                  <th className="p-4 text-right">심층 감사</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPassports.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-emerald-400 font-bold block">{p.id}</span>
                      <span className="text-white font-medium">{p.product_name}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {p.deep_compliance_data.tariffsCode}
                    </td>
                    <td className="p-4 text-slate-300">
                      {p.deep_compliance_data.lcaMethodology.split(' ')[0]} {p.deep_compliance_data.lcaMethodology.split(' ')[1]}
                    </td>
                    <td className="p-4 text-slate-300">
                      총 {p.eco_scores.totalCarbonKg} kg
                      <span className="text-[10px] text-slate-500 block">
                        (S1: {p.deep_compliance_data.scope1EmissionsKg} / S2: {p.deep_compliance_data.scope2EmissionsKg} / S3: {p.deep_compliance_data.scope3EmissionsKg})
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {p.deep_compliance_data.svhcChemicalStatus.slice(0, 15)}...
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedPassportForDeep(p)}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        심층 원장 조회
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 열람 감사 로그 (Audit Logs) */}
        <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              실시간 규제기관 열람 및 감사 로그 (Audit Trail)
            </h3>
            <span className="text-xs text-slate-400">Tamper-Proof Logging</span>
          </div>

          <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                아직 기록된 열람 로그가 없습니다. 심층 데이터를 조회하면 감사 로그가 자동 생성됩니다.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <div>
                      <span className="text-white font-semibold">{log.accessor_name}</span>{' '}
                      <span className="text-slate-400">({log.accessor_role})</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        대상 DPP: <span className="font-mono text-emerald-400">{log.passport_id}</span> • 작업: {log.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString('ko-KR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 심층 데이터 모달 */}
      {selectedPassportForDeep && (
        <DeepDataModal
          isOpen={true}
          onClose={() => {
            setSelectedPassportForDeep(null);
            setAuditLogs(getAuditLogs());
          }}
          passportId={selectedPassportForDeep.id}
          productName={selectedPassportForDeep.product_name}
          deepData={selectedPassportForDeep.deep_compliance_data}
        />
      )}
    </div>
  );
}
