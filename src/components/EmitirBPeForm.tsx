import React, { useState } from 'react';
import { BPeEmissaoPayload } from '../types';
import { Send, Copy, Check, Bus, User, CreditCard, DollarSign, Sparkles, MapPin, Layers, Code, AlertCircle } from 'lucide-react';

interface EmitirBPeFormProps {
  onSuccess: (chave: string) => void;
}

const EXEMPLOS_ROTAS: {
  nome: string;
  payload: BPeEmissaoPayload;
}[] = [
  {
    nome: 'Belém (PA) ➔ Marabá (PA) • Intermunicipal',
    payload: {
      cUF: '15',
      ufIni: 'PA',
      cMunIni: '1501402',
      xMunIni: 'Belem',
      ufFim: 'PA',
      cMunFim: '1504208',
      xMunFim: 'Maraba',
      tpTrecho: 1, // 1-Intermunicipal (ARCON-PA)
      dhViagem: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
      tpViagem: 0, // Regular
      cLinha: 'BEL-MAB-01',
      xLinha: 'BELEM (RODOVIARIA DE SAO BRAS) X MARABA (FOLHA 32)',
      prefixo: 'EXP-1501',
      poltrona: '14',
      plataforma: '08',
      tpServico: 'EXECUTIVO',
      comprador: {
        cpfOuCnpj: '84920147234',
        xNome: 'RAIMUNDO NONATO PINHEIRO',
        email: 'raimundo.pinheiro@email.com',
        fone: '91981234567',
      },
      valores: {
        vTarifa: 145.00,
        vTaxaEmbarque: 9.50,
        vPedagio: 0.00,
        vSeguro: 4.50,
        vOutros: 0.00,
      },
      icms: {
        cst: '00',
        pICMS: 17,
        vBC: 159.00,
        vICMS: 27.03,
        vTotTrib: 26.23,
      },
      pagamentos: [
        {
          tPag: '17', // PIX
          vPag: 159.00,
          tpIntegra: '1',
        },
      ],
      infCpl: 'Viagem intermunicipal PA (Regulamentacao ARCON-PA). Bagagem permitida: ate 30kg no bagageiro e 5kg de mao.',
    },
  },
  {
    nome: 'Belém (PA) ➔ Castanhal (PA) • Expresso BR-316',
    payload: {
      cUF: '15',
      ufIni: 'PA',
      cMunIni: '1501402',
      xMunIni: 'Belem',
      ufFim: 'PA',
      cMunFim: '1502400',
      xMunFim: 'Castanhal',
      tpTrecho: 1, // Intermunicipal
      dhViagem: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      tpViagem: 0,
      cLinha: 'BEL-CAS-04',
      xLinha: 'BELEM X CASTANHAL (EXPRESSO BR-316)',
      prefixo: 'EXP-1508',
      poltrona: '07',
      plataforma: '04',
      tpServico: 'CONVENCIONAL',
      comprador: {
        cpfOuCnpj: '71239485291',
        xNome: 'ANA CLAUDIA BARROS',
        email: 'ana.barros@email.com',
        fone: '91992345678',
      },
      valores: {
        vTarifa: 22.00,
        vTaxaEmbarque: 3.50,
        vPedagio: 0.00,
        vSeguro: 1.50,
        vOutros: 0.00,
      },
      icms: {
        cst: '00',
        pICMS: 17,
        vBC: 27.00,
        vICMS: 4.59,
        vTotTrib: 4.45,
      },
      pagamentos: [
        {
          tPag: '04', // Cartão de Débito
          vPag: 27.00,
          tpIntegra: '1',
        },
      ],
      infCpl: 'Linha regular diaria intermunicipal. Embarque no Terminal Rodoviario de Belem (Sao Bras).',
    },
  },
  {
    nome: 'Belém (PA) ➔ Santarém (PA) • Transamazônica',
    payload: {
      cUF: '15',
      ufIni: 'PA',
      cMunIni: '1501402',
      xMunIni: 'Belem',
      ufFim: 'PA',
      cMunFim: '1506807',
      xMunFim: 'Santarem',
      tpTrecho: 1, // Intermunicipal
      dhViagem: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
      tpViagem: 0,
      cLinha: 'BEL-STM-02',
      xLinha: 'BELEM X SANTAREM (VIA BR-163 / TRANSAMAZONICA)',
      prefixo: 'EXP-1520',
      poltrona: '11',
      plataforma: '06',
      tpServico: 'LEITO',
      comprador: {
        cpfOuCnpj: '48291039482',
        xNome: 'FRANCISCO DAS CHAGAS GOMES',
        email: 'francisco.gomes@email.com',
        fone: '91984561234',
      },
      valores: {
        vTarifa: 260.00,
        vTaxaEmbarque: 14.00,
        vPedagio: 0.00,
        vSeguro: 6.00,
        vOutros: 0.00,
      },
      icms: {
        cst: '00',
        pICMS: 17,
        vBC: 280.00,
        vICMS: 47.60,
        vTotTrib: 46.20,
      },
      pagamentos: [
        {
          tPag: '17', // PIX
          vPag: 280.00,
          tpIntegra: '1',
        },
      ],
      infCpl: 'Servico Leito com agua mineral, manta e tomadas USB.',
    },
  },
  {
    nome: 'Belém (PA) ➔ Paragominas (PA) • Rota Verde',
    payload: {
      cUF: '15',
      ufIni: 'PA',
      cMunIni: '1501402',
      xMunIni: 'Belem',
      ufFim: 'PA',
      cMunFim: '1505502',
      xMunFim: 'Paragominas',
      tpTrecho: 1,
      dhViagem: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
      tpViagem: 0,
      cLinha: 'BEL-PGM-03',
      xLinha: 'BELEM X PARAGOMINAS (VIA BR-010)',
      prefixo: 'EXP-1512',
      poltrona: '19',
      plataforma: '09',
      tpServico: 'EXECUTIVO',
      comprador: {
        cpfOuCnpj: '63920194827',
        xNome: 'MARIA DO SOCORRO MELO',
        email: 'socorro.melo@email.com',
        fone: '91993456789',
      },
      valores: {
        vTarifa: 85.00,
        vTaxaEmbarque: 6.50,
        vPedagio: 0.00,
        vSeguro: 3.50,
        vOutros: 0.00,
      },
      icms: {
        cst: '00',
        pICMS: 17,
        vBC: 95.00,
        vICMS: 16.15,
        vTotTrib: 15.67,
      },
      pagamentos: [
        {
          tPag: '03', // Crédito
          vPag: 95.00,
          tpIntegra: '1',
        },
      ],
      infCpl: 'Viagem intermunicipal com ar-condicionado. ARCON-PA.',
    },
  },
  {
    nome: 'Belém (PA) ➔ São Luís (MA) • Interestadual ANTT',
    payload: {
      cUF: '15',
      ufIni: 'PA',
      cMunIni: '1501402',
      xMunIni: 'Belem',
      ufFim: 'MA',
      cMunFim: '2111300',
      xMunFim: 'Sao Luis',
      tpTrecho: 2, // 2-Interestadual (ANTT)
      dhViagem: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      tpViagem: 0,
      cLinha: 'BEL-SLZ-10',
      xLinha: 'BELEM (PA) X SAO LUIS (MA)',
      prefixo: 'EXP-2015',
      poltrona: '03',
      plataforma: '10',
      tpServico: 'LEITO',
      comprador: {
        cpfOuCnpj: '59381274312',
        xNome: 'MARCELO AUGUSTO SILVEIRA',
        email: 'marcelo.silveira@email.com',
        fone: '91988776655',
      },
      valores: {
        vTarifa: 185.00,
        vTaxaEmbarque: 12.00,
        vPedagio: 0.00,
        vSeguro: 5.00,
        vOutros: 0.00,
      },
      icms: {
        cst: '00',
        pICMS: 12,
        vBC: 202.00,
        vICMS: 24.24,
        vTotTrib: 33.33,
      },
      pagamentos: [
        {
          tPag: '03', // Crédito
          vPag: 202.00,
          tpIntegra: '1',
        },
      ],
      infCpl: 'Onibus Leito com ar-condicionado, Wi-Fi e tomadas USB individuais. Linha ANTT.',
    },
  },
];

export const EmitirBPeForm: React.FC<EmitirBPeFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<BPeEmissaoPayload>(EXEMPLOS_ROTAS[0].payload);
  const [loading, setLoading] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultadoEmissao, setResultadoEmissao] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');
  const [jsonString, setJsonString] = useState<string>(JSON.stringify(EXEMPLOS_ROTAS[0].payload, null, 2));

  const totalCalculado =
    (formData.valores.vTarifa || 0) +
    (formData.valores.vTaxaEmbarque || 0) +
    (formData.valores.vPedagio || 0) +
    (formData.valores.vSeguro || 0) +
    (formData.valores.vOutros || 0);

  const handleSelectExemplo = (ex: typeof EXEMPLOS_ROTAS[0]) => {
    setFormData(ex.payload);
    setJsonString(JSON.stringify(ex.payload, null, 2));
    setErrorMsg(null);
    setResultadoEmissao(null);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResultadoEmissao(null);

    try {
      const payloadToSend = viewMode === 'json' ? JSON.parse(jsonString) : formData;

      const resp = await fetch('/api/bpe/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSend),
      });

      const data = await resp.json();

      if (!resp.ok || !data.sucesso) {
        throw new Error(data.erro || data.mensagem || 'Falha ao emitir BP-e na SEFAZ.');
      }

      setResultadoEmissao(data.dados);
      onSuccess(data.dados.chave);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="emitir-bpe-container" className="space-y-6">
      {/* Top Banner de Rotas Prontas */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm">Carregar Exemplo Rápido de Rota:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-modo-form"
              type="button"
              onClick={() => setViewMode('form')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'form' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Formulário Visual
            </button>
            <button
              id="btn-modo-json"
              type="button"
              onClick={() => {
                setJsonString(JSON.stringify(formData, null, 2));
                setViewMode('json');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'json' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Editor JSON (Payload API)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXEMPLOS_ROTAS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExemplo(ex)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-medium transition-all"
            >
              {ex.nome}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erro na Emissão do BP-e:</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {resultadoEmissao && (
        <div className={`p-5 rounded-xl border shadow-sm space-y-3 ${resultadoEmissao.isSandbox ? 'bg-amber-50/70 border-amber-300 text-amber-950' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Check className={`w-5 h-5 ${resultadoEmissao.isSandbox ? 'text-amber-600' : 'text-emerald-600'}`} />
              {resultadoEmissao.isSandbox ? 'BP-e Autorizado em Simulação Local (Sandbox)' : 'BP-e Autorizado pela SEFAZ Oficial (SVRS)!'} (cStat: {resultadoEmissao.cStat})
            </div>
            <div className="flex items-center gap-2">
              {resultadoEmissao.isSandbox ? (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full uppercase border border-amber-300">
                  Modo Sandbox
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full uppercase border border-emerald-300">
                  SEFAZ Real
                </span>
              )}
              <span className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-full font-mono text-slate-800 font-semibold shadow-xs">
                Prot: {resultadoEmissao.nProt}
              </span>
            </div>
          </div>

          {resultadoEmissao.isSandbox ? (
            <div className="p-3 bg-amber-100/60 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Atenção sobre a Consulta Pública:</strong> Este bilhete foi processado no simulador local. Por isso, a chave abaixo <strong>NÃO existirá</strong> no portal público da SEFAZ (dfe-portal.svrs.rs.gov.br). Para transmitir à SEFAZ real, configure um Certificado A1 ICP-Brasil (.pfx) no menu "Certificado & Config" e ative o modo "SEFAZ Real (mTLS)".
            </div>
          ) : (
            <div className="p-3 bg-emerald-100/60 rounded-lg border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              <strong>Transmissão Oficial:</strong> Este bilhete foi enviado e aprovado via webservice oficial da SEFAZ (SVRS) e já pode ser consultado no portal nacional com a chave abaixo.
            </div>
          )}

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono break-all text-slate-800">
            <span className="text-slate-500 font-sans block mb-1 font-medium">Chave de Acesso (44 dígitos):</span>
            {resultadoEmissao.chave}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={`/api/bpe/xml/${resultadoEmissao.chave}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              Baixar XML (-procBPe.xml)
            </a>
            <span className="text-xs text-slate-500 italic">
              O bilhete já está disponível no Histórico e pronto para impressão de DABPE.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {viewMode === 'json' ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                Payload JSON para requisição POST /api/bpe/emitir
              </label>
              <button
                type="button"
                onClick={handleCopyJson}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedJson ? 'Copiado!' : 'Copiar JSON'}
              </button>
            </div>
            <textarea
              id="textarea-json-payload"
              value={jsonString}
              onChange={(e) => setJsonString(e.target.value)}
              rows={16}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">
              Você pode editar este JSON diretamente ou copiá-lo para enviar via cURL, Python, PHP, Node.js ou C# a partir do seu sistema.
            </p>
          </div>
        ) : (
          <>
            {/* Bloco 1: Trecho e Dados da Viagem */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                1. Origem, Destino e Linha de Transporte
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block">Origem do Embarque</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[11px] font-medium text-slate-600">UF Origem</label>
                      <input
                        id="input-uf-ini"
                        type="text"
                        maxLength={2}
                        value={formData.ufIni}
                        onChange={(e) => setFormData({ ...formData, ufIni: e.target.value.toUpperCase() })}
                        className="w-full p-2 border border-slate-300 rounded text-xs uppercase"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] font-medium text-slate-600">Cidade Origem</label>
                      <input
                        id="input-mun-ini"
                        type="text"
                        value={formData.xMunIni}
                        onChange={(e) => setFormData({ ...formData, xMunIni: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block">Destino do Desembarque</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[11px] font-medium text-slate-600">UF Destino</label>
                      <input
                        id="input-uf-fim"
                        type="text"
                        maxLength={2}
                        value={formData.ufFim}
                        onChange={(e) => setFormData({ ...formData, ufFim: e.target.value.toUpperCase() })}
                        className="w-full p-2 border border-slate-300 rounded text-xs uppercase"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] font-medium text-slate-600">Cidade Destino</label>
                      <input
                        id="input-mun-fim"
                        type="text"
                        value={formData.xMunFim}
                        onChange={(e) => setFormData({ ...formData, xMunFim: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700">Descrição da Linha</label>
                  <input
                    id="input-xlinha"
                    type="text"
                    value={formData.xLinha}
                    onChange={(e) => setFormData({ ...formData, xLinha: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Poltrona</label>
                  <input
                    id="input-poltrona"
                    type="text"
                    value={formData.poltrona}
                    onChange={(e) => setFormData({ ...formData, poltrona: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-bold text-indigo-700"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Plataforma</label>
                  <input
                    id="input-plataforma"
                    type="text"
                    value={formData.plataforma || ''}
                    onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Tipo de Serviço</label>
                  <select
                    id="select-tp-servico"
                    value={formData.tpServico || 'CONVENCIONAL'}
                    onChange={(e) => setFormData({ ...formData, tpServico: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="CONVENCIONAL">CONVENCIONAL</option>
                    <option value="EXECUTIVO">EXECUTIVO</option>
                    <option value="SEMI-LEITO">SEMI-LEITO</option>
                    <option value="LEITO">LEITO</option>
                    <option value="LEITO-CAMA">LEITO-CAMA</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Data e Hora do Embarque</label>
                  <input
                    id="input-dh-viagem"
                    type="datetime-local"
                    value={formData.dhViagem ? new Date(formData.dhViagem).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, dhViagem: new Date(e.target.value).toISOString() })}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Prefixo do Ônibus</label>
                  <input
                    id="input-prefixo"
                    type="text"
                    value={formData.prefixo || ''}
                    onChange={(e) => setFormData({ ...formData, prefixo: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Passageiro e Comprador */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-blue-600" />
                2. Dados do Passageiro / Comprador
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700">Nome Completo</label>
                  <input
                    id="input-comp-nome"
                    type="text"
                    value={formData.comprador.xNome}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comprador: { ...formData.comprador, xNome: e.target.value },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">CPF ou CNPJ</label>
                  <input
                    id="input-comp-cpf"
                    type="text"
                    value={formData.comprador.cpfOuCnpj}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comprador: { ...formData.comprador, cpfOuCnpj: e.target.value },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Telefone / WhatsApp</label>
                  <input
                    id="input-comp-fone"
                    type="text"
                    value={formData.comprador.fone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        comprador: { ...formData.comprador, fone: e.target.value },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Tarifas e Pagamento */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <DollarSign className="w-4 h-4 text-blue-600" />
                3. Tarifas, Componentes e Forma de Pagamento
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Tarifa (R$)</label>
                  <input
                    id="input-vtarifa"
                    type="number"
                    step="0.01"
                    value={formData.valores.vTarifa}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valores: { ...formData.valores, vTarifa: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Taxa Embarque (R$)</label>
                  <input
                    id="input-vtaxa"
                    type="number"
                    step="0.01"
                    value={formData.valores.vTaxaEmbarque || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valores: { ...formData.valores, vTaxaEmbarque: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Pedágio (R$)</label>
                  <input
                    id="input-vpedagio"
                    type="number"
                    step="0.01"
                    value={formData.valores.vPedagio || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valores: { ...formData.valores, vPedagio: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Seguro (R$)</label>
                  <input
                    id="input-vseguro"
                    type="number"
                    step="0.01"
                    value={formData.valores.vSeguro || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valores: { ...formData.valores, vSeguro: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-center flex flex-col justify-center">
                  <span className="text-[10px] text-blue-700 font-medium">TOTAL BP-E</span>
                  <span className="text-sm font-bold text-blue-950">
                    {totalCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">Forma de Pagamento</label>
                  <select
                    id="select-tpag"
                    value={formData.pagamentos[0]?.tPag || '17'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pagamentos: [
                          {
                            tPag: e.target.value as any,
                            vPag: totalCalculado,
                            tpIntegra: '1',
                          },
                        ],
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="17">17 - PIX (Instantâneo)</option>
                    <option value="03">03 - Cartão de Crédito</option>
                    <option value="04">04 - Cartão de Débito</option>
                    <option value="01">01 - Dinheiro</option>
                    <option value="15">15 - Boleto Bancário</option>
                    <option value="99">99 - Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Observações / Informações Complementares</label>
                  <input
                    id="input-infcpl"
                    type="text"
                    value={formData.infCpl || ''}
                    onChange={(e) => setFormData({ ...formData, infCpl: e.target.value })}
                    placeholder="Ex: Bagagem até 30kg, embarque com 15 min de antecedência"
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Botão de Envio */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="btn-copiar-payload"
            type="button"
            onClick={handleCopyJson}
            className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copiedJson ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copiedJson ? 'Payload Copiado!' : 'Copiar Payload JSON'}
          </button>

          <button
            id="btn-enviar-bpe"
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Assinando com Certificado A1 e Enviando à SEFAZ...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Processar e Emitir BP-e na SEFAZ
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
