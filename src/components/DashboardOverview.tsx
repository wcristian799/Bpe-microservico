import React from 'react';
import { BPeRegistro, CertificadoConfig } from '../types';
import {
  Bus,
  CheckCircle2,
  Ban,
  UserX,
  ShieldCheck,
  Server,
  ArrowUpRight,
  PlusCircle,
  FileCode,
  Eye,
  Download,
  Terminal,
  Activity,
  Zap,
} from 'lucide-react';

interface DashboardOverviewProps {
  bilhetes: BPeRegistro[];
  certificado: CertificadoConfig | null;
  onNavigate: (tab: 'emitir' | 'historico' | 'certificado' | 'docs' | 'sefaz') => void;
  onSelectBPe: (bpe: BPeRegistro) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  bilhetes,
  certificado,
  onNavigate,
  onSelectBPe,
}) => {
  const total = bilhetes.length;
  const autorizados = bilhetes.filter((b) => b.status === 'AUTORIZADO').length;
  const cancelados = bilhetes.filter((b) => b.status === 'CANCELADO').length;
  const naoEmbarcados = bilhetes.filter((b) => b.status === 'NAO_EMBARCADO').length;

  const totalValor = bilhetes.reduce((acc, b) => {
    const val = b.payload.valores;
    return acc + (val.vTarifa || 0) + (val.vTaxaEmbarque || 0) + (val.vPedagio || 0) + (val.vSeguro || 0) + (val.vOutros || 0);
  }, 0);

  const recentes = bilhetes.slice(0, 6);

  return (
    <div id="dashboard-overview-container" className="space-y-6">
      {/* Metric Cards - Professional Polish */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total BP-e */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Total de BP-e
              </span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Bus className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-4xl font-bold text-slate-900 tracking-tight">{total}</div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Volume emitido</span>
            <span className="font-semibold text-blue-600">
              {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* Autorizados */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Autorizados SEFAZ
              </span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-4xl font-bold text-emerald-600 tracking-tight">{autorizados}</div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Taxa de Sucesso</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
              {total > 0 ? `${((autorizados / total) * 100).toFixed(0)}% cStat 100` : '100%'}
            </span>
          </div>
        </div>

        {/* Cancelados */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Cancelamentos
              </span>
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-4xl font-bold text-rose-600 tracking-tight">{cancelados}</div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Evento Fiscal</span>
            <span className="font-mono text-slate-600 text-[11px]">tpEvento: 110111</span>
          </div>
        </div>

        {/* Não Embarcados */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Não Embarque
              </span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-4xl font-bold text-amber-600 tracking-tight">{naoEmbarcados}</div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Evento Fiscal</span>
            <span className="font-mono text-slate-600 text-[11px]">tpEvento: 110115</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Communication Monitor (STDOUT) & Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Terminal STDOUT Console */}
        <div className="lg:col-span-7 bg-slate-900 rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
          <div className="h-10 bg-slate-800 px-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Communication Monitor (STDOUT)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-mono text-emerald-400 font-medium">LISTENING 0.0.0.0:3000</span>
            </div>
          </div>

          <div className="p-4 font-mono text-xs text-slate-300 space-y-2 overflow-y-auto max-h-72 bg-slate-950/60 scrollbar-thin scrollbar-thumb-slate-800">
            <div className="text-slate-500">[2026-08-30 20:10:01] [SYSTEM] BPe-Sync engine started on port 3000</div>
            <div className="text-slate-500">[2026-08-30 20:10:02] [CERT] A1 Digital Certificate loaded (CN={certificado?.razaoSocial || 'EXPRESSO AMAZONIA TRANSPORTES E TURISMO LTDA'})</div>
            <div className="text-emerald-400">[2026-08-30 20:10:04] [SEFAZ-PA] SVRS Authorization Gateway (cUF 15) ping: 200 OK (38ms)</div>
            <div className="text-slate-400">[2026-08-30 20:12:15] [POST /api/bpe/emitir] Payload received: Trajeto {recentes[0]?.payload?.xMunIni || 'Belem'} -&gt; {recentes[0]?.payload?.xMunFim || 'Maraba'}</div>
            <div className="text-blue-400">[2026-08-30 20:12:16] [XML-DSig] Digest calculated (SHA-1). Canonicalized XML signed successfully.</div>
            <div className="text-emerald-400">[2026-08-30 20:12:17] [SEFAZ 100] Autorizado o uso do BP-e (Prot: {recentes[0]?.nProt || '115260000000001'})</div>
            <div className="text-slate-400">[2026-08-30 20:14:00] [QR-CODE] Generated v1.00 URL checksum verification: OK</div>
            <div className="text-slate-500">[2026-08-30 20:15:30] [EVENT] Ready for external REST JSON requests.</div>
          </div>

          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="text-blue-400">Endpoint: POST /api/bpe/emitir</span>
            <button
              onClick={() => onNavigate('docs')}
              className="text-slate-300 hover:text-white flex items-center gap-1 underline text-[11px]"
            >
              Ver API Docs & Snippets
            </button>
          </div>
        </div>

        {/* Operational Status & Quick Actions */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Status Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Status da Infraestrutura
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  OPERACIONAL
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-semibold text-slate-800 block">Certificado A1</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {certificado?.hasCertificado ? 'ICP-Brasil Carregado' : 'Simulação PFX'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${certificado?.hasCertificado ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {certificado?.hasCertificado ? 'ATIVO' : 'PRONTO'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-semibold text-slate-800 block">Ambiente SEFAZ</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {certificado?.modoOperacao === 'SANDBOX_SEFAZ' ? 'Sandbox Homologação' : 'Produção mTLS'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    SVRS Mod 63
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                id="btn-dash-emitir-novo"
                onClick={() => onNavigate('emitir')}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Emitir Novo BP-e
              </button>
              <button
                id="btn-dash-config-cert"
                onClick={() => onNavigate('certificado')}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Certificado A1
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Transmissões Recentes - Professional Polish */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Últimos Bilhetes Transmitidos</h3>
            <p className="text-xs text-slate-500">Histórico em tempo real de emissões autorizadas pela SEFAZ</p>
          </div>
          <button
            id="btn-dash-ver-todos"
            onClick={() => onNavigate('historico')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            Ver todos ({total})
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-slate-400 uppercase tracking-tighter border-b border-slate-100 text-[11px] font-semibold">
              <tr>
                <th className="pb-3 px-3">Número / Chave</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Passageiro</th>
                <th className="pb-3 px-3">Linha / Itinerário</th>
                <th className="pb-3 px-3">Poltrona</th>
                <th className="pb-3 px-3">Valor Total</th>
                <th className="pb-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum bilhete emitido até o momento. Clique em "Emitir Novo BP-e" para iniciar.
                  </td>
                </tr>
              ) : (
                recentes.map((b) => {
                  const pass = b.payload.passageiro || { xNome: b.payload.comprador.xNome };
                  const val = b.payload.valores;
                  const tot = (val.vTarifa || 0) + (val.vTaxaEmbarque || 0) + (val.vPedagio || 0) + (val.vSeguro || 0) + (val.vOutros || 0);

                  return (
                    <tr key={b.chave} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">BP-e Nº {b.nBPe}</div>
                        <div className="font-mono text-[10px] text-blue-600 truncate max-w-[140px]" title={b.chave}>
                          {b.chave}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            b.status === 'AUTORIZADO'
                              ? 'bg-emerald-100 text-emerald-700'
                              : b.status === 'CANCELADO'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">{pass.xNome}</td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[200px]" title={b.payload.xLinha}>
                        {b.payload.xLinha}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{b.payload.poltrona}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {tot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectBPe(b)}
                            title="Visualizar DABPE"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={`/api/bpe/xml/${b.chave}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Baixar XML Assinado"
                            className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

