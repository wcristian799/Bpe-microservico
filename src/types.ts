export interface BPeEmitente {
  cnpj: string;
  ie: string;
  xNome: string;
  xFant?: string;
  tar?: string;
  enderEmit: {
    xLgr: string;
    nro: string;
    xCpl?: string;
    xBairro: string;
    cMun: string;
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
  tpDoc?: '01' | '02' | '03';
  nDoc?: string;
  dNasc?: string;
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
  tPag: '01' | '02' | '03' | '04' | '15' | '17' | '99';
  vPag: number;
  tpIntegra?: '1' | '2';
  cnpjCredora?: string;
  tBand?: string;
  cAut?: string;
}

export interface BPeImpostoICMS {
  cst: '00' | '20' | '45' | '90' | 'SN';
  vBC?: number;
  pICMS?: number;
  vICMS?: number;
  pRedBC?: number;
  vTotTrib?: number;
}

export interface BPeEmissaoPayload {
  cUF?: string;
  tpAmb?: 1 | 2;
  serie?: number;
  nBPe?: number;
  modal?: 1 | 2 | 3;
  dhEmi?: string;
  tpEmis?: 1 | 2;
  tpBPe?: 0 | 1 | 2;
  chBPeSubst?: string;
  ufIni: string;
  cMunIni: string;
  xMunIni: string;
  ufFim: string;
  cMunFim: string;
  xMunFim: string;
  tpTrecho: 0 | 1 | 2 | 3;
  dhViagem: string;
  tpViagem: 0 | 1 | 2 | 3;
  cLinha?: string;
  xLinha: string;
  prefixo?: string;
  poltrona: string;
  plataforma?: string;
  tpServico?: 'CONVENCIONAL' | 'EXECUTIVO' | 'SEMI-LEITO' | 'LEITO' | 'LEITO-CAMA';
  emitente?: BPeEmitente;
  comprador: BPeComprador;
  passageiro?: BPePassageiro;
  valores: BPeComponentesValor;
  icms?: BPeImpostoICMS;
  pagamentos: BPePagamento[];
  infAdFisco?: string;
  infCpl?: string;
}

export interface BPeEventoRegistro {
  id: string;
  tpEvento: '110111' | '110115' | '110114' | '110113';
  descEvento: string;
  nSeqEvento: number;
  dhEvento: string;
  nProt?: string;
  cStat: number;
  xMotivo: string;
  justificativa?: string;
  xmlEvento?: string;
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
  ambientePadrao: 1 | 2;
  ufPadrao: string;
  modoOperacao: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ';
  proximoNumeroBPe: number;
  seriePadrao: number;
  emitentePadrao: BPeEmitente;
}

export interface SefazStatusServicoResult {
  sucesso: boolean;
  cStat: number;
  xMotivo: string;
  dhRecbto: string;
  tMed: number;
  uf: string;
  tpAmb: 1 | 2;
  verAplic: string;
  isSandbox: boolean;
  tempoRespostaMs: number;
  endpointUrl?: string;
  rawXmlRetorno?: string;
}
