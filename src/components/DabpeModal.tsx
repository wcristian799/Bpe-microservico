import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { BPeRegistro } from '../types';
import { Printer, Download, X, CheckCircle, AlertTriangle, FileText, Bus, ShieldCheck } from 'lucide-react';

interface DabpeModalProps {
  bpe: BPeRegistro | null;
  onClose: () => void;
}

export const DabpeModal: React.FC<DabpeModalProps> = ({ bpe, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [papelFormato, setPapelFormato] = useState<'termica' | 'a4'>('termica');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bpe?.qrCodeUrl) {
      QRCode.toDataURL(bpe.qrCodeUrl, { width: 180, margin: 1 })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [bpe]);

  if (!bpe) return null;

  const emit = bpe.payload.emitente || {
    xNome: 'EXPRESSO AMAZONIA TRANSPORTES E TURISMO LTDA',
    xFant: 'EXPRESSO AMAZONIA - BELEM',
    cnpj: '04891234000185',
    ie: '151234567',
    tar: 'ARCON-PA Nº 0142/2026 • ANTT Nº 15.0042-PA',
    enderEmit: {
      xLgr: 'Avenida Almirante Barroso',
      nro: '1200',
      xBairro: 'Sao Bras',
      xMun: 'Belem',
      uf: 'PA',
      cep: '66093020',
    },
  };

  const comp = bpe.payload.comprador;
  const pass = bpe.payload.passageiro || { xNome: comp.xNome, cpfOuDoc: comp.cpfOuCnpj };
  const val = bpe.payload.valores;
  const total = (val.vTarifa || 0) + (val.vPedagio || 0) + (val.vTaxaEmbarque || 0) + (val.vSeguro || 0) + (val.vOutros || 0);

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarChave4x = (chave: string) => {
    return chave.replace(/(\d{4})/g, '$1 ').trim();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadXml = () => {
    window.open(`/api/bpe/xml/${bpe.chave}`, '_blank');
  };

  return (
    <div id="dabpe-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header de Ações */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                DABPE - Documento Auxiliar do Bilhete de Passagem Eletrônico
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Mod 63 • Nº {bpe.nBPe}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Chave: {bpe.chave}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-lg flex text-xs">
              <button
                id="btn-formato-termica"
                onClick={() => setPapelFormato('termica')}
                className={`px-3 py-1 rounded transition-colors ${
                  papelFormato === 'termica' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Térmica 80mm
              </button>
              <button
                id="btn-formato-a4"
                onClick={() => setPapelFormato('a4')}
                className={`px-3 py-1 rounded transition-colors ${
                  papelFormato === 'a4' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Folha A4
              </button>
            </div>

            <button
              id="btn-imprimir-dabpe"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>

            <button
              id="btn-download-xml-dabpe"
              onClick={handleDownloadXml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
            >
              <Download className="w-4 h-4" />
              Baixar XML
            </button>

            <button
              id="btn-fechar-dabpe"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do DABPE */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-100/80 flex justify-center">
          <div
            ref={printRef}
            id="dabpe-printable-container"
            className={`bg-white border border-slate-300 shadow-sm text-slate-900 text-[11px] leading-tight font-mono p-4 ${
              papelFormato === 'termica' ? 'w-[320px] max-w-full' : 'w-[680px] max-w-full'
            }`}
          >
            {/* Cabeçalho Emitente */}
            {bpe.isSandbox && (
              <div className="text-center py-1 bg-amber-100 text-amber-900 border border-amber-300 font-sans font-bold text-[9px] mb-2 uppercase rounded">
                *** AMBIENTE SANDBOX LOCAL • SEM VALIDADE FISCAL • NÃO TRANSMITIDO À SEFAZ ***
              </div>
            )}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <h4 className="font-bold text-xs uppercase text-slate-900 tracking-tight">{emit.xNome}</h4>
              <p className="text-[10px] text-slate-700">
                CNPJ: {emit.cnpj} • IE: {emit.ie}
              </p>
              <p className="text-[9px] text-slate-600">
                {emit.enderEmit.xLgr}, {emit.enderEmit.nro} - {emit.enderEmit.xBairro} - {emit.enderEmit.xMun}/{emit.enderEmit.uf}
              </p>
              {emit.tar && <p className="text-[9px] text-slate-600 font-semibold">TAR ANTT: {emit.tar}</p>}
            </div>

            {/* Identificação Fiscal */}
            <div className="text-center py-2 border-b border-dashed border-slate-400 bg-slate-50 my-1">
              <p className="font-bold text-xs">DABPE - Documento Auxiliar do Bilhete de Passagem Eletrônico</p>
              <p className="text-[10px]">Não Permite Aproveitamento de Crédito do ICMS</p>
              <div className="flex justify-between px-2 pt-1 font-bold text-[10px]">
                <span>MOD: 63</span>
                <span>SÉRIE: {bpe.serie}</span>
                <span>Nº: {bpe.nBPe}</span>
              </div>
            </div>

            {/* Status SEFAZ */}
            <div className="py-1.5 border-b border-dashed border-slate-400 text-center">
              <p className="text-[10px]">
                EMISSÃO: {new Date(bpe.dhEmi).toLocaleString('pt-BR')} - {bpe.tpAmb === 1 ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}
              </p>
              <p className="font-bold text-emerald-700 text-[10px]">
                PROTOCOLO SEFAZ: {bpe.nProt || '115260000000001'}
              </p>
              <p className="text-[9px] text-slate-600">
                DATA AUTORIZAÇÃO: {bpe.dhRecbto ? new Date(bpe.dhRecbto).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Dados da Viagem */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="font-bold text-[11px] mb-1 bg-slate-200/70 px-1 py-0.5 text-slate-800">
                DADOS DA VIAGEM
              </div>
              <p className="font-bold text-xs text-blue-900">{bpe.payload.xLinha}</p>
              <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
                <div>
                  <span className="text-slate-500">ORIGEM:</span>
                  <p className="font-bold">{bpe.payload.xMunIni}/{bpe.payload.ufIni}</p>
                </div>
                <div>
                  <span className="text-slate-500">DESTINO:</span>
                  <p className="font-bold">{bpe.payload.xMunFim}/{bpe.payload.ufFim}</p>
                </div>
              </div>

              <div className="mt-1.5 p-1.5 bg-slate-100 rounded border border-slate-200 grid grid-cols-3 gap-1 text-center">
                <div>
                  <span className="text-[9px] text-slate-500 block">DATA / HORA EMBARQUE</span>
                  <span className="font-bold text-[11px] text-slate-900">
                    {new Date(bpe.payload.dhViagem).toLocaleDateString('pt-BR')} {new Date(bpe.payload.dhViagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">POLTRONA</span>
                  <span className="font-bold text-sm text-blue-700">{bpe.payload.poltrona}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block">PLATAFORMA</span>
                  <span className="font-bold text-[11px]">{bpe.payload.plataforma || '12'}</span>
                </div>
              </div>

              {bpe.payload.tpServico && (
                <p className="text-[9px] text-slate-600 mt-1">
                  SERVIÇO: <span className="font-semibold">{bpe.payload.tpServico}</span>
                  {bpe.payload.prefixo && ` • PREFIXO: ${bpe.payload.prefixo}`}
                </p>
              )}
            </div>

            {/* Passageiro e Comprador */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="font-bold text-[10px] mb-1 bg-slate-200/70 px-1 py-0.5 text-slate-800">
                PASSAGEIRO / COMPRADOR
              </div>
              <p className="font-bold text-[11px]">{pass.xNome}</p>
              <p className="text-[10px] text-slate-700">DOC/CPF: {pass.cpfOuDoc}</p>
              {comp.xNome !== pass.xNome && (
                <p className="text-[9px] text-slate-500 mt-0.5">COMPRADOR: {comp.xNome} ({comp.cpfOuCnpj})</p>
              )}
            </div>

            {/* Detalhamento de Valores */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="font-bold text-[10px] mb-1 bg-slate-200/70 px-1 py-0.5 text-slate-800">
                DISCRIMINAÇÃO DOS VALORES
              </div>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>TARIFA:</span>
                  <span>{formatarMoeda(val.vTarifa || 0)}</span>
                </div>
                {(val.vTaxaEmbarque || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>TAXA DE EMBARQUE:</span>
                    <span>{formatarMoeda(val.vTaxaEmbarque || 0)}</span>
                  </div>
                )}
                {(val.vPedagio || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>PEDÁGIO:</span>
                    <span>{formatarMoeda(val.vPedagio || 0)}</span>
                  </div>
                )}
                {(val.vSeguro || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>SEGURO:</span>
                    <span>{formatarMoeda(val.vSeguro || 0)}</span>
                  </div>
                )}
                {(val.vOutros || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>OUTROS:</span>
                    <span>{formatarMoeda(val.vOutros || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300 text-slate-900">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-blue-900">{formatarMoeda(total)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 pt-0.5">
                  <span>FORMA DE PAGAMENTO:</span>
                  <span className="font-semibold">
                    {bpe.payload.pagamentos?.[0]?.tPag === '17'
                      ? 'PIX'
                      : bpe.payload.pagamentos?.[0]?.tPag === '03'
                      ? 'CARTÃO DE CRÉDITO'
                      : bpe.payload.pagamentos?.[0]?.tPag === '04'
                      ? 'CARTÃO DE DÉBITO'
                      : 'DINHEIRO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tributos */}
            <div className="py-1 text-[8px] text-slate-500 border-b border-dashed border-slate-400">
              <p>TRIBUTOS APROXIMADOS (LEI 12.741/2012): {formatarMoeda(bpe.payload.icms?.vTotTrib || total * 0.165)}</p>
              {bpe.payload.infCpl && <p className="mt-0.5 text-slate-700 italic">{bpe.payload.infCpl}</p>}
            </div>

            {/* Chave de Acesso e QR Code */}
            <div className="py-2 text-center">
              <p className="font-bold text-[9px] text-slate-600 mb-0.5">CONSULTE PELA CHAVE DE ACESSO EM</p>
              <p className="text-[9px] text-blue-700 underline font-sans mb-1">https://dfe-portal.svrs.rs.gov.br/bpe/consulta</p>
              <div className="p-1.5 bg-slate-50 border border-slate-300 text-[10px] font-bold text-slate-800 tracking-wider break-all">
                {formatarChave4x(bpe.chave)}
              </div>

              {qrCodeDataUrl && (
                <div className="flex flex-col items-center mt-2">
                  <img src={qrCodeDataUrl} alt="QR Code BP-e" className="w-28 h-28 border border-slate-200 p-1" />
                  <span className="text-[8px] text-slate-500 mt-0.5">QR-Code de Consulta SEFAZ</span>
                </div>
              )}
            </div>

            {/* Canhoto de Embarque (picotado) */}
            <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-500">
              <div className="text-center text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                - - - - - - - - - - CORTE AQUI / VIA DA EMPRESA - - - - - - - - - -
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold">{emit.xFant || emit.xNome}</span>
                <span className="font-bold">BP-e Nº {bpe.nBPe}</span>
              </div>
              <div className="grid grid-cols-2 text-[9px] mt-1">
                <div>LINHA: {bpe.payload.xLinha.substring(0, 22)}...</div>
                <div className="text-right">DATA: {new Date(bpe.payload.dhViagem).toLocaleDateString('pt-BR')}</div>
                <div>PASSAGEIRO: {pass.xNome.substring(0, 20)}</div>
                <div className="text-right font-bold text-blue-800">POLTRONA: {bpe.payload.poltrona}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
