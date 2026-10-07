import crypto from 'crypto';
import { BPeEmissaoPayload, BPeEmitente } from '../types/bpe';
import { cleanDocumento, getCodigoIBGEPorUF, getUFPorCodigoIBGE } from './ibge';
import { gerarChaveBPe } from './chaveAcesso';

function sanitize(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .trim();
}

function formatDecimal(val?: number, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) {
    return (0).toFixed(decimals);
  }
  return Number(val).toFixed(decimals);
}

export function formatarDataHoraSefaz(dateInput?: string | Date): string {
  const d = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(d.getTime())) {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '-03:00');
  }

  // Obter formato YYYY-MM-DDTHH:mm:ss-03:00 (timezone Brasília padrão SEFAZ)
  const pad = (n: number) => String(n).padStart(2, '0');
  const ano = d.getFullYear();
  const mes = pad(d.getMonth() + 1);
  const dia = pad(d.getDate());
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  const seg = pad(d.getSeconds());

  return `${ano}-${mes}-${dia}T${hora}:${min}:${seg}-03:00`;
}

/**
 * Gera a URL do QR Code do BP-e conforme padrão SEFAZ (SVRS / MOC BP-e)
 */
export function gerarUrlQrCodeBPe(chave: string, tpAmb: 1 | 2, cHashBPe = ''): { qrCodeUrl: string; urlChave: string } {
  // Ex: https://dfe-portal.svrs.rs.gov.br/bpe/qrcode?chBPe=35260812345678000199630010000000011123456789&tpAmb=2
  const baseUrl = tpAmb === 1
    ? 'https://dfe-portal.svrs.rs.gov.br/bpe/qrcode'
    : 'https://dfe-portal.svrs.rs.gov.br/bpe/qrcode';

  const urlChave = 'https://dfe-portal.svrs.rs.gov.br/bpe/consulta';

  // Se houver hash/sign do contribuinte
  let signParam = '';
  if (cHashBPe) {
    const sha1 = crypto.createHash('sha1').update(`${chave}|${tpAmb}|${cHashBPe}`).digest('hex');
    signParam = `&sign=${sha1}`;
  }

  const qrCodeUrl = `${baseUrl}?chBPe=${chave}&tpAmb=${tpAmb}${signParam}`;

  return { qrCodeUrl, urlChave };
}

export interface BuildXmlResult {
  xmlSemAssinatura: string;
  chave: string;
  nBPe: number;
  serie: number;
  cBP: string;
  cDV: string;
  dhEmi: string;
  qrCodeUrl: string;
  urlChave: string;
}

/**
 * Monta o XML do BP-e (versão 1.00) pronto para assinatura digital.
 */
export function buildBPeXml(payload: BPeEmissaoPayload, emitentePadrao: BPeEmitente, proximoNumero = 1): BuildXmlResult {
  const emit = payload.emitente || emitentePadrao;
  const tpAmb = payload.tpAmb || 2;
  const serie = payload.serie || 1;
  const nBPe = payload.nBPe || proximoNumero;
  const modal = payload.modal || 1; // 1-Rodoviário
  const tpEmis = payload.tpEmis || 1; // 1-Normal
  const tpBPe = payload.tpBPe ?? 0; // 0-Normal
  const dhEmi = formatarDataHoraSefaz(payload.dhEmi);
  const dhViagem = formatarDataHoraSefaz(payload.dhViagem);

  const ufEmit = (payload.cUF ? getUFPorCodigoIBGE(payload.cUF) : (emit.enderEmit?.uf || payload.ufIni || 'PA')).toUpperCase();
  const cnpjClean = cleanDocumento(emit.cnpj);

  // Gerar Chave de Acesso
  const chaveInfo = gerarChaveBPe({
    uf: ufEmit,
    dataEmissao: dhEmi,
    cnpjEmitente: cnpjClean,
    serie,
    nBPe,
    tpEmis,
  });

  const chave = chaveInfo.chave;
  const { qrCodeUrl, urlChave } = gerarUrlQrCodeBPe(chave, tpAmb);

  // Passageiro (se não informado explicitamente, usa comprador)
  const pass = payload.passageiro || {
    xNome: payload.comprador.xNome,
    cpfOuDoc: payload.comprador.cpfOuCnpj,
  };

  const compCpfOuCnpj = cleanDocumento(payload.comprador.cpfOuCnpj);
  const compIsCnpj = compCpfOuCnpj.length === 14;

  const passCpfOuDoc = cleanDocumento(pass.cpfOuDoc);
  const passIsCpf = passCpfOuDoc.length === 11;

  // Totais e Componentes
  const vTarifa = payload.valores.vTarifa || 0;
  const vPedagio = payload.valores.vPedagio || 0;
  const vTaxaEmbarque = payload.valores.vTaxaEmbarque || 0;
  const vSeguro = payload.valores.vSeguro || 0;
  const vOutros = payload.valores.vOutros || 0;
  const vTBP = vTarifa + vPedagio + vTaxaEmbarque + vSeguro + vOutros;

  // ICMS
  const icmsConfig = payload.icms || { cst: '00', pICMS: 12, vBC: vTBP, vICMS: (vTBP * 12) / 100 };
  let icmsXml = '';

  if (icmsConfig.cst === 'SN') {
    icmsXml = `<ICMSSN><CST>SN</CST><indSN>1</indSN></ICMSSN>`;
  } else if (icmsConfig.cst === '00') {
    const vBC = icmsConfig.vBC !== undefined ? icmsConfig.vBC : vTBP;
    const pICMS = icmsConfig.pICMS || 12;
    const vICMS = icmsConfig.vICMS !== undefined ? icmsConfig.vICMS : (vBC * pICMS) / 100;
    icmsXml = `<ICMS00><CST>00</CST><vBC>${formatDecimal(vBC)}</vBC><pICMS>${formatDecimal(pICMS)}</pICMS><vICMS>${formatDecimal(vICMS)}</vICMS></ICMS00>`;
  } else if (icmsConfig.cst === '20') {
    const pRedBC = icmsConfig.pRedBC || 20;
    const vBC = icmsConfig.vBC !== undefined ? icmsConfig.vBC : (vTBP * (100 - pRedBC)) / 100;
    const pICMS = icmsConfig.pICMS || 12;
    const vICMS = (vBC * pICMS) / 100;
    icmsXml = `<ICMS20><CST>20</CST><pRedBC>${formatDecimal(pRedBC)}</pRedBC><vBC>${formatDecimal(vBC)}</vBC><pICMS>${formatDecimal(pICMS)}</pICMS><vICMS>${formatDecimal(vICMS)}</vICMS></ICMS20>`;
  } else if (icmsConfig.cst === '45') {
    icmsXml = `<ICMS45><CST>45</CST></ICMS45>`;
  } else {
    // 90
    icmsXml = `<ICMS90><CST>90</CST><vBC>${formatDecimal(icmsConfig.vBC || 0)}</vBC><pICMS>${formatDecimal(icmsConfig.pICMS || 0)}</pICMS><vICMS>${formatDecimal(icmsConfig.vICMS || 0)}</vICMS></ICMS90>`;
  }

  // Pagamentos
  const pagamentos = payload.pagamentos && payload.pagamentos.length > 0
    ? payload.pagamentos
    : [{ tPag: '01' as const, vPag: vTBP }];

  const pagXml = pagamentos.map(p => `
    <detPag>
      <tPag>${p.tPag}</tPag>
      <vPag>${formatDecimal(p.vPag)}</vPag>
      <tpIntegra>${p.tpIntegra || '2'}</tpIntegra>
      ${p.cnpjCredora ? `<CNPJCredora>${cleanDocumento(p.cnpjCredora)}</CNPJCredora>` : ''}
      ${p.tBand ? `<tBand>${p.tBand}</tBand>` : ''}
      ${p.cAut ? `<cAut>${sanitize(p.cAut)}</cAut>` : ''}
    </detPag>
  `).join('');

  // XML Final v1.00
  const xmlSemAssinatura = `<?xml version="1.0" encoding="UTF-8"?>
<BPe xmlns="http://www.portalfiscal.inf.br/bpe">
  <infBPe Id="BPe${chave}" versao="1.00">
    <ide>
      <cUF>${chaveInfo.cUF}</cUF>
      <tpAmb>${tpAmb}</tpAmb>
      <mod>63</mod>
      <serie>${serie}</serie>
      <nBPe>${nBPe}</nBPe>
      <cBP>${chaveInfo.cBP}</cBP>
      <cDV>${chaveInfo.cDV}</cDV>
      <modal>${modal}</modal>
      <dhEmi>${dhEmi}</dhEmi>
      <tpEmis>${tpEmis}</tpEmis>
      <verProc>1.0.0</verProc>
      <UFIni>${payload.ufIni.toUpperCase()}</UFIni>
      <cMunIni>${cleanDocumento(payload.cMunIni)}</cMunIni>
      <xMunIni>${sanitize(payload.xMunIni)}</xMunIni>
      <UFFim>${payload.ufFim.toUpperCase()}</UFFim>
      <cMunFim>${cleanDocumento(payload.cMunFim)}</cMunFim>
      <xMunFim>${sanitize(payload.xMunFim)}</xMunFim>
      <tpTrecho>${payload.tpTrecho}</tpTrecho>
      <dhViagem>${dhViagem}</dhViagem>
      <tpViagem>${payload.tpViagem}</tpViagem>
      <tpBPe>${tpBPe}</tpBPe>
      ${payload.chBPeSubst ? `<chBPeSubst>${cleanDocumento(payload.chBPeSubst)}</chBPeSubst>` : ''}
    </ide>
    <emit>
      <CNPJ>${cnpjClean}</CNPJ>
      <IE>${cleanDocumento(emit.ie)}</IE>
      <xNome>${sanitize(emit.xNome)}</xNome>
      ${emit.xFant ? `<xFant>${sanitize(emit.xFant)}</xFant>` : ''}
      ${emit.tar ? `<TAR>${sanitize(emit.tar)}</TAR>` : ''}
      <enderEmit>
        <xLgr>${sanitize(emit.enderEmit.xLgr)}</xLgr>
        <nro>${sanitize(emit.enderEmit.nro)}</nro>
        ${emit.enderEmit.xCpl ? `<xCpl>${sanitize(emit.enderEmit.xCpl)}</xCpl>` : ''}
        <xBairro>${sanitize(emit.enderEmit.xBairro)}</xBairro>
        <cMun>${cleanDocumento(emit.enderEmit.cMun)}</cMun>
        <xMun>${sanitize(emit.enderEmit.xMun)}</xMun>
        <CEP>${cleanDocumento(emit.enderEmit.cep)}</CEP>
        <UF>${emit.enderEmit.uf.toUpperCase()}</UF>
        ${emit.enderEmit.fone ? `<fone>${cleanDocumento(emit.enderEmit.fone)}</fone>` : ''}
      </enderEmit>
    </emit>
    <comp>
      <xNome>${sanitize(payload.comprador.xNome)}</xNome>
      ${compIsCnpj ? `<CNPJ>${compCpfOuCnpj}</CNPJ>` : `<CPF>${compCpfOuCnpj}</CPF>`}
      ${payload.comprador.ie ? `<IE>${cleanDocumento(payload.comprador.ie)}</IE>` : ''}
      ${payload.comprador.fone ? `<fone>${cleanDocumento(payload.comprador.fone)}</fone>` : ''}
      ${payload.comprador.email ? `<email>${sanitize(payload.comprador.email)}</email>` : ''}
    </comp>
    <passageiro>
      <xNome>${sanitize(pass.xNome)}</xNome>
      ${passIsCpf ? `<CPF>${passCpfOuDoc}</CPF>` : `<Doc><tpDoc>${pass.tpDoc || '01'}</tpDoc><nDoc>${sanitize(pass.nDoc || passCpfOuDoc)}</nDoc></Doc>`}
      ${pass.dNasc ? `<dNasc>${pass.dNasc}</dNasc>` : ''}
      ${pass.fone ? `<fone>${cleanDocumento(pass.fone)}</fone>` : ''}
      ${pass.email ? `<email>${sanitize(pass.email)}</email>` : ''}
    </passageiro>
    <infPassagem>
      ${payload.cLinha ? `<cLinha>${sanitize(payload.cLinha)}</cLinha>` : ''}
      <xLinha>${sanitize(payload.xLinha)}</xLinha>
      ${payload.prefixo ? `<prefixo>${sanitize(payload.prefixo)}</prefixo>` : ''}
      <poltrona>${sanitize(payload.poltrona)}</poltrona>
      ${payload.plataforma ? `<plataforma>${sanitize(payload.plataforma)}</plataforma>` : ''}
      ${payload.tpServico ? `<tpServico>${payload.tpServico}</tpServico>` : ''}
    </infPassagem>
    <vPrest>
      <vTBP>${formatDecimal(vTBP)}</vTBP>
      <Comp>
        <xNome>Tarifa</xNome>
        <vComp>${formatDecimal(vTarifa)}</vComp>
      </Comp>
      ${vPedagio > 0 ? `<Comp><xNome>Pedagio</xNome><vComp>${formatDecimal(vPedagio)}</vComp></Comp>` : ''}
      ${vTaxaEmbarque > 0 ? `<Comp><xNome>Taxa de Embarque</xNome><vComp>${formatDecimal(vTaxaEmbarque)}</vComp></Comp>` : ''}
      ${vSeguro > 0 ? `<Comp><xNome>Seguro</xNome><vComp>${formatDecimal(vSeguro)}</vComp></Comp>` : ''}
      ${vOutros > 0 ? `<Comp><xNome>Outros</xNome><vComp>${formatDecimal(vOutros)}</vComp></Comp>` : ''}
    </vPrest>
    <imp>
      <ICMS>
        ${icmsXml}
      </ICMS>
      ${icmsConfig.vTotTrib ? `<vTotTrib>${formatDecimal(icmsConfig.vTotTrib)}</vTotTrib>` : ''}
    </imp>
    <pag>
      ${pagXml}
    </pag>
    <infAdic>
      ${payload.infAdFisco ? `<infAdFisco>${sanitize(payload.infAdFisco)}</infAdFisco>` : ''}
      ${payload.infCpl ? `<infCpl>${sanitize(payload.infCpl)}</infCpl>` : ''}
    </infAdic>
  </infBPe>
  <infBPeSupl>
    <qrCodBPe><![CDATA[${qrCodeUrl}]]></qrCodBPe>
    <urlChave>${urlChave}</urlChave>
  </infBPeSupl>
</BPe>`.trim();

  return {
    xmlSemAssinatura,
    chave,
    nBPe,
    serie,
    cBP: chaveInfo.cBP,
    cDV: chaveInfo.cDV,
    dhEmi,
    qrCodeUrl,
    urlChave,
  };
}

/**
 * Encapsula o BP-e assinado e o protocolo de autorização no formato de distribuição oficial (bpeProc).
 */
export function buildProcBPeXml(params: {
  xmlAssinado: string;
  chave: string;
  tpAmb: 1 | 2;
  nProt: string;
  dhRecbto: string;
  digVal?: string;
  cStat?: number;
  xMotivo?: string;
  verAplic?: string;
}): string {
  const { xmlAssinado, chave, tpAmb, nProt, dhRecbto, digVal = '', cStat = 100, xMotivo = 'Autorizado o uso do BP-e', verAplic = 'SVRS2026' } = params;

  // Remove declaração <?xml ...?> do xmlAssinado se houver
  const xmlBPeClean = xmlAssinado.replace(/<\?xml[^>]*\?>/gi, '').trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpeProc versao="1.00" xmlns="http://www.portalfiscal.inf.br/bpe">
  ${xmlBPeClean}
  <protBPe versao="1.00">
    <infProt>
      <tpAmb>${tpAmb}</tpAmb>
      <verAplic>${verAplic}</verAplic>
      <chBPe>${chave}</chBPe>
      <dhRecbto>${dhRecbto}</dhRecbto>
      <nProt>${nProt}</nProt>
      ${digVal ? `<digVal>${digVal}</digVal>` : ''}
      <cStat>${cStat}</cStat>
      <xMotivo>${sanitize(xMotivo)}</xMotivo>
    </infProt>
  </protBPe>
</bpeProc>`.trim();
}

/**
 * Monta XML do Evento de Cancelamento (tpEvento 110111) ou Não Embarque (110115)
 */
export function buildEventoBPeXml(params: {
  chave: string;
  tpAmb: 1 | 2;
  cnpjEmitente: string;
  tpEvento: '110111' | '110115' | '110114';
  nSeqEvento?: number;
  nProt?: string; // Protocolo do BP-e
  justificativa?: string;
}): { xmlSemAssinatura: string; idEvento: string; dhEvento: string } {
  const { chave, tpAmb, cnpjEmitente, tpEvento, nSeqEvento = 1, nProt = '', justificativa = 'Cancelamento solicitado pelo passageiro' } = params;
  const cUF = chave.substring(0, 2);
  const cnpjClean = cleanDocumento(cnpjEmitente);
  const dhEvento = formatarDataHoraSefaz();
  const idEvento = `ID${tpEvento}${chave}${String(nSeqEvento).padStart(2, '0')}`;

  let detEventoXml = '';
  let descEvento = 'Cancelamento';

  if (tpEvento === '110111') {
    descEvento = 'Cancelamento';
    detEventoXml = `
      <evCancBPe>
        <descEvento>${descEvento}</descEvento>
        <nProt>${nProt || '115260000000001'}</nProt>
        <xJust>${sanitize(justificativa)}</xJust>
      </evCancBPe>
    `;
  } else if (tpEvento === '110115') {
    descEvento = 'Nao Embarque';
    detEventoXml = `
      <evNaoEmbBPe>
        <descEvento>${descEvento}</descEvento>
        <nProt>${nProt || '115260000000001'}</nProt>
        <xJust>${sanitize(justificativa)}</xJust>
      </evNaoEmbBPe>
    `;
  }

  const xmlSemAssinatura = `<?xml version="1.0" encoding="UTF-8"?>
<eventoBPe xmlns="http://www.portalfiscal.inf.br/bpe" versao="1.00">
  <infEvento Id="${idEvento}">
    <cOrgao>${cUF}</cOrgao>
    <tpAmb>${tpAmb}</tpAmb>
    <CNPJ>${cnpjClean}</CNPJ>
    <chBPe>${chave}</chBPe>
    <dhEvento>${dhEvento}</dhEvento>
    <tpEvento>${tpEvento}</tpEvento>
    <nSeqEvento>${nSeqEvento}</nSeqEvento>
    <detEvento versaoEvento="1.00">
      ${detEventoXml.trim()}
    </detEvento>
  </infEvento>
</eventoBPe>`.trim();

  return { xmlSemAssinatura, idEvento, dhEvento };
}
