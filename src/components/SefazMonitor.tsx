import React, { useState, useEffect } from 'react';
import { SefazStatusServicoResult } from '../types';
import { Server, Activity, CheckCircle2, XCircle, RefreshCw, Clock, Globe, Shield, Code2, Terminal, ExternalLink } from 'lucide-react';

const ESTADOS_SEFAZ = ['PA', 'MA', 'AP', 'AM', 'TO', 'SP', 'MG', 'RS', 'RJ', 'PR', 'SC', 'GO', 'BA', 'PE', 'CE', 'DF'];

export const SefazMonitor: React.FC = () => {
  const [selectedUf, setSelectedUf] = useState('PA');
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<SefazStatusServicoResult | null>(null);
  const [autoStatusMap, setAutoStatusMap] = useState<Record<string, { ok: boolean; ms: number }>>({});
  const [showRawXml, setShowRawXml] = useState(false);

  const consultarStatus = async (uf: string) => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/bpe/status-servico?uf=${uf}`);
      const data = await resp.json();
      if (data.dados) {
        setStatusResult(data.dados);
        setAutoStatusMap((prev) => ({
          ...prev,
          [uf]: { ok: data.dados.sucesso, ms: data.dados.tempoRespostaMs },
        }));
      }
    } catch (err) {
      console.error('Erro ao testar SEFAZ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    consultarStatus(selectedUf);
  }, [selectedUf]);

  const testarTodasUFs = async () => {
    for (const uf of ESTADOS_SEFAZ) {
      try {
        const resp = await fetch(`/api/bpe/status-servico?uf=${uf}`);
        const data = await resp.json();
        if (data.dados) {
          setAutoStatusMap((prev) => ({
            ...prev,
            [uf]: { ok: data.dados.sucesso, ms: data.dados.tempoRespostaMs },
          }));
        }
      } catch (err) {
        // continue
      }
    }
  };

  return (
    <div id="sefaz-monitor-container" className="space-y-6">
      {/* Top Banner de Diagnóstico */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              Monitor de Conectividade SEFAZ (WebServices BP-e)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verificação em tempo real do serviço SOAP <code className="text-blue-600 font-mono">bpeStatusServico</code> (MOC v1.00 / SVRS).
            </p>
          </div>

          <button
            id="btn-testar-todas-ufs"
            onClick={testarTodasUFs}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Testar Todas as UFs
          </button>
        </div>

        {/* Seleção de Estados */}
        <div className="flex flex-wrap gap-2 pt-2">
          {ESTADOS_SEFAZ.map((uf) => {
            const statusInfo = autoStatusMap[uf];
            const isSelected = selectedUf === uf;

            return (
              <button
                key={uf}
                id={`btn-uf-${uf}`}
                onClick={() => setSelectedUf(uf)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>SEFAZ {uf}</span>
                {statusInfo && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      statusInfo.ok ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhes do Status Selecionado */}
      {statusResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Resposta do WebService SEFAZ {statusResult.uf}
            </span>

            <div className="flex items-center gap-2">
              {statusResult.isSandbox ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                  Sandbox Local
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  SEFAZ Real (SVRS)
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  statusResult.sucesso
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {statusResult.sucesso ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {statusResult.sucesso ? 'Serviço Operacional' : 'Indisponível'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block">CÓDIGO DE STATUS (cStat)</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{statusResult.cStat}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">{statusResult.xMotivo}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block">TEMPO DE RESPOSTA (PING)</span>
              <span className="text-sm font-bold text-blue-950 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {statusResult.tempoRespostaMs} ms
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Tempo Médio SEFAZ: {statusResult.tMed}s</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block">VERSÃO DA APLICAÇÃO (verAplic)</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{statusResult.verAplic}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Ambiente: {statusResult.tpAmb === 1 ? '1 - Produção' : '2 - Homologação'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block">MODO DE EXECUÇÃO</span>
              <span className="text-sm font-bold text-blue-700 font-mono">
                {statusResult.isSandbox ? 'SANDBOX SIMULATOR' : 'SEFAZ REAL mTLS'}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {statusResult.isSandbox ? 'Respostas locais rápidas' : 'Servidores da SEFAZ (SVRS)'}
              </span>
            </div>
          </div>

          {/* Endereço do Servidor SEFAZ Oficial Consultado */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Endpoint SEFAZ (WSDL / SOAP 1.2):
              </span>
              <button
                onClick={() => setShowRawXml(!showRawXml)}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
              >
                <Code2 className="w-3 h-3" />
                {showRawXml ? 'Ocultar XML de Retorno' : 'Ver XML Bruto Retornado'}
              </button>
            </div>
            <p className="text-blue-300 break-all text-[11px]">{statusResult.endpointUrl || 'https://bpe-homologacao.svrs.rs.gov.br/ws/bpeStatusServico/bpeStatusServico.asmx'}</p>
            
            {showRawXml && statusResult.rawXmlRetorno && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Payload XML Bruto recebido do WebService:</span>
                <pre className="p-3 bg-black/70 rounded-lg text-emerald-400 text-[10px] overflow-x-auto whitespace-pre-wrap">
                  {statusResult.rawXmlRetorno}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
