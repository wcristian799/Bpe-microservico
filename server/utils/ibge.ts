export const UF_IBGE_MAP: Record<string, string> = {
  RO: '11',
  AC: '12',
  AM: '13',
  RR: '14',
  PA: '15',
  AP: '16',
  TO: '17',
  MA: '21',
  PI: '22',
  CE: '23',
  RN: '24',
  PB: '25',
  PE: '26',
  AL: '27',
  SE: '28',
  BA: '29',
  MG: '31',
  ES: '32',
  RJ: '33',
  SP: '35',
  PR: '41',
  SC: '42',
  RS: '43',
  MS: '50',
  MT: '51',
  GO: '52',
  DF: '53',
};

export const IBGE_UF_MAP: Record<string, string> = Object.entries(UF_IBGE_MAP).reduce(
  (acc, [uf, cod]) => {
    acc[cod] = uf;
    return acc;
  },
  {} as Record<string, string>
);

export function getCodigoIBGEPorUF(uf: string): string {
  const clean = (uf || '').trim().toUpperCase();
  // Se já for código IBGE de 2 dígitos numéricos (ex: "15" para PA)
  if (/^\d{2}$/.test(clean)) {
    return clean;
  }
  return UF_IBGE_MAP[clean] || '15'; // Default Estado do Pará (15)
}

export function getUFPorCodigoIBGE(cod: string): string {
  const clean = (cod || '').trim();
  if (IBGE_UF_MAP[clean]) {
    return IBGE_UF_MAP[clean];
  }
  if (UF_IBGE_MAP[clean.toUpperCase()]) {
    return clean.toUpperCase();
  }
  return 'PA';
}

export function cleanDocumento(doc: string): string {
  return (doc || '').replace(/\D/g, '');
}

export function formatarCNPJ(cnpj: string): string {
  const c = cleanDocumento(cnpj).padStart(14, '0');
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

export function formatarCPF(cpf: string): string {
  const c = cleanDocumento(cpf).padStart(11, '0');
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9, 11)}`;
}

export function formatarChave(chave: string): string {
  const clean = cleanDocumento(chave);
  if (clean.length !== 44) return chave;
  return clean.replace(/(\d{4})/g, '$1 ').trim();
}
