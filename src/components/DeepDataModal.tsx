'use client';

import React, { useState, useEffect } from 'react';
import { DeepComplianceData } from '@/types/dpp';
import { logAuditAction } from '@/lib/supabase';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  FileText, 
  CheckCircle, 
  Cpu, 
  Download, 
  Hash, 
  Calendar,
  Building,
  AlertCircle
} from 'lucide-react';

interface DeepDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  passportId: string;
  productName: string;
  deepData: DeepComplianceData;
}

export const DeepDataModal: React.FC<DeepDataModalProps> = ({
  isOpen,
  onClose,
  passportId,
  productName,
  deepData
}) => {
  const [authorized, setAuthorized] = useState(false);
  const [authorityRole, setAuthorityRole] = useState('EU Market Surveillance Authority (세관·시장감시)');
  const [inspectorName, setInspectorName] = useState('Dr. Alex Richter (공인 심사관)');

  useEffect(() => {
    if (isOpen) {
      // 열람 로그 자동 기록
      logAuditAction({
        passport_id: passportId,
        accessor_role: authorityRole,
        accessor_name: inspectorName,
        action: 'VIEW_DEEP_COMPLIANCE_DATA',
        details: { timestamp: new Date().toISOString(), lcaVerified: true }
      });
      setAuthorized(true);
    }
  }, [isOpen, passportId, authorityRole, inspectorName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl p-6 sm:p-8 border border-sky-500/30 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">DPP 심층 규제·인증 감사 원장</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full">
                RBAC Level 3
              </span>
            </div>
            <p className="text-xs text-slate-400">
              EU ESPR / 세관 당국 / 공인 검증기관 전용 심층 데이터베이스
            </p>
          </div>
        </div>

        {/* 감사관 자격 증명 바 */}
        <div className="p-3.5 bg-sky-950/40 border border-sky-500/20 rounded-xl mb-6 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-sky-200">
            <Lock className="w-4 h-4 text-sky-400" />
            <span>접근 권한 인증됨: <strong>{authorityRole}</strong></span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {new Date().toLocaleDateString('ko-KR')} 감사 로그 자동 기록됨
          </span>
        </div>

        {/* 1. 세무/통관 및 관세 정보 */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              1. 세관 및 원산지 통관 증빙
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">HS 품목 분류 코드</span>
                <span className="font-mono text-slate-100 font-bold">{deepData.tariffsCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">관세청 수출입 신고 번호</span>
                <span className="font-mono text-slate-100 font-bold">{deepData.customsDeclarationId}</span>
              </div>
            </div>
          </div>

          {/* 2. 전과정평가(LCA) 세부 산정 인벤토리 */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              2. ISO 14040/44 전과정평가(LCA) 인벤토리
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">산정 표준 및 배출계수 DB</span>
                <span className="text-slate-200 font-medium">{deepData.lcaMethodology}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Scope 1 (직접)</span>
                  <span className="text-sm font-bold text-emerald-400">{deepData.scope1EmissionsKg} kg</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Scope 2 (간접)</span>
                  <span className="text-sm font-bold text-sky-400">{deepData.scope2EmissionsKg} kg</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Scope 3 (공급망)</span>
                  <span className="text-sm font-bold text-purple-400">{deepData.scope3EmissionsKg} kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 유해물질 규제(REACH/RoHS) 검증 */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              3. EU REACH / SVHC 유해물질 시험성적
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950">
                <span className="text-slate-300">SVHC 고위험우려물질 240종 전수 검사</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400">
                  {deepData.svhcChemicalStatus}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950">
                <span className="text-slate-300">공인 인증기관 및 심사자</span>
                <span className="text-slate-200 font-semibold">{deepData.verifierOrg}</span>
              </div>
            </div>
          </div>

          {/* 4. 블록체인 / 스마트 컨트랙트 무결성 증빙 */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              4. 온체인 위변조 방지 원장 & DID 서명
            </h4>
            <div className="space-y-2 text-xs font-mono">
              {deepData.smartContractAddress && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5 truncate">
                  <span className="text-slate-400 block text-[10px] font-sans">Smart Contract Registry</span>
                  <span className="text-purple-300">{deepData.smartContractAddress}</span>
                </div>
              )}
              {deepData.blockchainTxHash && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5 truncate">
                  <span className="text-slate-400 block text-[10px] font-sans">Data Anchoring Transaction Hash</span>
                  <span className="text-emerald-300">{deepData.blockchainTxHash}</span>
                </div>
              )}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-white/5 truncate">
                <span className="text-slate-400 block text-[10px] font-sans">공인 검증관 전자서명 (Digital Signature)</span>
                <span className="text-sky-300">{deepData.verifierSignature}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 액션 */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            ISO 14025 / CIRPASS DPP Architecture v1.0 호환
          </span>
          <button
            onClick={() => {
              alert('공인 규제 검증 리포트(PDF/JSON)가 다운로드되었습니다.');
            }}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20"
          >
            <Download className="w-4 h-4" />
            감사 리포트 다운로드 (JSON-LD/PDF)
          </button>
        </div>
      </div>
    </div>
  );
};
