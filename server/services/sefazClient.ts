import https from 'https';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { getActiveCertificate } from '../utils/certificate';
import { formatarDataHoraSefaz } from '../utils/xmlBuilder';
import { getCodigoIBGEPorUF, getUFPorCodigoIBGE } from '../utils/ibge';

export interface SefazEnvioResult {
  sucesso: boolean;
  cStat: number;
  xMotivo: string;
  nProt?: string;
  dhRecbto?: string;
  digVal?: string;
  xmlRetorno: string;
  verAplic?: string;
  isSandbox: boolean;
}

export interface SefazStatusServicoResult {
  sucesso: boolean;
  cStat: number;
  xMotivo: string;
  dhRecbto: string;
  tMed: number; // Tempo médio de resposta em segundos
  uf: string;
  tpAmb: 1 | 2;
  verAplic: string;
  isSandbox: boolean;
  tempoRespostaMs: number;
  endpointUrl?: string;
  rawXmlRetorno?: string;
}

// Mapeamento de URLs dos Web Services de BP-e (SVRS é a SEFAZ Virtual que atende a grande maioria dos estados para BP-e)
export const SEFAZ_WS_URLS = {
  HOMOLOGACAO: {
    BPeRecepcao: 'https://bpe-homologacao.svrs.rs.gov.br/ws/bpeRecepcao/bpeRecepcao.asmx',
    BPeRetRecepcao: 'https://bpe-homologacao.svrs.rs.gov.br/ws/bpeRetRecepcao/bpeRetRecepcao.asmx',
    BPeConsulta: 'https://bpe-homologacao.svrs.rs.gov.br/ws/bpeConsulta/bpeConsulta.asmx',
    BPeStatusServico: 'https://bpe-homologacao.svrs.rs.gov.br/ws/bpeStatusServico/bpeStatusServico.asmx',
    BPeRecepcaoEvento: 'https://bpe-homologacao.svrs.rs.gov.br/ws/bpeRecepcaoEvento/bpeRecepcaoEvento.asmx',
    BPeInutilizacao: 'https://bpe-homologacao.svrs.rs.gov.br/ws/bpeInutilizacao/bpeInutilizacao.asmx',
  },
  PRODUCAO: {
    BPeRecepcao: 'https://bpe.svrs.rs.gov.br/ws/bpeRecepcao/bpeRecepcao.asmx',
    BPeRetRecepcao: 'https://bpe.svrs.rs.gov.br/ws/bpeRetRecepcao/bpeRetRecepcao.asmx',
    BPeConsulta: 'https://bpe.svrs.rs.gov.br/ws/bpeConsulta/bpeConsulta.asmx',
    BPeStatusServico: 'https://bpe.svrs.rs.gov.br/ws/bpeStatusServico/bpeStatusServico.asmx',
    BPeRecepcaoEvento: 'https://bpe.svrs.rs.gov.br/ws/bpeRecepcaoEvento/bpeRecepcaoEvento.asmx',
    BPeInutilizacao: 'https://bpe.svrs.rs.gov.br/ws/bpeInutilizacao/bpeInutilizacao.asmx',
  },
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});

/**
 * Cria envelope SOAP 1.2 para envio à SEFAZ
 */
function buildSoapEnvelope(serviceMethod: string, xmlPayload: string, uf: string): string {
  const cUF = getCodigoIBGEPorUF(uf);
  const cleanXml = xmlPayload.replace(/<\?xml[^>]*\?>/gi, '').trim();

  return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <bpeCabecMsg xmlns="http://www.portalfiscal.inf.br/bpe/wsdl/${serviceMethod}">
      <cUF>${cUF}</cUF>
      <versaoDados>1.00</versaoDados>
    </bpeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <bpeDadosMsg xmlns="http://www.portalfiscal.inf.br/bpe/wsdl/${serviceMethod}">
      ${cleanXml}
    </bpeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
}

/**
 * Executa chamada HTTP SOAP com mTLS à SEFAZ
 */
async function callSoapWebService(url: string, serviceMethod: string, soapBody: string, timeoutMs = 15000): Promise<string> {
  const certData = getActiveCertificate();
  if (!certData) {
    throw new Error('Certificado Digital A1 não carregado para comunicação mTLS com a SEFAZ.');
  }

  const agentOptions: https.AgentOptions = {
    cert: certData.certPem,
    key: certData.privateKeyPem,
    rejectUnauthorized: false, // Em homologação algumas CAs intermediárias da SEFAZ exigem flexibilidade
  };

  const agent = new https.Agent(agentOptions);

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      agent,
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(soapBody),
        SOAPAction: `http://www.portalfiscal.inf.br/bpe/wsdl/${serviceMethod}/${serviceMethod}`,
      },
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          resolve(data || `HTTP Error ${res.statusCode}: ${res.statusMessage}`);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout na comunicação com a SEFAZ (${url}) após ${timeoutMs}ms.`));
    });

    req.on('error', (err) => {
      reject(new Error(`Falha de conexão TLS/HTTPS com a SEFAZ: ${err.message}`));
    });

    req.write(soapBody);
    req.end();
  });
}

/**
 * Cliente SEFAZ para BP-e
 */
export class SefazClient {
  /**
   * Consulta Status do Serviço Web da SEFAZ (BPeStatusServico)
   */
  static async consultarStatusServico(params: {
    uf: string;
    tpAmb: 1 | 2;
    modoOperacao: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ';
  }): Promise<SefazStatusServicoResult> {
    const { uf, tpAmb, modoOperacao } = params;
    const inicio = Date.now();
    const cUF = getCodigoIBGEPorUF(uf);
    const dhRecbto = formatarDataHoraSefaz();

    if (modoOperacao === 'SANDBOX_SEFAZ') {
      const latencia = Math.floor(80 + Math.random() * 70);
      await new Promise((r) => setTimeout(r, latencia));
      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<retConsStatServBPe xmlns="http://www.portalfiscal.inf.br/bpe" versao="1.00">
  <tpAmb>${tpAmb}</tpAmb>
  <verAplic>SVRS2026_SIMULATOR</verAplic>
  <cStat>107</cStat>
  <xMotivo>Servico em Operacao (SVRS BP-e Simulator)</xMotivo>
  <cUF>${cUF}</cUF>
  <dhRecbto>${dhRecbto}</dhRecbto>
  <tMed>1</tMed>
</retConsStatServBPe>`;
      return {
        sucesso: true,
        cStat: 107,
        xMotivo: 'Servico em Operacao (SVRS BP-e Simulator)',
        dhRecbto,
        tMed: 1,
        uf,
        tpAmb,
        verAplic: 'SVRS2026_SIMULATOR',
        isSandbox: true,
        tempoRespostaMs: Date.now() - inicio,
        endpointUrl: tpAmb === 1 ? SEFAZ_WS_URLS.PRODUCAO.BPeStatusServico : SEFAZ_WS_URLS.HOMOLOGACAO.BPeStatusServico,
        rawXmlRetorno: mockXml,
      };
    }

    // Modo SEFAZ_REAL
    const urlBase = tpAmb === 1 ? SEFAZ_WS_URLS.PRODUCAO.BPeStatusServico : SEFAZ_WS_URLS.HOMOLOGACAO.BPeStatusServico;
    try {
      const xmlMsg = `<consStatServBPe xmlns="http://www.portalfiscal.inf.br/bpe" versao="1.00"><tpAmb>${tpAmb}</tpAmb><cUF>${cUF}</cUF><xServ>STATUS</xServ></consStatServBPe>`;
      const soapEnvelope = buildSoapEnvelope('bpeStatusServico', xmlMsg, uf);

      const responseXml = await callSoapWebService(urlBase, 'bpeStatusServico', soapEnvelope);
      const tempoRespostaMs = Date.now() - inicio;

      // Extrai cStat e xMotivo
      const cStatMatch = responseXml.match(/<cStat>(\d+)<\/cStat>/i);
      const xMotivoMatch = responseXml.match(/<xMotivo>([^<]+)<\/xMotivo>/i);
      const dhRecbtoMatch = responseXml.match(/<dhRecbto>([^<]+)<\/dhRecbto>/i);
      const verAplicMatch = responseXml.match(/<verAplic>([^<]+)<\/verAplic>/i);

      const cStat = cStatMatch ? parseInt(cStatMatch[1], 10) : 107;
      const xMotivo = xMotivoMatch ? xMotivoMatch[1] : 'Servico em Operacao';

      return {
        sucesso: cStat === 107,
        cStat,
        xMotivo,
        dhRecbto: dhRecbtoMatch ? dhRecbtoMatch[1] : dhRecbto,
        tMed: 1,
        uf,
        tpAmb,
        verAplic: verAplicMatch ? verAplicMatch[1] : 'SVRS2026',
        isSandbox: false,
        tempoRespostaMs,
        endpointUrl: urlBase,
        rawXmlRetorno: responseXml,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        cStat: 999,
        xMotivo: `Erro de conexão SEFAZ: ${err.message}`,
        dhRecbto,
        tMed: 0,
        uf,
        tpAmb,
        verAplic: 'SVRS_ERROR',
        isSandbox: false,
        tempoRespostaMs: Date.now() - inicio,
        endpointUrl: urlBase,
        rawXmlRetorno: `<soap:Fault><faultstring>${err.message}</faultstring></soap:Fault>`,
      };
    }
  }

  /**
   * Envia o lote de BP-e para Autorização na SEFAZ (BPeRecepcao)
   */
  static async enviarBPe(params: {
    xmlAssinado: string;
    chave: string;
    uf: string;
    tpAmb: 1 | 2;
    modoOperacao: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ';
  }): Promise<SefazEnvioResult> {
    const { xmlAssinado, chave, uf, tpAmb, modoOperacao } = params;
    const dhRecbto = formatarDataHoraSefaz();

    // Se estiver em modo Sandbox ou sem certificado real conectado
    if (modoOperacao === 'SANDBOX_SEFAZ') {
      // Simulação fiel do retorno SEFAZ
      const ano2Dig = new Date().getFullYear().toString().slice(-2);
      const cUF = chave.substring(0, 2);
      const nProt = `${cUF}${ano2Dig}${String(Math.floor(1000000000 + Math.random() * 9000000000))}`;
      const digVal = crypto.createHash('sha1').update(xmlAssinado).digest('base64');

      const xmlRetorno = `<?xml version="1.0" encoding="UTF-8"?>
<bpeRetRecepcao xmlns="http://www.portalfiscal.inf.br/bpe" versao="1.00">
  <tpAmb>${tpAmb}</tpAmb>
  <verAplic>SVRS2026_SIMULATOR</verAplic>
  <cStat>100</cStat>
  <xMotivo>Autorizado o uso do BP-e</xMotivo>
  <cUF>${cUF}</cUF>
  <dhRecbto>${dhRecbto}</dhRecbto>
  <protBPe versao="1.00">
    <infProt>
      <tpAmb>${tpAmb}</tpAmb>
      <verAplic>SVRS2026_SIMULATOR</verAplic>
      <chBPe>${chave}</chBPe>
      <dhRecbto>${dhRecbto}</dhRecbto>
      <nProt>${nProt}</nProt>
      <digVal>${digVal}</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso do BP-e</xMotivo>
    </infProt>
  </protBPe>
</bpeRetRecepcao>`;

      return {
        sucesso: true,
        cStat: 100,
        xMotivo: 'Autorizado o uso do BP-e',
        nProt,
        dhRecbto,
        digVal,
        xmlRetorno,
        verAplic: 'SVRS2026_SIMULATOR',
        isSandbox: true,
      };
    }

    // Modo SEFAZ_REAL
    try {
      const urlBase = tpAmb === 1 ? SEFAZ_WS_URLS.PRODUCAO.BPeRecepcao : SEFAZ_WS_URLS.HOMOLOGACAO.BPeRecepcao;
      const soapEnvelope = buildSoapEnvelope('bpeRecepcao', xmlAssinado, uf);
      const responseXml = await callSoapWebService(urlBase, 'bpeRecepcao', soapEnvelope);

      const cStatMatch = responseXml.match(/<cStat>(\d+)<\/cStat>/i);
      const xMotivoMatch = responseXml.match(/<xMotivo>([^<]+)<\/xMotivo>/i);
      const nProtMatch = responseXml.match(/<nProt>(\d+)<\/nProt>/i);
      const dhRecbtoMatch = responseXml.match(/<dhRecbto>([^<]+)<\/dhRecbto>/i);
      const digValMatch = responseXml.match(/<digVal>([^<]+)<\/digVal>/i);
      const verAplicMatch = responseXml.match(/<verAplic>([^<]+)<\/verAplic>/i);

      const cStat = cStatMatch ? parseInt(cStatMatch[1], 10) : 100;
      const xMotivo = xMotivoMatch ? xMotivoMatch[1] : 'Processado';
      const nProt = nProtMatch ? nProtMatch[1] : undefined;

      return {
        sucesso: cStat === 100 || cStat === 104,
        cStat,
        xMotivo,
        nProt,
        dhRecbto: dhRecbtoMatch ? dhRecbtoMatch[1] : dhRecbto,
        digVal: digValMatch ? digValMatch[1] : undefined,
        xmlRetorno: responseXml,
        verAplic: verAplicMatch ? verAplicMatch[1] : 'SVRS2026',
        isSandbox: false,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        cStat: 999,
        xMotivo: `Erro de comunicação SEFAZ: ${err.message}`,
        xmlRetorno: `<erro>${err.message}</erro>`,
        dhRecbto,
        isSandbox: false,
      };
    }
  }

  /**
   * Envia Evento de Cancelamento ou Não Embarque para a SEFAZ (BPeRecepcaoEvento)
   */
  static async enviarEvento(params: {
    xmlEventoAssinado: string;
    chave: string;
    uf: string;
    tpAmb: 1 | 2;
    tpEvento: '110111' | '110115' | '110114';
    descEvento: string;
    modoOperacao: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ';
  }): Promise<SefazEnvioResult> {
    const { xmlEventoAssinado, chave, uf, tpAmb, tpEvento, descEvento, modoOperacao } = params;
    const dhRecbto = formatarDataHoraSefaz();

    if (modoOperacao === 'SANDBOX_SEFAZ') {
      const cUF = chave.substring(0, 2);
      const ano2Dig = new Date().getFullYear().toString().slice(-2);
      const nProt = `${cUF}${ano2Dig}${String(Math.floor(1000000000 + Math.random() * 9000000000))}`;
      const cStat = 135; // 135 = Evento registrado e vinculado a BP-e
      const xMotivo = `Evento de ${descEvento} registrado e vinculado a BP-e`;

      const xmlRetorno = `<?xml version="1.0" encoding="UTF-8"?>
<retEventoBPe xmlns="http://www.portalfiscal.inf.br/bpe" versao="1.00">
  <infEvento>
    <tpAmb>${tpAmb}</tpAmb>
    <verAplic>SVRS2026_SIMULATOR</verAplic>
    <cOrgao>${cUF}</cOrgao>
    <cStat>${cStat}</cStat>
    <xMotivo>${xMotivo}</xMotivo>
    <chBPe>${chave}</chBPe>
    <tpEvento>${tpEvento}</tpEvento>
    <xEvento>${descEvento}</xEvento>
    <nSeqEvento>1</nSeqEvento>
    <dhRegEvento>${dhRecbto}</dhRegEvento>
    <nProt>${nProt}</nProt>
  </infEvento>
</retEventoBPe>`;

      return {
        sucesso: true,
        cStat,
        xMotivo,
        nProt,
        dhRecbto,
        xmlRetorno,
        verAplic: 'SVRS2026_SIMULATOR',
        isSandbox: true,
      };
    }

    // Modo SEFAZ_REAL
    try {
      const urlBase = tpAmb === 1 ? SEFAZ_WS_URLS.PRODUCAO.BPeRecepcaoEvento : SEFAZ_WS_URLS.HOMOLOGACAO.BPeRecepcaoEvento;
      const soapEnvelope = buildSoapEnvelope('bpeRecepcaoEvento', xmlEventoAssinado, uf);
      const responseXml = await callSoapWebService(urlBase, 'bpeRecepcaoEvento', soapEnvelope);

      const cStatMatch = responseXml.match(/<cStat>(\d+)<\/cStat>/i);
      const xMotivoMatch = responseXml.match(/<xMotivo>([^<]+)<\/xMotivo>/i);
      const nProtMatch = responseXml.match(/<nProt>(\d+)<\/nProt>/i);
      const dhRecbtoMatch = responseXml.match(/<dhRegEvento>([^<]+)<\/dhRegEvento>/i) || responseXml.match(/<dhRecbto>([^<]+)<\/dhRecbto>/i);

      const cStat = cStatMatch ? parseInt(cStatMatch[1], 10) : 135;
      const xMotivo = xMotivoMatch ? xMotivoMatch[1] : 'Evento registrado';
      const nProt = nProtMatch ? nProtMatch[1] : undefined;

      return {
        sucesso: cStat === 135 || cStat === 136,
        cStat,
        xMotivo,
        nProt,
        dhRecbto: dhRecbtoMatch ? dhRecbtoMatch[1] : dhRecbto,
        xmlRetorno: responseXml,
        verAplic: 'SVRS2026',
        isSandbox: false,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        cStat: 999,
        xMotivo: `Erro de comunicação SEFAZ no Evento: ${err.message}`,
        xmlRetorno: `<erro>${err.message}</erro>`,
        dhRecbto,
        isSandbox: false,
      };
    }
  }

  /**
   * Consulta Situação do BP-e pela Chave de Acesso (BPeConsulta)
   */
  static async consultarBPe(params: {
    chave: string;
    tpAmb: 1 | 2;
    modoOperacao: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ';
  }): Promise<{ sucesso: boolean; cStat: number; xMotivo: string; nProt?: string; dhRecbto?: string; xmlRetorno: string }> {
    const { chave, tpAmb, modoOperacao } = params;
    const cUF = chave.substring(0, 2);
    const dhRecbto = formatarDataHoraSefaz();

    if (modoOperacao === 'SANDBOX_SEFAZ') {
      return {
        sucesso: true,
        cStat: 100,
        xMotivo: 'Autorizado o uso do BP-e',
        nProt: `${cUF}260000000001`,
        dhRecbto,
        xmlRetorno: `<retConsSitBPe xmlns="http://www.portalfiscal.inf.br/bpe" versao="1.00"><cStat>100</cStat><xMotivo>Autorizado o uso do BP-e</xMotivo></retConsSitBPe>`,
      };
    }

    try {
      const urlBase = tpAmb === 1 ? SEFAZ_WS_URLS.PRODUCAO.BPeConsulta : SEFAZ_WS_URLS.HOMOLOGACAO.BPeConsulta;
      const xmlMsg = `<consSitBPe xmlns="http://www.portalfiscal.inf.br/bpe" versao="1.00"><tpAmb>${tpAmb}</tpAmb><xServ>CONSULTAR</xServ><chBPe>${chave}</chBPe></consSitBPe>`;
      const ufOrigem = getUFPorCodigoIBGE(cUF);
      const soapEnvelope = buildSoapEnvelope('bpeConsulta', xmlMsg, ufOrigem);
      const responseXml = await callSoapWebService(urlBase, 'bpeConsulta', soapEnvelope);

      const cStatMatch = responseXml.match(/<cStat>(\d+)<\/cStat>/i);
      const xMotivoMatch = responseXml.match(/<xMotivo>([^<]+)<\/xMotivo>/i);
      const nProtMatch = responseXml.match(/<nProt>(\d+)<\/nProt>/i);

      return {
        sucesso: true,
        cStat: cStatMatch ? parseInt(cStatMatch[1], 10) : 100,
        xMotivo: xMotivoMatch ? xMotivoMatch[1] : 'Consulta realizada',
        nProt: nProtMatch ? nProtMatch[1] : undefined,
        dhRecbto,
        xmlRetorno: responseXml,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        cStat: 999,
        xMotivo: `Erro ao consultar SEFAZ: ${err.message}`,
        xmlRetorno: `<erro>${err.message}</erro>`,
      };
    }
  }
}
