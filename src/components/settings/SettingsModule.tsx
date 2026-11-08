import React, { useState } from 'react';
import { CompanySettings } from '../../types';
import {
  Settings,
  Building2,
  DollarSign,
  FileText,
  Cloud,
  CheckCircle2,
  Save,
  Smartphone,
  Mail,
  MapPin,
  CalendarCheck,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { signInWithGoogle, getCachedGoogleAccessToken } from '../../services/firebase';
import { ensureProjectStructure } from '../../services/driveService';

interface SettingsModuleProps {
  settings: CompanySettings | null;
  onSaveSettings: (settings: Partial<CompanySettings>) => Promise<void>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  onSaveSettings,
}) => {
  const initialFormState: CompanySettings = {
    razaoSocial: settings?.razaoSocial || 'CloMec Serviços Especializados e Metalmecânica ME',
    nomeFantasia: settings?.nomeFantasia || 'CloMec',
    cnpjCpf: settings?.cnpjCpf || '45.123.456/0001-89',
    telefone: settings?.telefone || '(11) 98765-4321',
    whatsapp: settings?.whatsapp || '11987654321',
    email: settings?.email || 'contato@clomec.com.br',
    endereco: settings?.endereco || 'Avenida Industrial Metalúrgica, 1500 - Galpão 03',
    cidade: settings?.cidade || 'São Paulo',
    estado: settings?.estado || 'SP',
    cep: settings?.cep || '04500-000',
    chavePix: settings?.chavePix || '11987654321',
    tipoPix: settings?.tipoPix || 'Celular',
    dadosBancarios: settings?.dadosBancarios || 'Banco Inter (077) • Ag 0001 • CC 1234567-8',
    responsavelNome: settings?.responsavelNome || 'Clodoaldo Ferreira',
    responsavelCargo: settings?.responsavelCargo || 'Soldador Especialista / Inspetor N1',
    condicoesPadrao:
      settings?.condicoesPadrao ||
      'Pagamento de 50% de entrada no início dos trabalhos e saldo de 50% na conclusão e aprovação dos serviços. Garantia de 12 meses contra defeitos de solda.',
    validadePadraoDias: settings?.validadePadraoDias || 15,
    proximoNumeroOrcamento: settings?.proximoNumeroOrcamento || 1,
    proximoNumeroRelatorio: settings?.proximoNumeroRelatorio || 1,
    proximoCodigoProjeto: settings?.proximoCodigoProjeto || 1,
    createdBy: settings?.createdBy || '',
  };

  const [formData, setFormData] = useState<CompanySettings>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);

  const hasGoogleToken = !!getCachedGoogleAccessToken();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setDriveConnecting(true);
    setDriveMsg(null);
    try {
      await signInWithGoogle();
      // Ensure root folder CloMec
      const structure = await ensureProjectStructure('CloMec Geral', 'admin', 'ROOT', 'init');
      if (structure?.rootFolderId) {
        await onSaveSettings({
          driveFolderPrincipalId: structure.rootFolderId,
          driveAccountConnected: true,
          calendarAccountConnected: true,
        });
      }
      setDriveMsg('Conta Google conectada com sucesso! Pasta principal "CloMec" pronta para armazenar fotos e laudos.');
    } catch (error) {
      console.error('Error connecting Google Drive:', error);
      setDriveMsg('Não foi possível conectar a conta Google. Tente novamente.');
    } finally {
      setDriveConnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-industrial flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#FF8500]" />
            Configurações da Empresa
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dados comerciais da CloMec, dados bancários, PIX, condições contratuais e integração com Google Drive/Agenda.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Configurações salvas!</span>
          </div>
        )}
      </div>

      {/* Brand Visual Preview Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#071B35] via-[#0B2548] to-[#123F70] border border-slate-700 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <BrandLogo size="lg" showSlogan={true} />
        <div className="text-right text-xs text-slate-300 font-industrial">
          <span className="block text-[#FF8500] font-bold">Identidade Visual Oficial</span>
          <span>Aplicada automaticamente em orçamentos, relatórios e telas</span>
        </div>
      </div>

      {/* GOOGLE DRIVE & CALENDAR CLOUD INTEGRATION CARD (Mandatory) */}
      <div className="rounded-3xl bg-[#0B213F] border border-slate-700/80 p-6 shadow-md space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white font-industrial">
                Integração Google Drive e Google Agenda (OAuth 2.0)
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Repositório na nuvem para armazenar automaticamente fotografias de obras (Antes/Durante/Depois) e sincronizar compromissos de visitas técnicas.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              hasGoogleToken
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {hasGoogleToken ? 'Conectado' : 'Não conectado'}
          </span>
        </div>

        {driveMsg && (
          <div className="p-3 rounded-xl bg-[#071B35] border border-blue-400/30 text-blue-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FF8500] shrink-0" />
            <span>{driveMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-[#071B35] border border-slate-800">
            <span className="font-bold text-white block mb-1">📁 Estrutura de Pastas Automatizada:</span>
            <code className="text-[11px] text-[#FF8500] font-mono-code block whitespace-pre">
              CloMec/Clientes/Cliente_001/Projetos/Projeto_001/Antes/Durante/Depois/
            </code>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#071B35] border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="font-bold text-white block mb-1">📅 Google Calendar:</span>
              <p className="text-[11px] text-slate-400">
                Sincroniza visitas e serviços técnicos com alertas no smartphone do administrador.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnectGoogleDrive}
              disabled={driveConnecting}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-[#123F70] hover:bg-[#1A528F] text-white font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${driveConnecting ? 'animate-spin' : ''}`} />
              <span>{hasGoogleToken ? 'Reconectar / Atualizar Permissões Google' : 'Conectar Conta Google do Administrador'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Identificação Comercial */}
        <div className="rounded-3xl bg-[#0B213F] border border-slate-700/80 p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Building2 className="w-5 h-5 text-[#FF8500]" />
            <h2 className="text-base font-bold text-white font-industrial">
              Identificação Comercial da Empresa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Nome Comercial (Fantasia) *
              </label>
              <input
                type="text"
                required
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Razão Social
              </label>
              <input
                type="text"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                CNPJ ou CPF
              </label>
              <input
                type="text"
                value={formData.cnpjCpf}
                onChange={(e) => setFormData({ ...formData, cnpjCpf: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                E-mail Comercial
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Telefone Comercial
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                <WhatsAppIcon variant="official" className="w-3.5 h-3.5" />
                <span>WhatsApp de Atendimento *</span>
              </label>
              <input
                type="text"
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Endereço da Oficina / Base
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>
          </div>
        </div>

        {/* Dados de Pagamento & PIX */}
        <div className="rounded-3xl bg-[#0B213F] border border-slate-700/80 p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-industrial">
              Dados Bancários e Chave PIX
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Chave PIX
              </label>
              <input
                type="text"
                value={formData.chavePix}
                onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                placeholder="CNPJ, CPF, Celular, E-mail..."
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Tipo da Chave PIX
              </label>
              <select
                value={formData.tipoPix}
                onChange={(e) => setFormData({ ...formData, tipoPix: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              >
                <option value="Celular">Celular</option>
                <option value="CNPJ">CNPJ</option>
                <option value="CPF">CPF</option>
                <option value="E-mail">E-mail</option>
                <option value="Chave Aleatória">Chave Aleatória</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Dados Bancários para Transferência (TED / DOC)
              </label>
              <input
                type="text"
                value={formData.dadosBancarios}
                onChange={(e) => setFormData({ ...formData, dadosBancarios: e.target.value })}
                placeholder="Banco, Agência, Conta Corrente, Titular"
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>
          </div>
        </div>

        {/* Responsável Técnico & Condições Padrão */}
        <div className="rounded-3xl bg-[#0B213F] border border-slate-700/80 p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white font-industrial">
              Responsável Técnico e Condições Contratuais
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Nome do Responsável Técnico *
              </label>
              <input
                type="text"
                required
                value={formData.responsavelNome}
                onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Cargo / Certificação
              </label>
              <input
                type="text"
                value={formData.responsavelCargo}
                onChange={(e) => setFormData({ ...formData, responsavelCargo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                Condições Comerciais Padrão em Orçamentos
              </label>
              <textarea
                rows={3}
                value={formData.condicoesPadrao}
                onChange={(e) => setFormData({ ...formData, condicoesPadrao: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold text-sm shadow-xl shadow-[#FF8500]/25 transition active:scale-95 disabled:opacity-60"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Salvando Ajustes...' : 'Salvar Todas as Configurações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
