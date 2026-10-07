import crypto from 'crypto';
import { ParsedCertificateData } from './certificate';

/**
 * Canonização C14N simplificada e rigorosa para nós do XML da SEFAZ
 * Remove comentários, normaliza quebras de linha e preserva atributos e namespaces ordenados.
 */
export function canonicalizeXml(xmlSnippet: string): string {
  let cleaned = xmlSnippet.trim();
  // Remove declaração XML se houver
  cleaned = cleaned.replace(/<\?xml[^>]*\?>/gi, '');
  // Normaliza quebras de linha para \n
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Remove espaços redundantes entre tags
  cleaned = cleaned.replace(/>\s+</g, '><');
  return cleaned;
}

export interface AssinarXmlOptions {
  tagParaAssinar: string; // Ex: 'infBPe' ou 'infEvento' ou 'infInut'
  idAtributo: string; // Ex: 'Id'
  certData: ParsedCertificateData;
  algorithm?: 'sha1' | 'sha256';
}

/**
 * Assina digitalmente um XML no padrão SEFAZ / ICP-Brasil (XML-DSig enveloped).
 */
export function assinarXml(xmlCompleto: string, options: AssinarXmlOptions): string {
  const { tagParaAssinar, idAtributo, certData, algorithm = 'sha1' } = options;

  if (!certData.privateKeyPem || !certData.x509Base64) {
    throw new Error('Chave privada ou certificado X.509 não disponíveis para assinatura.');
  }

  // Localizar o nó a ser assinado (ex: <infBPe Id="BPe...">...</infBPe>)
  const regexTag = new RegExp(`<${tagParaAssinar}[^>]*${idAtributo}=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/${tagParaAssinar}>`, 'i');
  const match = xmlCompleto.match(regexTag);

  if (!match) {
    throw new Error(`Tag de assinatura <${tagParaAssinar}> com atributo ${idAtributo} não encontrada no XML.`);
  }

  const elementoCompleto = match[0];
  const uriId = match[1];

  // 1. Canonização do elemento a ser assinado
  const elementoCanonico = canonicalizeXml(elementoCompleto);

  // 2. Cálculo do DigestValue
  const digestAlgo = algorithm === 'sha256' ? 'sha256' : 'sha1';
  const digestUrl = algorithm === 'sha256'
    ? 'http://www.w3.org/2001/04/xmlenc#sha256'
    : 'http://www.w3.org/2000/09/xmldsig#sha1';
  const sigMethodUrl = algorithm === 'sha256'
    ? 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256'
    : 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';

  const hash = crypto.createHash(digestAlgo);
  hash.update(elementoCanonico, 'utf8');
  const digestValue = hash.digest('base64');

  // 3. Construção do SignedInfo
  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="${sigMethodUrl}"></SignatureMethod><Reference URI="#${uriId}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform></Transforms><DigestMethod Algorithm="${digestUrl}"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

  const signedInfoCanonico = canonicalizeXml(signedInfo);

  // 4. Assinatura do SignedInfo com a Chave Privada RSA
  const signer = crypto.createSign(algorithm === 'sha256' ? 'RSA-SHA256' : 'RSA-SHA1');
  signer.update(signedInfoCanonico, 'utf8');
  const signatureValue = signer.sign(certData.privateKeyPem, 'base64');

  // 5. Montagem da tag <Signature>
  const signatureXml = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="${sigMethodUrl}"/><Reference URI="#${uriId}"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="${digestUrl}"/><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo><SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certData.x509Base64}</X509Certificate></X509Data></KeyInfo></Signature>`;

  // 6. Inserir a assinatura antes do fechamento da tag pai
  // Para <BPe>: insere antes de </BPe>
  // Para <eventoBPe>: insere antes de </eventoBPe>
  // Para <inutBPe>: insere antes de </inutBPe>
  if (xmlCompleto.includes('</BPe>')) {
    return xmlCompleto.replace('</BPe>', `${signatureXml}</BPe>`);
  } else if (xmlCompleto.includes('</eventoBPe>')) {
    return xmlCompleto.replace('</eventoBPe>', `${signatureXml}</eventoBPe>`);
  } else if (xmlCompleto.includes('</inutBPe>')) {
    return xmlCompleto.replace('</inutBPe>', `${signatureXml}</inutBPe>`);
  }

  return xmlCompleto + signatureXml;
}
