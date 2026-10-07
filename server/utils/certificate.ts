import forge from 'node-forge';
import crypto from 'crypto';
import { cleanDocumento } from './ibge';
import { CertificadoConfig } from '../types/bpe';

export interface ParsedCertificateData {
  certPem: string;
  privateKeyPem: string;
  x509Base64: string; // DER sem headers para inclusão no XML (<X509Certificate>)
  commonName: string;
  razaoSocial: string;
  cnpj?: string;
  validoDe: Date;
  validoAte: Date;
  diasRestantes: number;
  emissor: string;
  serialNumber: string;
  isExpirado: boolean;
  isDemo?: boolean;
}

let activeCertificateData: ParsedCertificateData | null = null;

/**
 * Faz o parse e validação de um certificado digital A1 (.pfx / .p12).
 */
export function parsePfxCertificate(pfxBuffer: Buffer, password = ''): ParsedCertificateData {
  try {
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    // Buscar certificados
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    let certObj: forge.pki.Certificate | null = null;
    let keyObj: forge.pki.PrivateKey | null = null;

    // Buscar o certificado correspondente
    if (certBags[forge.pki.oids.certBag] && certBags[forge.pki.oids.certBag]!.length > 0) {
      // Prioriza o certificado final (que não é CA se houver vários)
      for (const bag of certBags[forge.pki.oids.certBag]!) {
        if (bag.cert) {
          certObj = bag.cert;
          break;
        }
      }
    }

    // Buscar chave privada
    if (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] && keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]!.length > 0) {
      keyObj = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key || null;
    } else {
      // Tenta outros tipos de chave
      const rawKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag });
      if (rawKeyBags[forge.pki.oids.keyBag] && rawKeyBags[forge.pki.oids.keyBag]!.length > 0) {
        keyObj = rawKeyBags[forge.pki.oids.keyBag]![0].key || null;
      }
    }

    if (!certObj) {
      throw new Error('Certificado X.509 não encontrado dentro do arquivo PFX/P12.');
    }

    const certPem = forge.pki.certificateToPem(certObj);
    const privateKeyPem = keyObj ? forge.pki.privateKeyToPem(keyObj) : '';

    // Converter para base64 limpo (sem cabeçalhos e quebras)
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certObj)).getBytes();
    const x509Base64 = Buffer.from(certDer, 'binary').toString('base64');

    // Extrair CN e CNPJ
    let commonName = '';
    let razaoSocial = '';
    let cnpj: string | undefined = undefined;

    for (const attr of certObj.subject.attributes) {
      if (attr.shortName === 'CN' || attr.name === 'commonName') {
        commonName = String(attr.value);
      }
    }

    razaoSocial = commonName;

    // No padrão ICP-Brasil, o CNPJ costuma vir no Common Name após ':' ou em OID de outras extensões
    // Ex: "EMPRESA DE TRANSPORTES LTDA:12345678000199"
    if (commonName.includes(':')) {
      const parts = commonName.split(':');
      const possibleCnpj = cleanDocumento(parts[parts.length - 1]);
      if (possibleCnpj.length === 14 || possibleCnpj.length === 11) {
        cnpj = possibleCnpj;
        razaoSocial = parts[0].trim();
      }
    }

    // Emissor
    let emissor = '';
    for (const attr of certObj.issuer.attributes) {
      if (attr.shortName === 'CN' || attr.name === 'commonName') {
        emissor = String(attr.value);
      }
    }

    const validoDe = certObj.validity.notBefore;
    const validoAte = certObj.validity.notAfter;
    const agora = new Date();
    const diasRestantes = Math.ceil((validoAte.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
    const isExpirado = diasRestantes <= 0;

    const data: ParsedCertificateData = {
      certPem,
      privateKeyPem,
      x509Base64,
      commonName,
      razaoSocial: razaoSocial || commonName || 'EMITENTE BP-E',
      cnpj,
      validoDe,
      validoAte,
      diasRestantes,
      emissor: emissor || 'Autoridade Certificadora ICP-Brasil',
      serialNumber: certObj.serialNumber,
      isExpirado,
      isDemo: false,
    };

    activeCertificateData = data;
    return data;
  } catch (error: any) {
    if (error.message?.includes('Password') || error.message?.includes('PKCS#12 MAC could not be verified') || error.message?.includes('Invalid password')) {
      throw new Error('Senha do certificado digital A1 incorreta ou arquivo PFX corrompido.');
    }
    throw new Error(`Falha ao ler certificado digital A1: ${error.message}`);
  }
}

/**
 * Retorna o certificado atualmente carregado em memória.
 */
export function getActiveCertificate(): ParsedCertificateData | null {
  return activeCertificateData;
}

/**
 * Remove o certificado em memória.
 */
export function clearActiveCertificate(): void {
  activeCertificateData = null;
}

/**
 * Retorna as informações públicas do certificado para status/configuração.
 */
export function getCertificadoConfig(modoOperacao: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ'): CertificadoConfig {
  if (!activeCertificateData) {
    return {
      hasCertificado: false,
      status: 'NAO_CONFIGURADO',
      modoOperacao,
    };
  }

  return {
    hasCertificado: true,
    isDemo: !!activeCertificateData.isDemo,
    cnpj: activeCertificateData.cnpj,
    razaoSocial: activeCertificateData.razaoSocial,
    emissor: activeCertificateData.emissor,
    validoDe: activeCertificateData.validoDe.toISOString(),
    validoAte: activeCertificateData.validoAte.toISOString(),
    diasRestantes: activeCertificateData.diasRestantes,
    status: activeCertificateData.isExpirado ? 'EXPIRADO' : 'VALIDO',
    modoOperacao,
  };
}

/**
 * Gera um certificado A1 auto-assinado para fins de teste de desenvolvimento / sandbox
 */
export function gerarCertificadoTeste(razaoSocial = 'EXPRESSO AMAZONIA TRANSPORTES E TURISMO LTDA', cnpj = '04891234000185'): ParsedCertificateData {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01' + Date.now().toString(16);
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: `${razaoSocial}:${cnpj}` },
    { name: 'countryName', value: 'BR' },
    { shortName: 'ST', value: 'PA' },
    { name: 'localityName', value: 'Belem' },
    { name: 'organizationName', value: 'ICP-Brasil Sandbox PA' },
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const certPem = forge.pki.certificateToPem(cert);
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const x509Base64 = Buffer.from(certDer, 'binary').toString('base64');

  const data: ParsedCertificateData = {
    certPem,
    privateKeyPem,
    x509Base64,
    commonName: `${razaoSocial}:${cnpj}`,
    razaoSocial,
    cnpj,
    validoDe: cert.validity.notBefore,
    validoAte: cert.validity.notAfter,
    diasRestantes: 365,
    emissor: 'AC ICP-Brasil (Ambiente de Testes / Sandbox)',
    serialNumber: cert.serialNumber,
    isExpirado: false,
    isDemo: true,
  };

  activeCertificateData = data;
  return data;
}
