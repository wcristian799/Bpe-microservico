export interface BPeEmitente {
  cnpj: string;
  ie: string;
  xNome: string;
  xFant?: string;
  tar?: string; // Termo de Autorização de Serviço Regular
  enderEmit: {
    xLgr: string;
    nro: string;
    xCpl?: string;
    xBairro: string;
    cMun: string; // Código IBGE do município (ex: 3550308)
    xMun: string;
    cep: string;
    uf: string;
    fone?: string;
  };
}

export interface BPeComprador {
  cpfOuCnpj: string;
  xNome: string;
  ie?: string;
  email?: string;
  fone?: string;
  enderComp?: {
    xLgr: string;
    nro: string;
    xCpl?: string;
    xBairro: string;
    cMun: string;
    xMun: string;
    cep: string;
    uf: string;
  };
}

export interface BPePassageiro {
  xNome: string;
  cpfOuDoc: string;
  tpDoc?: '01' | '02' | '03'; // 01=RG, 02=Passaporte, 03=Outros
  nDoc?: string;
  dNasc?: string; // YYYY-MM-DD
  fone?: string;
  email?: string;
}

export interface BPeComponentesValor {
  vTarifa: number;
  vPedagio?: number;
  vTaxaEmbarque?: number;
  vSeguro?: number;
  vOutros?: number;
}

export interface BPePagamento {
  tPag: '01' | '02' | '03' | '04' | '15' | '17' | '99'; // 01-Dinheiro, 02-Cheque, 03-Cartão Crédito, 04-Cartão Débito, 15-Boleto, 17-PIX, 99-Outros
  vPag: number;
  tpIntegra?: '1' | '2'; // 1-Integrado, 2-Não integrado
  cnpjCredora?: string;
  tBand?: string;
  cAut?: string;
}

export interface BPeImpostoICMS {
  cst: '00' | '20' | '45' | '90' | 'SN'; // 00=Integral, 20=Redução, 45=Isenção, 90=Outros, SN=Simples Nacional
  vBC?: number;
  pICMS?: number;
  vICMS?: number;
  pRedBC?: number;
  vTotTrib?: number; // Tributos aproximados Lei 12.741/2012
}

export interface BPeEmissaoPayload {
  // Identificação
  cUF?: string; // Se não fornecido, deduz do emitente
  tpAmb?: 1 | 2; // 1-Produção, 2-Homologação (padrão configurado no microserviço)
  serie?: number; // Padrão 1
  nBPe?: number; // Número sequencial do BP-e. Se omitido, o microserviço auto-incrementa
  modal?: 1 | 2 | 3; // 1-Rodoviário, 2-Ferroviário, 3-Aquaviário (default 1)
  dhEmi?: string; // ISO 8601 ou agora
  tpEmis?: 1 | 2; // 1-Normal, 2-Contingência FS-DA
  tpBPe?: 0 | 1 | 2; // 0-Normal, 1-Substituição, 2-Excesso de Bagagem
  chBPeSubst?: string; // Se tpBPe == 1

  // Trecho e Viagem
  ufIni: string;
  cMunIni: string;
  xMunIni: string;
  ufFim: string;
  cMunFim: string;
  xMunFim: string;
  tpTrecho: 0 | 1 | 2 | 3; // 0-Urbano, 1-Intermunicipal, 2-Interestadual, 3-Internacional
  dhViagem: string; // Data e hora da viagem (ISO 8601 ou YYYY-MM-DDTHH:mm:ss)
  tpViagem: 0 | 1 | 2 | 3; // 0-Regular, 1-Fretamento, 2-Extra, 3-Substituição

  // Passagem
  cLinha?: string;
  xLinha: string;
  prefixo?: string;
  poltrona: string;
  plataforma?: string;
  tpServico?: 'CONVENCIONAL' | 'EXECUTIVO' | 'SEMI-LEITO' | 'LEITO' | 'LEITO-CAMA';

  // Partes
  emitente?: BPeEmitente; // Se não enviado, usa o emitente padrão configurado no microserviço
  comprador: BPeComprador;
  passageiro?: BPePassageiro; // Se omitido, passageiro = comprador

  // Valores & Tributos
  valores: BPeComponentesValor;
  icms?: BPeImpostoICMS;
  pagamentos: BPePagamento[];

  // Informações adicionais
  infAdFisco?: string;
  infCpl?: string;
}

export interface BPeRegistro {
  id: string;
  chave: string;
  nBPe: number;
  serie: number;
  cBP: string;
  cDV: string;
  dhEmi: string;
  dhViagem: string;
  status: 'AUTORIZADO' | 'CANCELADO' | 'REJEITADO' | 'NAO_EMBARCADO' | 'PENDENTE';
  tpAmb: 1 | 2;
  cStat: number;
  xMotivo: string;
  nProt?: string;
  dhRecbto?: string;
  digVal?: string;
  qrCodeUrl: string;
  urlChave: string;
  payload: BPeEmissaoPayload;
  xmlAssinado: string;
  xmlProc?: string;
  isSandbox?: boolean;
  eventos: BPeEventoRegistro[];
  createdAt: string;
  updatedAt: string;
}

export interface BPeEventoRegistro {
  id: string;
  tpEvento: '110111' | '110115' | '110114' | '110113'; // 110111=Cancelamento, 110115=Não Embarque
  descEvento: string;
  nSeqEvento: number;
  dhEvento: string;
  nProt?: string;
  cStat: number;
  xMotivo: string;
  justificativa?: string;
  xmlEvento?: string;
  xmlProcEvento?: string;
}

export interface CertificadoConfig {
  hasCertificado: boolean;
  isDemo?: boolean;
  cnpj?: string;
  razaoSocial?: string;
  emissor?: string;
  validoDe?: string;
  validoAte?: string;
  diasRestantes?: number;
  status: 'VALIDO' | 'EXPIRADO' | 'NAO_CONFIGURADO';
  modoOperacao: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ';
}

export interface MicroservicoConfig {
  ambientePadrao: 1 | 2; // 1-Produção, 2-Homologação
  ufPadrao: string;
  modoOperacao: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ';
  proximoNumeroBPe: number;
  seriePadrao: number;
  emitentePadrao: BPeEmitente;
}
