import React, { useState, useEffect } from 'react';
import { BPeRegistro, CertificadoConfig, MicroservicoConfig } from './types';
import { DashboardOverview } from './components/DashboardOverview';
import { EmitirBPeForm } from './components/EmitirBPeForm';
import { HistoricoBPeList } from './components/HistoricoBPeList';
import { CertificadoManager } from './components/CertificadoManager';
import { ApiIntegrationDocs } from './components/ApiIntegrationDocs';
import { SefazMonitor } from './components/SefazMonitor';
import { DabpeModal } from './components/DabpeModal';
import {
  Bus,
  LayoutDashboard,
  PlusCircle,
  History,
  ShieldCheck,
  Code2,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'emitir' | 'historico' | 'certificado' | 'docs' | 'sefaz'>('dashboard');
  const [bilhetes, setBilhetes] = useState<BPeRegistro[]>([]);
  const [certificado, setCertificado] = useState<CertificadoConfig | null>(null);
  const [config, setConfig] = useState<MicroservicoConfig | null>(null);
  const [selectedBPe, setSelectedBPe] = useState<BPeRegistro | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchDados = async () => {
    try {
      setRefreshing(true);
      const [respHist, respConfig] = await Promise.all([
        fetch('/api/bpe/historico'),
        fetch('/api/config'),
      ]);

      if (respHist.ok) {
        const dataHist = await respHist.json();
        if (dataHist.dados) setBilhetes(dataHist.dados);
      }

      if (respConfig.ok) {
        const dataConfig = await respConfig.json();
        if (dataConfig.config) setConfig(dataConfig.config);
        if (dataConfig.certificado) setCertificado(dataConfig.certificado);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do microserviço:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleEmissaoSucesso = (chave: string) => {
    fetchDados().then(() => {
      // Abre o histórico ou o DABPE do bilhete emitido
      fetch(`/api/bpe/dados/${chave}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.dados) setSelectedBPe(data.dados);
        })
        .catch(console.error);
    });
  };

  return (
    <div id="bpe-app-root" className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              BP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-800">
                  BPe-Sync <span className="text-slate-400 font-normal text-xs sm:text-sm ml-1.5">Microservice v2.4.0</span>
                </h1>
                <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium border border-slate-200">
                  Modelo 63 • MOC v1.00
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicators no Header */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                SEFAZ: <span className="text-slate-900 font-semibold">{certificado?.modoOperacao === 'SANDBOX_SEFAZ' ? 'Sandbox' : 'Online'}</span>
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4 sm:pl-6">
              <span className={`w-2 h-2 rounded-full ${certificado?.hasCertificado ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                Certificado: <span className="text-slate-900 font-semibold">{certificado?.hasCertificado ? 'Ativo A1' : 'Pendente'}</span>
              </span>
            </div>

            <button
              id="btn-refresh-app"
              onClick={fetchDados}
              disabled={refreshing}
              title="Recarregar Dados"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto space-x-1 border-t border-slate-100 scrollbar-none">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </button>

          <button
            id="tab-emitir"
            onClick={() => setActiveTab('emitir')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'emitir'
                ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Emitir BP-e (Testador)
          </button>

          <button
            id="tab-historico"
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'historico'
                ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico ({bilhetes.length})
          </button>

          <button
            id="tab-certificado"
            onClick={() => setActiveTab('certificado')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'certificado'
                ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Certificado Digital A1
            {certificado?.hasCertificado && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            id="tab-docs"
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            API & Integração
          </button>

          <button
            id="tab-sefaz"
            onClick={() => setActiveTab('sefaz')}
            className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'sefaz'
                ? 'border-blue-600 text-blue-600 font-semibold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Server className="w-4 h-4" />
            Monitor SEFAZ
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Iniciando microserviço e conectando à SEFAZ...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardOverview
                bilhetes={bilhetes}
                certificado={certificado}
                onNavigate={(t) => setActiveTab(t)}
                onSelectBPe={(b) => setSelectedBPe(b)}
              />
            )}

            {activeTab === 'emitir' && (
              <EmitirBPeForm onSuccess={handleEmissaoSucesso} />
            )}

            {activeTab === 'historico' && (
              <HistoricoBPeList
                bilhetes={bilhetes}
                onSelectBPe={(b) => setSelectedBPe(b)}
                onRefresh={fetchDados}
              />
            )}

            {activeTab === 'certificado' && (
              <CertificadoManager
                certificado={certificado}
                onUpdate={fetchDados}
              />
            )}

            {activeTab === 'docs' && <ApiIntegrationDocs />}

            {activeTab === 'sefaz' && <SefazMonitor />}
          </>
        )}
      </main>

      {/* Modal do DABPE */}
      {selectedBPe && (
        <DabpeModal
          bpe={selectedBPe}
          onClose={() => setSelectedBPe(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Microserviço de Emissão de Bilhete de Passagem Eletrônico (BP-e Mod 63) • Padrão SEFAZ ICP-Brasil
          </span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>SOAP / XML-DSig / REST API</span>
            <span>•</span>
            <a
              href="/api/docs/openapi"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline flex items-center gap-1"
            >
              OpenAPI JSON
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
