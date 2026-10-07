import React, { useState } from 'react';
import { BPeRegistro } from '../types';
import {
  Search,
  Filter,
  Eye,
  Download,
  Ban,
  UserX,
  CheckCircle,
  AlertOctagon,
  Clock,
  Bus,
  FileCode,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

interface HistoricoBPeListProps {
  bilhetes: BPeRegistro[];
  onSelectBPe: (bpe: BPeRegistro) => void;
  onRefresh: () => void;
}

export const HistoricoBPeList: React.FC<HistoricoBPeListProps> = ({ bilhetes, onSelectBPe, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [modalAcao, setModalAcao] = useState<{
    tipo: 'CANCELAMENTO' | 'NAO_EMBARQUE' | 'XML_VIEW';
    bpe: BPeRegistro;
  } | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const filteredBilhetes = bilhetes.filter((b) => {
    const matchSearch =
      b.chave.includes(searchTerm) ||
      b.payload.comprador.xNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.payload.xLinha.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(b.nBPe).includes(searchTerm);

    const matchStatus = statusFilter === 'TODOS' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExecutarAcao = async () => {
    if (!modalAcao) return;
    setLoadingAcao(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const endpoint = modalAcao.tipo === 'CANCELAMENTO' ? '/api/bpe/cancelar' : '/api/bpe/nao-embarque';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chave: modalAcao.bpe.chave,
          justificativa,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.sucesso) {
        throw new Error(data.erro || data.mensagem || 'Falha ao registrar evento na SEFAZ.');
      }

      setActionSuccess(`Evento de ${modalAcao.tipo} registrado e vinculado na SEFAZ com sucesso!`);
      setTimeout(() => {
        setModalAcao(null);
        setJustificativa('');
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao processar.');
    } finally {
      setLoadingAcao(false);
    }
  };

  const getStatusBadge = (status: BPeRegistro['status']) => {
    switch (status) {
      case 'AUTORIZADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-3 h-3" />
            Autorizado
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
            <Ban className="w-3 h-3" />
            Cancelado
          </span>
        );
      case 'NAO_EMBARCADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
            <UserX className="w-3 h-3" />
            Não Embarcado
          </span>
        );
      case 'REJEITADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">
            <AlertOctagon className="w-3 h-3" />
            Rejeitado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
    }
  };

  return (
    <div id="historico-bpe-container" className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-busca-historico"
            type="text"
            placeholder="Buscar por Chave, Passageiro, Linha ou Nº..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
          </div>

          <select
            id="select-filtro-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="AUTORIZADO">Autorizados</option>
            <option value="CANCELADO">Cancelados</option>
            <option value="NAO_EMBARCADO">Não Embarcados</option>
            <option value="REJEITADO">Rejeitados</option>
          </select>

          <button
            id="btn-refresh-historico"
            onClick={onRefresh}
            title="Atualizar lista"
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aviso de Ambiente */}
      <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-blue-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-blue-950">Origem dos Registros & Consulta SEFAZ:</p>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            Bilhetes marcados com a tag <span className="font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded border border-amber-300">SANDBOX</span> foram validados e assinados no simulador local. Por serem de ambiente de desenvolvimento, <strong>não constam no portal público da SEFAZ (SVRS)</strong>. Para transmitir à SEFAZ real, configure um Certificado A1 ICP-Brasil em "Certificado & Config" e ative o modo "SEFAZ Real (mTLS)".
          </p>
        </div>
      </div>

      {/* Tabela de Bilhetes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredBilhetes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Bus className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-medium">Nenhum Bilhete de Passagem encontrado.</p>
            <p className="text-xs text-slate-400">Emita um novo BP-e pelo formulário ou via API REST.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="text-slate-400 uppercase tracking-tighter border-b border-slate-100 text-[11px] font-semibold bg-slate-50/50">
                <tr>
                  <th className="py-3 px-4">Número / Chave</th>
                  <th className="py-3 px-4">Status SEFAZ</th>
                  <th className="py-3 px-4">Passageiro / Linha</th>
                  <th className="py-3 px-4">Viagem & Poltrona</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBilhetes.map((b) => {
                  const pass = b.payload.passageiro || { xNome: b.payload.comprador.xNome, cpfOuDoc: b.payload.comprador.cpfOuCnpj };
                  const val = b.payload.valores;
                  const total = (val.vTarifa || 0) + (val.vTaxaEmbarque || 0) + (val.vPedagio || 0) + (val.vSeguro || 0) + (val.vOutros || 0);

                  return (
                    <tr key={b.chave} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 block">BP-e Nº {b.nBPe}</span>
                          {b.isSandbox ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300" title="Simulação local. Não consultável no portal SEFAZ.">
                              SANDBOX
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300" title="Transmitido via mTLS aos servidores oficiais da SEFAZ.">
                              SEFAZ REAL
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-blue-600 block truncate max-w-[180px]" title={b.chave}>
                          {b.chave}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(b.status)}
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Prot: {b.nProt || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{pass.xNome}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{b.payload.xLinha}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium">
                            {new Date(b.dhViagem).toLocaleDateString('pt-BR')} {new Date(b.dhViagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-700 font-bold block mt-0.5">
                          Poltrona: {b.payload.poltrona} • Plat: {b.payload.plataforma || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-ver-dabpe-${b.nBPe}`}
                            onClick={() => onSelectBPe(b)}
                            title="Visualizar e Imprimir DABPE"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <a
                            id={`btn-download-xml-${b.nBPe}`}
                            href={`/api/bpe/xml/${b.chave}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Baixar XML Autorizado"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-block"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <button
                            id={`btn-ver-raw-xml-${b.nBPe}`}
                            onClick={() => setModalAcao({ tipo: 'XML_VIEW', bpe: b })}
                            title="Inspecionar XML"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            <FileCode className="w-4 h-4" />
                          </button>

                          {b.status === 'AUTORIZADO' && (
                            <>
                              <button
                                id={`btn-cancelar-${b.nBPe}`}
                                onClick={() => {
                                  setJustificativa('');
                                  setModalAcao({ tipo: 'CANCELAMENTO', bpe: b });
                                }}
                                title="Cancelar BP-e na SEFAZ"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                              </button>

                              <button
                                id={`btn-nao-embarque-${b.nBPe}`}
                                onClick={() => {
                                  setJustificativa('');
                                  setModalAcao({ tipo: 'NAO_EMBARQUE', bpe: b });
                                }}
                                title="Registrar Não Embarque"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Ações (Cancelamento, Não Embarque ou Visualizar XML) */}
      {modalAcao && (
        <div id="modal-acao-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {modalAcao.tipo === 'CANCELAMENTO' && <Ban className="w-5 h-5 text-rose-600" />}
              {modalAcao.tipo === 'NAO_EMBARQUE' && <UserX className="w-5 h-5 text-amber-600" />}
              {modalAcao.tipo === 'XML_VIEW' && <FileCode className="w-5 h-5 text-blue-600" />}

              {modalAcao.tipo === 'CANCELAMENTO' && 'Cancelamento de BP-e na SEFAZ (tpEvento 110111)'}
              {modalAcao.tipo === 'NAO_EMBARQUE' && 'Evento de Não Embarque do Passageiro (tpEvento 110115)'}
              {modalAcao.tipo === 'XML_VIEW' && 'Estrutura XML do BP-e (MOC v1.00)'}
            </h3>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono break-all text-slate-700">
              <span className="text-slate-500 font-sans block mb-0.5">Chave:</span>
              {modalAcao.bpe.chave}
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {modalAcao.tipo === 'XML_VIEW' ? (
              <div className="space-y-2">
                <textarea
                  readOnly
                  value={modalAcao.bpe.xmlProc || modalAcao.bpe.xmlAssinado}
                  rows={14}
                  className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-lg focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setModalAcao(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Justificativa do Evento (Mínimo de 15 caracteres exigidos pela SEFAZ):
                  </label>
                  <textarea
                    id="textarea-justificativa-evento"
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    placeholder={
                      modalAcao.tipo === 'CANCELAMENTO'
                        ? 'Ex: Cancelamento solicitado pelo passageiro antes do horário de embarque previsto.'
                        : 'Ex: Passageiro não compareceu ao terminal no horário de embarque determinado.'
                    }
                    rows={4}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Caracteres digitados: {justificativa.trim().length} / 15 mínimo
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAcao(null)}
                    disabled={loadingAcao}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Voltar
                  </button>

                  <button
                    id="btn-confirmar-evento"
                    type="button"
                    onClick={handleExecutarAcao}
                    disabled={loadingAcao || justificativa.trim().length < 15}
                    className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
                      modalAcao.tipo === 'CANCELAMENTO'
                        ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300'
                        : 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300'
                    }`}
                  >
                    {loadingAcao && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                    Confirmar e Transmitir à SEFAZ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
