import React, { useState } from 'react';
import { CertificadoConfig } from '../types';
import {
  ShieldCheck,
  UploadCloud,
  Key,
  Calendar,
  Building,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Server,
  Sparkles,
  Trash2,
  Info,
} from 'lucide-react';

interface CertificadoManagerProps {
  certificado: CertificadoConfig | null;
  onUpdate: () => void;
}

export const CertificadoManager: React.FC<CertificadoManagerProps> = ({ certificado, onUpdate }) => {
  const [file, setFile] = useState<File | null>(null);
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [msgErro, setMsgErro] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMsgErro(null);
    }
  };

  const handleUploadCertificado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMsgErro('Por favor selecione o arquivo .pfx ou .p12 do seu Certificado Digital A1.');
      return;
    }

    setLoading(true);
    setMsgErro(null);
    setMsgSucesso(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const resp = await fetch('/api/config/certificado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pfxBase64: base64String,
              senha,
            }),
          });

          const data = await resp.json();
          if (!resp.ok || !data.sucesso) {
            throw new Error(data.erro || 'Falha ao carregar certificado A1.');
          }

          setMsgSucesso('Certificado Digital A1 carregado e ativado com sucesso no microserviço!');
          setFile(null);
          setSenha('');
          onUpdate();
        } catch (err: any) {
          setMsgErro(err.message || 'Erro ao processar arquivo PFX.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setMsgErro(err.message || 'Erro na leitura do arquivo.');
      setLoading(false);
    }
  };

  const handleGerarDemo = async () => {
    setLoading(true);
    setMsgErro(null);
    setMsgSucesso(null);

    try {
      const resp = await fetch('/api/config/certificado-demo', { method: 'POST' });
      const data = await resp.json();
      if (!resp.ok || !data.sucesso) {
        throw new Error(data.erro || 'Erro ao gerar certificado de teste.');
      }
      setMsgSucesso('Certificado de Sandbox / Testes gerado e ativado com sucesso!');
      onUpdate();
    } catch (err: any) {
      setMsgErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLimparCertificado = async () => {
    setLoading(true);
    setMsgErro(null);
    setMsgSucesso(null);

    try {
      const resp = await fetch('/api/config/certificado-limpar', { method: 'POST' });
      const data = await resp.json();
      if (!resp.ok || !data.sucesso) {
        throw new Error(data.erro || 'Erro ao remover certificado.');
      }
      setMsgSucesso('Certificado desativado com sucesso. Nenhum certificado carregado no microserviço.');
      onUpdate();
    } catch (err: any) {
      setMsgErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModo = async (novoModo: 'SEFAZ_REAL' | 'SANDBOX_SEFAZ') => {
    setLoading(true);
    setMsgErro(null);
    try {
      const resp = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modoOperacao: novoModo }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro || 'Falha ao alterar modo.');
      onUpdate();
    } catch (err: any) {
      setMsgErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="certificado-manager-container" className="space-y-6">
      {/* Alertas */}
      {msgSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msgSucesso}</span>
        </div>
      )}

      {msgErro && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{msgErro}</span>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card do Certificado Ativo */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Certificado Digital A1
            </h3>
            {certificado?.hasCertificado ? (
              certificado.isDemo ? (
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  SANDBOX / TESTES
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ICP-BRASIL REAL
                </span>
              )
            ) : (
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                NÃO CONFIGURADO
              </span>
            )}
          </div>

          {certificado?.hasCertificado ? (
            <div className="space-y-3 text-xs">
              {certificado.isDemo && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Certificado Autoassinado Demonstrativo</span>
                  </div>
                  <p className="text-amber-700 leading-relaxed">
                    Este certificado fictício foi criado apenas para testar algoritmos de assinatura digital (XML-DSig) em memória. <strong>Ele NÃO é aceito pelos servidores da SEFAZ</strong>, pois não possui raiz ICP-Brasil.
                  </p>
                  <button
                    type="button"
                    onClick={handleLimparCertificado}
                    disabled={loading}
                    className="mt-1 text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 text-[11px] hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover certificado demonstrativo
                  </button>
                </div>
              )}

              {!certificado.isDemo && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1 font-semibold text-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Certificado ICP-Brasil Carregado
                  </span>
                  <button
                    type="button"
                    onClick={handleLimparCertificado}
                    disabled={loading}
                    className="text-rose-600 hover:text-rose-700 text-[10px] font-medium underline"
                  >
                    Desativar
                  </button>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">RAZÃO SOCIAL / TITULAR</span>
                  <p className="font-bold text-slate-900 text-xs">{certificado.razaoSocial || 'EMITENTE BP-E'}</p>
                </div>

                {certificado.cnpj && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">CNPJ / CPF</span>
                    <p className="font-semibold text-blue-900 font-mono text-xs">{certificado.cnpj}</p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">AUTORIDADE CERTIFICADORA (AC)</span>
                  <p className="text-slate-700 text-[11px]">{certificado.emissor}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">VÁLIDO ATÉ</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {certificado.validoAte ? new Date(certificado.validoAte).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-600 block font-semibold uppercase">DIAS RESTANTES</span>
                  <span className="font-bold text-blue-900 text-xs">
                    {certificado.diasRestantes !== undefined ? `${certificado.diasRestantes} dias` : '-'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Key className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Nenhum Certificado Configurado</p>
              <p className="text-[11px] text-slate-500">
                Faça o upload do seu certificado real (.pfx) ao lado ou use o botão de gerar testes para experimentar o Sandbox.
              </p>
            </div>
          )}

          {/* Seletor de Modo de Operação */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <label className="text-xs font-semibold text-slate-700 block">Modo de Operação do Microserviço:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-modo-sandbox"
                type="button"
                onClick={() => handleToggleModo('SANDBOX_SEFAZ')}
                className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                  certificado?.modoOperacao === 'SANDBOX_SEFAZ'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Sandbox (Simulação)
              </button>
              <button
                id="btn-modo-sefaz-real"
                type="button"
                onClick={() => handleToggleModo('SEFAZ_REAL')}
                className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                  certificado?.modoOperacao === 'SEFAZ_REAL'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                SEFAZ Real (mTLS)
              </button>
            </div>
            
            <div className="p-2.5 rounded-lg text-[11px] leading-relaxed bg-slate-50 border border-slate-200 text-slate-600">
              {certificado?.modoOperacao === 'SANDBOX_SEFAZ' ? (
                <span>
                  <strong className="text-blue-700">Modo Sandbox:</strong> O XML é validado e assinado localmente para testes do seu sistema. <strong>Não é transmitido à SEFAZ</strong> e a chave <em>não</em> existirá na consulta oficial do governo.
                </span>
              ) : (
                <span>
                  <strong className="text-emerald-700">Modo SEFAZ Real:</strong> O XML é enviado via mTLS aos servidores oficiais da SVRS. <strong>Exige Certificado ICP-Brasil (.pfx) válido</strong> e CNPJ credenciado no SEFA-PA para constar na consulta pública da Receita.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Formulário de Upload do Certificado A1 (.pfx) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Importar Novo Certificado Digital A1 (.pfx / .p12)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              O microserviço utiliza o certificado para assinar as tags XML-DSig (<code className="text-blue-600 font-mono">infBPe</code>) e autenticar as conexões mTLS com a SEFAZ.
            </p>
          </div>

          <form onSubmit={handleUploadCertificado} className="space-y-4">
            {/* Input de Arquivo */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                id="input-arquivo-pfx"
                type="file"
                accept=".pfx,.p12"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="input-arquivo-pfx" className="cursor-pointer block space-y-2">
                <FileCheck className="w-8 h-8 text-blue-600 mx-auto" />
                <div>
                  <span className="text-xs font-semibold text-blue-600 hover:underline">
                    Clique para selecionar seu arquivo .pfx ou .p12
                  </span>
                  <p className="text-[11px] text-slate-400">Formatos aceitos: PKCS#12 (.pfx, .p12)</p>
                </div>
                {file && (
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-xs">
                    Arquivo selecionado: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </label>
            </div>

            {/* Senha do Certificado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Senha do Certificado A1:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-senha-certificado"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite a senha do arquivo .pfx"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  id="btn-upload-pfx"
                  type="submit"
                  disabled={loading || !file}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  Instalar Certificado A1
                </button>
              </div>
            </div>
          </form>

          {/* Atalho para Gerar Certificado de Testes */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Ambiente de Desenvolvimento / Testes?</span>
              <p className="text-[11px] text-slate-500">
                Gere um certificado auto-assinado instantaneamente para testar a assinatura digital XML e o fluxo do microserviço.
              </p>
            </div>
            <button
              id="btn-gerar-cert-demo"
              type="button"
              onClick={handleGerarDemo}
              disabled={loading}
              className="px-4 py-2 border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              Gerar Certificado de Teste
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
