import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, Globe, FileCode, CheckCircle, ArrowRight } from 'lucide-react';

export const ApiIntegrationDocs: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'php' | 'csharp' | 'java'>('curl');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const samplePayloadJson = `{
  "cUF": "15",
  "ufIni": "PA",
  "cMunIni": "1501402",
  "xMunIni": "Belem",
  "ufFim": "PA",
  "cMunFim": "1504208",
  "xMunFim": "Maraba",
  "tpTrecho": 1,
  "dhViagem": "2026-09-01T14:30:00-03:00",
  "tpViagem": 0,
  "cLinha": "BEL-MAB-01",
  "xLinha": "BELEM (RODOVIARIA DE SAO BRAS) X MARABA (FOLHA 32)",
  "prefixo": "EXP-1501",
  "poltrona": "14",
  "plataforma": "08",
  "tpServico": "EXECUTIVO",
  "comprador": {
    "xNome": "RAIMUNDO NONATO PINHEIRO",
    "cpfOuCnpj": "84920147234",
    "email": "raimundo.pinheiro@email.com",
    "fone": "91981234567"
  },
  "valores": {
    "vTarifa": 145.00,
    "vTaxaEmbarque": 9.50,
    "vPedagio": 0.00,
    "vSeguro": 4.50,
    "vOutros": 0.00
  },
  "pagamentos": [
    {
      "tPag": "17",
      "vPag": 159.00,
      "tpIntegra": "1"
    }
  ],
  "infCpl": "Viagem intermunicipal PA (Regulamentacao ARCON-PA)."
}`;

  const codeSnippets: Record<string, string> = {
    curl: `curl -X POST "http://localhost:3000/api/bpe/emitir" \\
  -H "Content-Type: application/json" \\
  -d '${samplePayloadJson.replace(/\n/g, '').replace(/\s+/g, ' ')}'`,

    node: `// Exemplo em Node.js (fetch ou axios)
const emitirBPe = async () => {
  const payload = ${samplePayloadJson};

  const response = await fetch("http://localhost:3000/api/bpe/emitir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log("Status:", data.sucesso);
  console.log("Chave de Acesso:", data.dados.chave);
  console.log("Protocolo SEFAZ:", data.dados.nProt);
  console.log("Link do DABPE:", "http://localhost:3000" + data.dados.dabpeUrl);
};

emitirBPe();`,

    python: `# Exemplo em Python (requests)
import requests

url = "http://localhost:3000/api/bpe/emitir"
payload = ${samplePayloadJson.replace(/true/g, 'True').replace(/false/g, 'False')}

response = requests.post(url, json=payload)
data = response.json()

if data.get("sucesso"):
    print(f"BP-e Autorizado! Chave: {data['dados']['chave']}")
    print(f"Protocolo SEFAZ: {data['dados']['nProt']}")
else:
    print(f"Erro: {data.get('erro')}")`,

    php: `<?php
// Exemplo em PHP com cURL
$url = 'http://localhost:3000/api/bpe/emitir';
$payload = '${samplePayloadJson}';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if ($data['sucesso']) {
    echo "Chave: " . $data['dados']['chave'] . "\\n";
    echo "Protocolo: " . $data['dados']['nProt'] . "\\n";
}`,

    csharp: `// Exemplo em C# (.NET HttpClient)
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        var json = @"${samplePayloadJson.replace(/"/g, '""')}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("http://localhost:3000/api/bpe/emitir", content);
        var responseString = await response.Content.ReadAsStringAsync();

        Console.WriteLine(responseString);
    }
}`,

    java: `// Exemplo em Java (HttpURLConnection)
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;

public class EmissorBPe {
    public static void main(String[] args) throws Exception {
        URL url = new URL("http://localhost:3000/api/bpe/emitir");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        String jsonInput = "${samplePayloadJson.replace(/"/g, '\\"').replace(/\n/g, ' ')}";

        try(OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonInput.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        Scanner scanner = new Scanner(conn.getInputStream(), "UTF-8");
        String response = scanner.useDelimiter("\\\\A").next();
        scanner.close();

        System.out.println(response);
    }
}`,
  };

  return (
    <div id="api-integration-docs-container" className="space-y-6">
      {/* Guia Introdutório */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Como Integrar seu Sistema ao Microserviço BP-e
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              O microserviço cuida de toda a complexidade fiscal: geração da chave de 44 dígitos, montagem do XML MOC v1.00, assinatura digital A1, comunicação SOAP com a SEFAZ, QR Code e geração de DABPE.
            </p>
          </div>
        </div>

        {/* Diagrama de Fluxo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-blue-700 block text-sm">1. Seu Sistema</span>
            <p className="text-[11px] text-slate-500 mt-1">Envia JSON simplificado com rota, passageiro e valor</p>
          </div>
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100">
            <span className="font-bold text-blue-900 block text-sm">2. Microserviço</span>
            <p className="text-[11px] text-blue-700 mt-1">Gera XML v1.00 e assina com Certificado A1</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="font-bold text-emerald-800 block text-sm">3. SEFAZ WebService</span>
            <p className="text-[11px] text-emerald-700 mt-1">Valida e autoriza o BP-e (cStat 100 + Protocolo)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block text-sm">4. Retorno Instantâneo</span>
            <p className="text-[11px] text-slate-500 mt-1">Devolve Chave 44 dígitos, XML e link de impressão do DABPE</p>
          </div>
        </div>
      </div>

      {/* Endpoints da API */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-600" />
          Endpoints REST do Microserviço
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">POST</span>
              <span className="font-semibold text-slate-900">/api/bpe/emitir</span>
            </div>
            <span className="text-slate-600">Emite, assina digitalmente e transmite o BP-e à SEFAZ</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">POST</span>
              <span className="font-semibold text-slate-900">/api/bpe/cancelar</span>
            </div>
            <span className="text-slate-600">Cancela um BP-e autorizado na SEFAZ (tpEvento 110111)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">POST</span>
              <span className="font-semibold text-slate-900">/api/bpe/nao-embarque</span>
            </div>
            <span className="text-slate-600">Registra evento de Não Embarque do passageiro (tpEvento 110115)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">GET</span>
              <span className="font-semibold text-slate-900">/api/bpe/consultar/:chave</span>
            </div>
            <span className="text-slate-600">Consulta situação em tempo real do BP-e na SEFAZ</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">GET</span>
              <span className="font-semibold text-slate-900">/api/bpe/status-servico?uf=PA</span>
            </div>
            <span className="text-slate-600">Verifica se os WebServices da SEFAZ estão operacionais (cStat 107)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">GET</span>
              <span className="font-semibold text-slate-900">/api/bpe/xml/:chave</span>
            </div>
            <span className="text-slate-600">Download direto do arquivo XML autorizado (-procBPe.xml)</span>
          </div>
        </div>
      </div>

      {/* Exemplos de Código por Linguagem */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            Exemplos de Código Prontos para Uso
          </h3>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['curl', 'node', 'python', 'php', 'csharp', 'java'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  activeLang === lang ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'csharp' ? 'C# (.NET)' : lang === 'node' ? 'Node.js' : lang}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => handleCopy(codeSnippets[activeLang], activeLang)}
            className="absolute right-3 top-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copied === activeLang ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === activeLang ? 'Copiado!' : 'Copiar Código'}
          </button>
          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed pt-10">
            {codeSnippets[activeLang]}
          </pre>
        </div>
      </div>
    </div>
  );
};
