import { cleanDocumento, getCodigoIBGEPorUF } from './ibge';

export interface GerarChaveParams {
  uf: string;
  dataEmissao: Date | string;
  cnpjEmitente: string;
  modelo?: string; // padrão 63
  serie: number;
  nBPe: number;
  tpEmis?: number; // 1-Normal
  cBP?: string; // Código numérico de 8 dígitos (se omitido, gera aleatório)
}

/**
 * Calcula o Dígito Verificador da Chave de Acesso através do Módulo 11 (pesos de 2 a 9).
 */
export function calcularDVModulo11(chave43: string): string {
  if (chave43.length !== 43) {
    throw new Error(`A chave base para cálculo do DV deve ter exatamente 43 dígitos. Recebido: ${chave43.length}`);
  }

  let soma = 0;
  let peso = 2;

  for (let i = chave43.length - 1; i >= 0; i--) {
    const digito = parseInt(chave43.charAt(i), 10);
    soma += digito * peso;
    peso++;
    if (peso > 9) {
      peso = 2;
    }
  }

  const resto = soma % 11;
  if (resto === 0 || resto === 1) {
    return '0';
  }
  return String(11 - resto);
}

/**
 * Gera a Chave de Acesso do BP-e (44 dígitos).
 * Estrutura:
 * - cUF: 2 dígitos
 * - AAMM: 4 dígitos
 * - CNPJ: 14 dígitos
 * - mod: 2 dígitos ("63")
 * - serie: 3 dígitos
 * - nBPe: 9 dígitos
 * - tpEmis: 1 dígito
 * - cBP: 8 dígitos
 * - cDV: 1 dígito
 */
export function gerarChaveBPe(params: GerarChaveParams): {
  chave: string;
  chave43: string;
  cDV: string;
  cBP: string;
  cUF: string;
  aamm: string;
  cnpj: string;
  mod: string;
  serieStr: string;
  nBPeStr: string;
  tpEmisStr: string;
} {
  const cUF = getCodigoIBGEPorUF(params.uf).padStart(2, '0');

  const dt = typeof params.dataEmissao === 'string' ? new Date(params.dataEmissao) : params.dataEmissao;
  const ano = String(dt.getFullYear()).slice(-2);
  const mes = String(dt.getMonth() + 1).padStart(2, '0');
  const aamm = `${ano}${mes}`;

  const cnpj = cleanDocumento(params.cnpjEmitente).padStart(14, '0');
  const mod = params.modelo || '63';
  const serieStr = String(params.serie).padStart(3, '0');
  const nBPeStr = String(params.nBPe).padStart(9, '0');
  const tpEmisStr = String(params.tpEmis || 1);

  // Código numérico aleatório de 8 dígitos se não informado
  const cBP = params.cBP ? params.cBP.padStart(8, '0') : String(Math.floor(10000000 + Math.random() * 90000000));

  const chave43 = `${cUF}${aamm}${cnpj}${mod}${serieStr}${nBPeStr}${tpEmisStr}${cBP}`;
  const cDV = calcularDVModulo11(chave43);
  const chave = `${chave43}${cDV}`;

  return {
    chave,
    chave43,
    cDV,
    cBP,
    cUF,
    aamm,
    cnpj,
    mod,
    serieStr,
    nBPeStr,
    tpEmisStr,
  };
}

export function validarChaveBPe(chave: string): boolean {
  const clean = cleanDocumento(chave);
  if (clean.length !== 44) return false;
  const base43 = clean.substring(0, 43);
  const dvInformado = clean.substring(43);
  const dvCalculado = calcularDVModulo11(base43);
  return dvInformado === dvCalculado;
}
