import {
  BPeEmissaoPayload,
  BPeRegistro,
  BPeEventoRegistro,
  MicroservicoConfig,
  BPeEmitente,
} from '../types/bpe';
import { buildBPeXml, buildProcBPeXml, buildEventoBPeXml, formatarDataHoraSefaz } from '../utils/xmlBuilder';
import { assinarXml } from '../utils/xmlSigner';
import {
  getActiveCertificate,
  parsePfxCertificate,
  gerarCertificadoTeste,
  getCertificadoConfig,
  clearActiveCertificate,
} from '../utils/certificate';
import { SefazClient } from './sefazClient';
import { cleanDocumento } from '../utils/ibge';

// Emitente padrão inicial (Empresa de Transporte sediada em Belém - PA)
const EMITENTE_PADRAO: BPeEmitente = {
  cnpj: '04891234000185',
  ie: '151234567',
  xNome: 'EXPRESSO AMAZONIA TRANSPORTES E TURISMO LTDA',
  xFant: 'EXPRESSO AMAZONIA - BELEM',
  tar: 'ARCON-PA Nº 0142/2026 • ANTT Nº 15.0042-PA',
  enderEmit: {
    xLgr: 'Avenida Almirante Barroso',
    nro: '1200',
    xCpl: 'Terminal Rodoviario de Belem - Guiche 08',
    xBairro: 'Sao Bras',
    cMun: '1501402',
    xMun: 'Belem',
    cep: '66093020',
    uf: 'PA',
    fone: '9132019000',
  },
};

class BPeService {
  private config: MicroservicoConfig = {
    ambientePadrao: 2, // 2-Homologação por padrão
    ufPadrao: 'PA', // Estado do Pará (SEFAZ-PA / SVRS)
    modoOperacao: 'SANDBOX_SEFAZ',
    proximoNumeroBPe: 1001,
    seriePadrao: 1,
    emitentePadrao: EMITENTE_PADRAO,
  };

  private historico: Map<string, BPeRegistro> = new Map();

  constructor() {
    // Inicializar com certificado de teste/sandbox e registros de exemplo para o Pará
    gerarCertificadoTeste(this.config.emitentePadrao.xNome, this.config.emitentePadrao.cnpj);
    this.seedExemplosIniciais();
  }

  private seedExemplosIniciais() {
    const agora = new Date();
    const dataViagem1 = new Date(agora.getTime() + 14 * 3600 * 1000);
    const dataViagem2 = new Date(agora.getTime() + 30 * 3600 * 1000);
    const dataViagem3 = new Date(agora.getTime() + 48 * 3600 * 1000);

    const payload1: BPeEmissaoPayload = {
      cUF: '15',
      ufIni: 'PA',
      cMunIni: '1501402',
      xMunIni: 'Belem',
      ufFim: 'PA',
      cMunFim: '1504208',
      xMunFim: 'Maraba',
      tpTrecho: 1, // 1-Intermunicipal (ARCON-PA)
      dhViagem: dataViagem1.toISOString(),
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
      infCpl: 'Viagem intermunicipal PA (Regulamentacao ARCON-PA). Bagagem permitida: ate 30kg.',
    };

    const payload2: BPeEmissaoPayload = {
      cUF: '15',
      ufIni: 'PA',
      cMunIni: '1501402',
      xMunIni: 'Belem',
      ufFim: 'PA',
      cMunFim: '1502400',
      xMunFim: 'Castanhal',
      tpTrecho: 1, // Intermunicipal
      dhViagem: dataViagem2.toISOString(),
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
          tPag: '04', // Débito
          vPag: 27.00,
          tpIntegra: '1',
        },
      ],
      infCpl: 'Linha regular diaria intermunicipal. Paradas autorizadas na BR-316.',
    };

    const payload3: BPeEmissaoPayload = {
      cUF: '15',
      ufIni: 'PA',
      cMunIni: '1501402',
      xMunIni: 'Belem',
      ufFim: 'MA',
      cMunFim: '2111300',
      xMunFim: 'Sao Luis',
      tpTrecho: 2, // Interestadual (ANTT)
      dhViagem: dataViagem3.toISOString(),
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
      infCpl: 'Onibus Leito com ar-condicionado, Wi-Fi e tomadas USB individuais.',
    };

    // Emitir os exemplos internamente
    this.emitirBPe(payload1).catch(() => {});
    this.emitirBPe(payload2).catch(() => {});
    this.emitirBPe(payload3).catch(() => {});
  }

  public getConfig(): MicroservicoConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<MicroservicoConfig>): MicroservicoConfig {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    return this.config;
  }

  public getCertificadoInfo() {
    return getCertificadoConfig(this.config.modoOperacao);
  }

  public carregarCertificadoPfx(buffer: Buffer, senha = '') {
    const parsed = parsePfxCertificate(buffer, senha);
    // Se o certificado tiver CNPJ e Razão Social, atualiza o emitente padrão
    if (parsed.cnpj) {
      this.config.emitentePadrao.cnpj = parsed.cnpj;
      this.config.emitentePadrao.xNome = parsed.razaoSocial;
    }
    return getCertificadoConfig(this.config.modoOperacao);
  }

  public gerarCertificadoDemonstracao() {
    gerarCertificadoTeste(this.config.emitentePadrao.xNome, this.config.emitentePadrao.cnpj);
    return getCertificadoConfig(this.config.modoOperacao);
  }

  public limparCertificado() {
    clearActiveCertificate();
    return getCertificadoConfig(this.config.modoOperacao);
  }

  /**
   * Emite um Bilhete de Passagem Eletrônico (BP-e)
   */
  public async emitirBPe(payload: BPeEmissaoPayload): Promise<{
    sucesso: boolean;
    chave: string;
    nBPe: number;
    serie: number;
    status: 'AUTORIZADO' | 'REJEITADO';
    cStat: number;
    xMotivo: string;
    nProt?: string;
    dhRecbto?: string;
    qrCodeUrl: string;
    urlChave: string;
    xmlAssinado: string;
    xmlProc?: string;
    dabpeUrl: string;
    isSandbox: boolean;
  }> {
    // 1. Validações básicas de negócio
    if (!payload.ufIni || !payload.ufFim) {
      throw new Error('UF de Origem (ufIni) e UF de Destino (ufFim) são obrigatórias.');
    }
    if (!payload.comprador?.xNome || !payload.comprador?.cpfOuCnpj) {
      throw new Error('Dados do comprador (Nome e CPF/CNPJ) são obrigatórios.');
    }
    if (!payload.poltrona) {
      throw new Error('Identificação da poltrona é obrigatória.');
    }
    if (!payload.valores?.vTarifa && payload.valores?.vTarifa !== 0) {
      throw new Error('Valor da tarifa é obrigatório.');
    }

    const nBPe = payload.nBPe || this.config.proximoNumeroBPe;
    const serie = payload.serie || this.config.seriePadrao;
    const tpAmb = payload.tpAmb || this.config.ambientePadrao;
    const uf = (payload.cUF || payload.emitente?.enderEmit.uf || this.config.emitentePadrao.enderEmit.uf).toUpperCase();

    // 2. Obter ou gerar certificado A1
    let certData = getActiveCertificate();
    if (this.config.modoOperacao === 'SEFAZ_REAL') {
      if (!certData) {
        throw new Error('Certificado Digital A1 não configurado. Para emissão real na SEFAZ (SVRS), importe um arquivo .pfx/.p12 com chave privada ICP-Brasil.');
      }
      if (certData.isDemo) {
        throw new Error('Certificado demonstrativo/fictício ativo. A SEFAZ oficial (SVRS) exige certificado digital ICP-Brasil e-CNPJ real da sua empresa.');
      }
    } else {
      if (!certData) {
        certData = gerarCertificadoTeste(this.config.emitentePadrao.xNome, this.config.emitentePadrao.cnpj);
      }
    }

    // 3. Montar XML não assinado do BP-e
    const buildResult = buildBPeXml(payload, this.config.emitentePadrao, nBPe);

    // 4. Assinar digitalmente o XML com o Certificado Digital A1
    const xmlAssinado = assinarXml(buildResult.xmlSemAssinatura, {
      tagParaAssinar: 'infBPe',
      idAtributo: 'Id',
      certData,
    });

    // 5. Enviar para WebService SEFAZ (ou simulador)
    const sefazResp = await SefazClient.enviarBPe({
      xmlAssinado,
      chave: buildResult.chave,
      uf,
      tpAmb,
      modoOperacao: this.config.modoOperacao,
    });

    let xmlProc: string | undefined = undefined;
    let statusFinal: 'AUTORIZADO' | 'REJEITADO' = 'REJEITADO';

    if (sefazResp.sucesso && sefazResp.nProt) {
      statusFinal = 'AUTORIZADO';
      // 6. Montar o XML de distribuição oficial (bpeProc)
      xmlProc = buildProcBPeXml({
        xmlAssinado,
        chave: buildResult.chave,
        tpAmb,
        nProt: sefazResp.nProt,
        dhRecbto: sefazResp.dhRecbto || formatarDataHoraSefaz(),
        digVal: sefazResp.digVal,
        cStat: sefazResp.cStat,
        xMotivo: sefazResp.xMotivo,
        verAplic: sefazResp.verAplic,
      });

      // Atualizar contador sequencial do microserviço
      if (nBPe >= this.config.proximoNumeroBPe) {
        this.config.proximoNumeroBPe = nBPe + 1;
      }
    }

    const dabpeUrl = `/api/bpe/dabpe/${buildResult.chave}`;

    // 7. Salvar no histórico
    const agoraStr = new Date().toISOString();
    const registro: BPeRegistro = {
      id: `bpe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      chave: buildResult.chave,
      nBPe,
      serie,
      cBP: buildResult.cBP,
      cDV: buildResult.cDV,
      dhEmi: buildResult.dhEmi,
      dhViagem: payload.dhViagem,
      status: statusFinal,
      tpAmb,
      cStat: sefazResp.cStat,
      xMotivo: sefazResp.xMotivo,
      nProt: sefazResp.nProt,
      dhRecbto: sefazResp.dhRecbto,
      digVal: sefazResp.digVal,
      qrCodeUrl: buildResult.qrCodeUrl,
      urlChave: buildResult.urlChave,
      payload,
      xmlAssinado,
      xmlProc,
      isSandbox: sefazResp.isSandbox,
      eventos: [],
      createdAt: agoraStr,
      updatedAt: agoraStr,
    };

    this.historico.set(buildResult.chave, registro);

    return {
      sucesso: sefazResp.sucesso,
      chave: buildResult.chave,
      nBPe,
      serie,
      status: statusFinal,
      cStat: sefazResp.cStat,
      xMotivo: sefazResp.xMotivo,
      nProt: sefazResp.nProt,
      dhRecbto: sefazResp.dhRecbto,
      qrCodeUrl: buildResult.qrCodeUrl,
      urlChave: buildResult.urlChave,
      xmlAssinado,
      xmlProc,
      dabpeUrl,
      isSandbox: sefazResp.isSandbox,
    };
  }

  /**
   * Cancela um BP-e autorizado na SEFAZ (tpEvento 110111)
   */
  public async cancelarBPe(chave: string, justificativa: string): Promise<{
    sucesso: boolean;
    cStat: number;
    xMotivo: string;
    nProt?: string;
    dhEvento?: string;
  }> {
    const cleanChave = cleanDocumento(chave);
    const registro = this.historico.get(cleanChave);

    if (!registro) {
      throw new Error(`BP-e com chave ${chave} não encontrado.`);
    }

    if (registro.status === 'CANCELADO') {
      throw new Error(`O BP-e ${chave} já está cancelado.`);
    }

    if (!justificativa || justificativa.trim().length < 15) {
      throw new Error('A justificativa de cancelamento deve conter no mínimo 15 caracteres (Regra SEFAZ).');
    }

    let certData = getActiveCertificate();
    if (!certData) {
      certData = gerarCertificadoTeste(this.config.emitentePadrao.xNome, this.config.emitentePadrao.cnpj);
    }

    const nSeqEvento = registro.eventos.filter((e) => e.tpEvento === '110111').length + 1;
    const cnpjEmitente = registro.payload.emitente?.cnpj || this.config.emitentePadrao.cnpj;
    const uf = cleanChave.substring(0, 2);

    // 1. Montar XML do Evento de Cancelamento
    const eventoBuild = buildEventoBPeXml({
      chave: cleanChave,
      tpAmb: registro.tpAmb,
      cnpjEmitente,
      tpEvento: '110111',
      nSeqEvento,
      nProt: registro.nProt,
      justificativa,
    });

    // 2. Assinar XML do Evento
    const xmlEventoAssinado = assinarXml(eventoBuild.xmlSemAssinatura, {
      tagParaAssinar: 'infEvento',
      idAtributo: 'Id',
      certData,
    });

    // 3. Enviar para SEFAZ
    const sefazResp = await SefazClient.enviarEvento({
      xmlEventoAssinado,
      chave: cleanChave,
      uf,
      tpAmb: registro.tpAmb,
      tpEvento: '110111',
      descEvento: 'Cancelamento',
      modoOperacao: this.config.modoOperacao,
    });

    if (sefazResp.sucesso) {
      registro.status = 'CANCELADO';
      registro.updatedAt = new Date().toISOString();

      const eventoReg: BPeEventoRegistro = {
        id: `ev-${Date.now()}`,
        tpEvento: '110111',
        descEvento: 'Cancelamento',
        nSeqEvento,
        dhEvento: eventoBuild.dhEvento,
        nProt: sefazResp.nProt,
        cStat: sefazResp.cStat,
        xMotivo: sefazResp.xMotivo,
        justificativa,
        xmlEvento: xmlEventoAssinado,
      };

      registro.eventos.push(eventoReg);
    }

    return {
      sucesso: sefazResp.sucesso,
      cStat: sefazResp.cStat,
      xMotivo: sefazResp.xMotivo,
      nProt: sefazResp.nProt,
      dhEvento: eventoBuild.dhEvento,
    };
  }

  /**
   * Registra Evento de Não Embarque do Passageiro (tpEvento 110115)
   */
  public async registrarNaoEmbarque(chave: string, justificativa: string): Promise<{
    sucesso: boolean;
    cStat: number;
    xMotivo: string;
    nProt?: string;
    dhEvento?: string;
  }> {
    const cleanChave = cleanDocumento(chave);
    const registro = this.historico.get(cleanChave);

    if (!registro) {
      throw new Error(`BP-e com chave ${chave} não encontrado.`);
    }

    if (!justificativa || justificativa.trim().length < 15) {
      throw new Error('A justificativa do Não Embarque deve conter no mínimo 15 caracteres (Regra SEFAZ).');
    }

    let certData = getActiveCertificate();
    if (!certData) {
      certData = gerarCertificadoTeste(this.config.emitentePadrao.xNome, this.config.emitentePadrao.cnpj);
    }

    const nSeqEvento = registro.eventos.filter((e) => e.tpEvento === '110115').length + 1;
    const cnpjEmitente = registro.payload.emitente?.cnpj || this.config.emitentePadrao.cnpj;
    const uf = cleanChave.substring(0, 2);

    const eventoBuild = buildEventoBPeXml({
      chave: cleanChave,
      tpAmb: registro.tpAmb,
      cnpjEmitente,
      tpEvento: '110115',
      nSeqEvento,
      nProt: registro.nProt,
      justificativa,
    });

    const xmlEventoAssinado = assinarXml(eventoBuild.xmlSemAssinatura, {
      tagParaAssinar: 'infEvento',
      idAtributo: 'Id',
      certData,
    });

    const sefazResp = await SefazClient.enviarEvento({
      xmlEventoAssinado,
      chave: cleanChave,
      uf,
      tpAmb: registro.tpAmb,
      tpEvento: '110115',
      descEvento: 'Nao Embarque',
      modoOperacao: this.config.modoOperacao,
    });

    if (sefazResp.sucesso) {
      registro.status = 'NAO_EMBARCADO';
      registro.updatedAt = new Date().toISOString();

      const eventoReg: BPeEventoRegistro = {
        id: `ev-${Date.now()}`,
        tpEvento: '110115',
        descEvento: 'Nao Embarque',
        nSeqEvento,
        dhEvento: eventoBuild.dhEvento,
        nProt: sefazResp.nProt,
        cStat: sefazResp.cStat,
        xMotivo: sefazResp.xMotivo,
        justificativa,
        xmlEvento: xmlEventoAssinado,
      };

      registro.eventos.push(eventoReg);
    }

    return {
      sucesso: sefazResp.sucesso,
      cStat: sefazResp.cStat,
      xMotivo: sefazResp.xMotivo,
      nProt: sefazResp.nProt,
      dhEvento: eventoBuild.dhEvento,
    };
  }

  /**
   * Consulta a situação atual do BP-e na SEFAZ e no histórico
   */
  public async consultarBPe(chave: string) {
    const cleanChave = cleanDocumento(chave);
    const registro = this.historico.get(cleanChave);

    const sefazResp = await SefazClient.consultarBPe({
      chave: cleanChave,
      tpAmb: registro ? registro.tpAmb : this.config.ambientePadrao,
      modoOperacao: this.config.modoOperacao,
    });

    return {
      chave: cleanChave,
      registroLocal: registro || null,
      sefaz: sefazResp,
    };
  }

  /**
   * Consulta o Status do WebService da SEFAZ
   */
  public async consultarStatusServico(uf?: string) {
    const targetUf = (uf || this.config.ufPadrao || 'PA').toUpperCase();
    return SefazClient.consultarStatusServico({
      uf: targetUf,
      tpAmb: this.config.ambientePadrao,
      modoOperacao: this.config.modoOperacao,
    });
  }

  /**
   * Retorna todo o histórico de bilhetes
   */
  public getHistorico(): BPeRegistro[] {
    return Array.from(this.historico.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Retorna um registro de BP-e específico pela chave
   */
  public getBPePorChave(chave: string): BPeRegistro | undefined {
    return this.historico.get(cleanDocumento(chave));
  }
}

export const bpeService = new BPeService();
