import React, { useState } from 'react';
import {
  TechnicalReport,
  Project,
  Client,
  ProjectPhoto,
  CompanySettings,
  ReportStatus,
} from '../../types';
import {
  FileCheck2,
  Plus,
  Search,
  FileDown,
  MessageCircle,
  Eye,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { generateReportPDF } from '../../services/pdfService';
import { openWhatsAppChat, formatReportMessage } from '../../services/whatsappService';

interface ReportsModuleProps {
  reports: TechnicalReport[];
  projects: Project[];
  clients: Client[];
  photos: ProjectPhoto[];
  settings?: Partial<CompanySettings>;
  initialProjectIdForReport?: string | null;
  onCreateReport: (report: Omit<TechnicalReport, 'id'>) => Promise<void>;
  onUpdateReport: (id: string, report: Partial<TechnicalReport>) => Promise<void>;
  onDeleteReport: (id: string) => Promise<void>;
  onRegisterDocument?: (doc: any) => Promise<void>;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  reports,
  projects,
  clients,
  photos,
  settings,
  initialProjectIdForReport,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onRegisterDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(!!initialProjectIdForReport);
  const [editingReport, setEditingReport] = useState<TechnicalReport | null>(null);
  const [previewReport, setPreviewReport] = useState<TechnicalReport | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getNextReportNumber = () => {
    const year = new Date().getFullYear();
    const existing = reports.filter((r) => r.numero.includes(String(year)));
    return `REL-${year}-${String(existing.length + 1).padStart(3, '0')}`;
  };

  const defaultProject = projects.find((p) => p.id === initialProjectIdForReport) || projects[0];

  const initialFormState: Omit<TechnicalReport, 'id' | 'createdBy' | 'createdAt'> = {
    numero: getNextReportNumber(),
    projectId: defaultProject?.id || '',
    projectCodigo: defaultProject?.codigo || 'PRJ-2026-001',
    clientId: defaultProject?.clientId || '',
    clientNome: defaultProject?.clientNome || '',
    data: new Date().toISOString().split('T')[0],
    localExecucao: defaultProject?.enderecoExecucao || 'Oficina técnica CloSolda',
    objetivo: 'Inspeção, reparo e reforço estrutural com soldagem de alta penetração.',
    situacaoEncontrada: 'Estrutura metálica apresentando trincas por fadiga e desgaste mecânico nos pontos de união originais.',
    atividades: 'Esmerilhamento das trincas, abertura de chanfro a 60°, pré-aquecimento localizado, soldagem multipasse e acabamento mecânico.',
    procedimentos: 'Soldagem processo GMAW (MIG/MAG) com gás de proteção Ar+CO2 e eletrodo básico AWS E7018 nos pontos estruturais críticos.',
    materiais: defaultProject?.materiais || 'Aço estrutural ASTM A36, consumível AWS ER70S-6 diâmetro 1.2mm.',
    equipamentos: defaultProject?.equipamentos || 'Inversora industrial 250A, tocha MIG Binzel, esmerilhadeira e ferramentas de inspeção.',
    observacoes: 'Ensaio visual (VT) e ensaio por líquido penetrante (PT) realizados nos cordões principais, sem descontinuidades reprováveis.',
    pendencias: 'Nenhuma pendência técnica. Obra liberada para uso e carregamento de carga.',
    recomendacoes: 'Recomenda-se realizar inspeção visual preventiva semestral nas juntas submetidas a esforço dinâmico.',
    situacaoFinal: 'Serviço concluído com total aprovação técnica e conformidade aos padrões CloSolda de qualidade e segurança.',
    dataConclusao: new Date().toISOString().split('T')[0],
    responsavelNome: settings?.responsavelNome || 'Clodoaldo Soldador Especialista',
    responsavelCargo: settings?.responsavelCargo || 'Supervisor Técnico de Soldagem',
    status: 'Finalizado',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingReport(null);
    const proj = projects[0];
    setFormData({
      ...initialFormState,
      numero: getNextReportNumber(),
      projectId: proj?.id || '',
      projectCodigo: proj?.codigo || '',
      clientId: proj?.clientId || '',
      clientNome: proj?.clientNome || '',
      localExecucao: proj?.enderecoExecucao || '',
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (report: TechnicalReport) => {
    setEditingReport(report);
    setFormData({
      numero: report.numero,
      projectId: report.projectId,
      projectCodigo: report.projectCodigo,
      clientId: report.clientId,
      clientNome: report.clientNome,
      data: report.data,
      localExecucao: report.localExecucao,
      objetivo: report.objetivo,
      situacaoEncontrada: report.situacaoEncontrada,
      atividades: report.atividades,
      procedimentos: report.procedimentos,
      materiais: report.materiais,
      equipamentos: report.equipamentos,
      observacoes: report.observacoes || '',
      pendencias: report.pendencias || '',
      recomendacoes: report.recomendacoes || '',
      situacaoFinal: report.situacaoFinal,
      dataConclusao: report.dataConclusao || '',
      responsavelNome: report.responsavelNome,
      responsavelCargo: report.responsavelCargo || '',
      status: report.status,
    });
    setIsEditorOpen(true);
  };

  const handleProjectSelect = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setFormData((prev) => ({
        ...prev,
        projectId: proj.id || '',
        projectCodigo: proj.codigo,
        clientId: proj.clientId,
        clientNome: proj.clientNome,
        localExecucao: proj.enderecoExecucao || prev.localExecucao,
        materiais: proj.materiais || prev.materiais,
        equipamentos: proj.equipamentos || prev.equipamentos,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.objetivo.trim()) return;

    setFormSubmitting(true);
    try {
      if (editingReport && editingReport.id) {
        await onUpdateReport(editingReport.id, formData);
      } else {
        await onCreateReport({
          ...formData,
          createdBy: '',
          createdAt: new Date().toISOString(),
        });
      }
      setIsEditorOpen(false);
      setEditingReport(null);
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDownloadPDF = async (report: TechnicalReport) => {
    try {
      const relatedPhotos = photos.filter((p) => p.projectId === report.projectId);
      const doc = generateReportPDF(report, relatedPhotos, settings);
      const fileName = `LaudoTecnico_${report.numero}_CloSolda.pdf`;
      doc.save(fileName);

      if (onRegisterDocument) {
        await onRegisterDocument({
          clientId: report.clientId,
          clientNome: report.clientNome,
          projectId: report.projectId,
          projectCodigo: report.projectCodigo,
          tipo: 'Relatório técnico',
          titulo: `Relatório Técnico Oficial ${report.numero}`,
          numeroRef: report.numero,
          data: report.data,
          createdBy: '',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error generating report PDF:', err);
      alert('Erro ao gerar PDF do relatório.');
    }
  };

  const handleShareWhatsApp = (report: TechnicalReport) => {
    const client = clients.find((c) => c.id === report.clientId);
    const phone = client?.whatsapp || client?.telefone;
    if (!phone) {
      alert('Telefone do cliente não encontrado.');
      return;
    }
    const message = formatReportMessage({ nome: report.clientNome }, report);
    openWhatsAppChat(phone, message);
  };

  const filteredReports = reports.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.numero.toLowerCase().includes(term) ||
      r.clientNome.toLowerCase().includes(term) ||
      (r.projectCodigo && r.projectCodigo.toLowerCase().includes(term)) ||
      r.objetivo.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-industrial flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-[#FF8500]" />
            Relatórios e Laudos Técnicos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Documentação técnica com registro fotográfico, diagnóstico, procedimentos executados e aprovação.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold text-sm shadow-lg shadow-[#FF8500]/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Emitir Novo Relatório Técnico</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por número do laudo, projeto, cliente ou objetivo..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF8500] transition"
        />
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0B213F] border border-slate-700/80">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum relatório técnico emitido</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Gere laudos técnicos profissionais com registros fotográficos e especificações de solda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 p-4 shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-rose-400 font-mono-code">
                    {report.numero}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {report.clientNome}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30 font-mono-code">
                    {report.projectCodigo}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                    {report.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">
                  {report.objetivo}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                  <span>Data: {new Date(report.data).toLocaleDateString('pt-BR')}</span>
                  <span>Técnico: {report.responsavelNome}</span>
                  {report.dataConclusao && (
                    <span className="text-emerald-400 font-semibold">
                      Concluído em: {new Date(report.dataConclusao).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                {/* Visualizar antes de gerar PDF (Mandatory) */}
                <button
                  onClick={() => setPreviewReport(report)}
                  title="Pré-visualizar Laudo"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-semibold flex items-center gap-1"
                >
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Visualizar</span>
                </button>

                {/* PDF */}
                <button
                  onClick={() => handleDownloadPDF(report)}
                  title="Gerar e Baixar PDF"
                  className="p-2 rounded-xl bg-[#123F70] hover:bg-[#1A528F] text-white transition text-xs font-semibold flex items-center gap-1"
                >
                  <FileDown className="w-4 h-4 text-[#FF8500]" />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => handleShareWhatsApp(report)}
                  title="Enviar por WhatsApp"
                  className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleOpenEdit(report)}
                  title="Editar laudo"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteConfirmId(report.id || null)}
                  title="Excluir laudo"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW REPORT MODAL (Mandatory: Visualizar antes de gerar o PDF) */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl p-6 my-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-rose-400 font-mono-code">
                  {previewReport.numero}
                </span>
                <h2 className="text-xl font-bold font-industrial text-white">
                  Pré-visualização do Relatório Técnico
                </h2>
                <span className="text-xs text-slate-300">
                  Cliente: {previewReport.clientNome} • Projeto: {previewReport.projectCodigo}
                </span>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Document Preview */}
            <div className="mt-4 p-5 rounded-2xl bg-white text-slate-900 shadow-inner space-y-4 text-xs font-sans">
              <div className="border-b-2 border-[#071B35] pb-2 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-[#071B35] tracking-wider font-industrial">
                    CLO<span className="text-[#FF8500]">SOLDA</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold">
                    QUALIDADE • SEGURANÇA • COMPROMISSO
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#071B35] font-mono block">
                    {previewReport.numero}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(previewReport.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#071B35] text-xs uppercase mb-1">1. Objetivo do Serviço</h4>
                <p className="text-slate-700">{previewReport.objetivo}</p>
              </div>

              <div>
                <h4 className="font-bold text-[#071B35] text-xs uppercase mb-1">2. Situação Encontrada</h4>
                <p className="text-slate-700">{previewReport.situacaoEncontrada}</p>
              </div>

              <div>
                <h4 className="font-bold text-[#071B35] text-xs uppercase mb-1">3. Atividades & Procedimentos</h4>
                <p className="text-slate-700">{previewReport.atividades}</p>
                <p className="text-slate-600 mt-1"><em>Método:</em> {previewReport.procedimentos}</p>
              </div>

              <div>
                <h4 className="font-bold text-[#071B35] text-xs uppercase mb-1">4. Materiais & Equipamentos</h4>
                <p className="text-slate-700">{previewReport.materiais} / {previewReport.equipamentos}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                <h4 className="font-bold text-[#071B35] text-xs uppercase mb-1">5. Parecer e Conclusão</h4>
                <p className="text-slate-800 font-semibold">{previewReport.situacaoFinal}</p>
                {previewReport.recomendacoes && (
                  <p className="text-slate-600 text-[11px] mt-1">Recomendações: {previewReport.recomendacoes}</p>
                )}
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[10px]">
                <div className="border-t border-slate-400 pt-1">
                  <strong>{previewReport.responsavelNome}</strong>
                  <span className="block text-slate-500">Responsável Técnico / CloSolda</span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <strong>{previewReport.clientNome}</strong>
                  <span className="block text-slate-500">Ciência do Cliente</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  handleDownloadPDF(previewReport);
                  setPreviewReport(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                <span>Confirmar e Gerar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT REPORT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl p-5 sm:p-6 my-6 text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#FF8500]" />
                <h2 className="text-lg font-bold font-industrial">
                  {editingReport ? `Editar Relatório ${editingReport.numero}` : 'Emissão de Relatório Técnico CloSolda'}
                </h2>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Número do Laudo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white font-mono-code font-bold text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Projeto Vinculado *
                  </label>
                  <select
                    required
                    value={formData.projectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  >
                    <option value="">Selecione o projeto...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Data do Laudo *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Local & Responsável */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Local de Execução
                  </label>
                  <input
                    type="text"
                    value={formData.localExecucao}
                    onChange={(e) => setFormData({ ...formData, localExecucao: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Responsável Técnico *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.responsavelNome}
                    onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Objetivo do Serviço */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Objetivo do Serviço *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.objetivo}
                  onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                />
              </div>

              {/* Situação Encontrada */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Situação Inicial Encontrada
                </label>
                <textarea
                  rows={2}
                  value={formData.situacaoEncontrada}
                  onChange={(e) => setFormData({ ...formData, situacaoEncontrada: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                />
              </div>

              {/* Atividades e Procedimentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Atividades Realizadas
                  </label>
                  <textarea
                    rows={2}
                    value={formData.atividades}
                    onChange={(e) => setFormData({ ...formData, atividades: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Procedimentos Técnicos de Solda
                  </label>
                  <textarea
                    rows={2}
                    value={formData.procedimentos}
                    onChange={(e) => setFormData({ ...formData, procedimentos: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Materiais e Equipamentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Materiais Utilizados
                  </label>
                  <input
                    type="text"
                    value={formData.materiais}
                    onChange={(e) => setFormData({ ...formData, materiais: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Equipamentos Utilizados
                  </label>
                  <input
                    type="text"
                    value={formData.equipamentos}
                    onChange={(e) => setFormData({ ...formData, equipamentos: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Parecer Final & Recomendações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Situação Final / Parecer Técnico *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.situacaoFinal}
                    onChange={(e) => setFormData({ ...formData, situacaoFinal: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Recomendações e Pendências
                  </label>
                  <textarea
                    rows={2}
                    value={formData.recomendacoes}
                    onChange={(e) => setFormData({ ...formData, recomendacoes: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 text-xs font-bold shadow-md transition disabled:opacity-60"
                >
                  {formSubmitting ? 'Salvando...' : editingReport ? 'Atualizar Laudo' : 'Salvar Laudo Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#071B35] border border-rose-500/40 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Excluir Relatório Técnico</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja realmente excluir este laudo técnico? A exclusão é irreversível.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onDeleteReport(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
