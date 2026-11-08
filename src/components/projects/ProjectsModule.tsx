import React, { useState } from 'react';
import {
  Project,
  Client,
  Quote,
  ProjectStatus,
  ServiceType,
} from '../../types';
import {
  Hammer,
  Plus,
  Search,
  Camera,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { openWhatsAppChat, formatServiceCompletedMessage } from '../../services/whatsappService';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface ProjectsModuleProps {
  projects: Project[];
  clients: Client[];
  quotes: Quote[];
  onCreateProject: (proj: Omit<Project, 'id'>) => Promise<void>;
  onUpdateProject: (id: string, proj: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onNavigateToPhotos?: (projectId: string) => void;
  onNavigateToReports?: (projectId: string) => void;
}

export const ProjectsModule: React.FC<ProjectsModuleProps> = ({
  projects,
  clients,
  quotes,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onNavigateToPhotos,
  onNavigateToReports,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedDetailProject, setSelectedDetailProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const serviceTypes: ServiceType[] = [
    'Soldagem MIG/MAG',
    'Soldagem TIG',
    'Soldagem eletrodo revestido',
    'Fabricação de estruturas metálicas',
    'Portões e grades',
    'Corrimãos e guarda-corpos',
    'Reparos e manutenção',
    'Soldagem de tubulações',
    'Serviços industriais',
    'Serviços residenciais',
    'Outros',
  ];

  const projectStatuses: ProjectStatus[] = [
    'Aguardando início',
    'Em execução',
    'Pausado',
    'Concluído',
    'Entregue',
  ];

  const getNextProjectCode = () => {
    const year = new Date().getFullYear();
    const existing = projects.filter((p) => p.codigo.includes(String(year)));
    return `PRJ-${year}-${String(existing.length + 1).padStart(3, '0')}`;
  };

  const initialFormState: Omit<Project, 'id' | 'createdBy' | 'createdAt'> = {
    codigo: getNextProjectCode(),
    clientId: clients[0]?.id || '',
    clientNome: clients[0]?.nome || '',
    quoteId: '',
    nome: '',
    tipoServico: 'Soldagem MIG/MAG',
    enderecoExecucao: '',
    dataInicio: new Date().toISOString().split('T')[0],
    previsaoConclusao: '',
    dataConclusao: '',
    descricao: '',
    materiais: 'Tubo de aço carbono 50x50mm, chapa 1/8", eletrodo AWS E7018 / arame MIG ER70S-6.',
    equipamentos: 'Máquina inversora de solda 250A, tocha MIG, esmerilhadeira 4.1/2", nível de precisão e EPIs.',
    observacoes: '',
    status: 'Em execução',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingProject(null);
    const client = clients[0];
    setFormData({
      ...initialFormState,
      codigo: getNextProjectCode(),
      clientId: client?.id || '',
      clientNome: client?.nome || '',
      enderecoExecucao: client?.endereco ? `${client.endereco}, ${client.numero || ''} - ${client.cidade || ''}` : '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      codigo: project.codigo,
      clientId: project.clientId,
      clientNome: project.clientNome,
      quoteId: project.quoteId || '',
      quoteNumero: project.quoteNumero || '',
      nome: project.nome,
      tipoServico: project.tipoServico,
      enderecoExecucao: project.enderecoExecucao || '',
      dataInicio: project.dataInicio || '',
      previsaoConclusao: project.previsaoConclusao || '',
      dataConclusao: project.dataConclusao || '',
      descricao: project.descricao,
      materiais: project.materiais || '',
      equipamentos: project.equipamentos || '',
      observacoes: project.observacoes || '',
      status: project.status,
    });
    setIsModalOpen(true);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData((prev) => ({
        ...prev,
        clientId: client.id || '',
        clientNome: client.nome,
        enderecoExecucao: client.endereco ? `${client.endereco}, ${client.numero || ''} - ${client.cidade || ''}` : prev.enderecoExecucao,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.clientId) return;

    setFormSubmitting(true);
    try {
      if (editingProject && editingProject.id) {
        await onUpdateProject(editingProject.id, formData);
      } else {
        await onCreateProject({
          ...formData,
          createdBy: '',
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSendCompletionWhatsApp = (project: Project) => {
    const client = clients.find((c) => c.id === project.clientId);
    const phone = client?.whatsapp || client?.telefone;
    if (!phone) {
      alert('Telefone do cliente não encontrado.');
      return;
    }
    const message = formatServiceCompletedMessage({ nome: project.clientNome }, project.nome, project.codigo);
    openWhatsAppChat(phone, message);
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchTerm =
      p.codigo.toLowerCase().includes(term) ||
      p.nome.toLowerCase().includes(term) ||
      p.clientNome.toLowerCase().includes(term) ||
      p.tipoServico.toLowerCase().includes(term);

    if (statusFilter === 'all') return matchTerm;
    return matchTerm && p.status === statusFilter;
  });

  return (
    <div className="space-y-5">
      {/* Module Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-industrial flex items-center gap-2">
            <Hammer className="w-6 h-6 text-[#FF8500]" />
            Projetos e Execução de Serviços
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhamento de soldagem, especificações de materiais, equipamentos e etapas da obra.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold text-sm shadow-lg shadow-[#FF8500]/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Novo Projeto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por código, projeto, cliente ou tipo de solda..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF8500] transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
          >
            <option value="all">Todos os Status</option>
            {projectStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0B213F] border border-slate-700/80">
          <Hammer className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum projeto encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente remover os filtros da busca.'
              : 'Clique acima para cadastrar a execução de um serviço de soldagem.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const statusColor =
              project.status === 'Concluído' || project.status === 'Entregue'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                : project.status === 'Em execução'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                : project.status === 'Pausado'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={project.id}
                className="rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 p-4 shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-400 font-mono-code">
                          {project.codigo}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                          {project.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1 truncate">
                        {project.nome}
                      </h3>
                      <span className="text-xs text-slate-300 font-medium block">
                        Cliente: <strong>{project.clientNome}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(project)}
                        title="Editar projeto"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(project.id || null)}
                        title="Excluir projeto"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-[#FF8500] font-semibold">
                      <span className="px-2 py-0.5 rounded bg-[#071B35] border border-slate-700 text-[10px]">
                        {project.tipoServico}
                      </span>
                    </div>

                    {project.enderecoExecucao && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{project.enderecoExecucao}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      {project.dataInicio && (
                        <span>Início: {new Date(project.dataInicio).toLocaleDateString('pt-BR')}</span>
                      )}
                      {project.previsaoConclusao && (
                        <span>Previsão: {new Date(project.previsaoConclusao).toLocaleDateString('pt-BR')}</span>
                      )}
                      {project.dataConclusao && (
                        <span className="text-emerald-400 font-bold">Concluído: {new Date(project.dataConclusao).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Shortcuts */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {onNavigateToPhotos && (
                      <button
                        onClick={() => onNavigateToPhotos(project.id!)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#071B35] hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold transition"
                        title="Registrar ou ver fotos deste projeto"
                      >
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Fotos</span>
                      </button>
                    )}

                    {onNavigateToReports && (
                      <button
                        onClick={() => onNavigateToReports(project.id!)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#071B35] hover:bg-slate-800 text-rose-300 border border-slate-700 text-xs font-semibold transition"
                        title="Emitir relatório técnico para este projeto"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Laudo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Notify completion via WhatsApp */}
                    {(project.status === 'Concluído' || project.status === 'Entregue') && (
                      <button
                        onClick={() => handleSendCompletionWhatsApp(project)}
                        className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] transition text-xs flex items-center gap-1 group shadow-sm"
                        title="Notificar Conclusão do Serviço no WhatsApp"
                      >
                        <WhatsAppIcon variant="official" className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                        <span className="hidden sm:inline font-semibold">Conclusão WhatsApp</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedDetailProject(project)}
                      className="px-3 py-1.5 rounded-lg bg-[#123F70] hover:bg-[#1A528F] text-white text-xs font-semibold transition flex items-center gap-1"
                    >
                      <span>Detalhes</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROJECT DETAIL MODAL */}
      {selectedDetailProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl p-6 my-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-xs font-bold text-purple-400 font-mono-code">
                  {selectedDetailProject.codigo}
                </span>
                <h2 className="text-xl font-bold font-industrial text-white mt-0.5">
                  {selectedDetailProject.nome}
                </h2>
                <span className="text-xs text-slate-300">
                  Cliente: {selectedDetailProject.clientNome}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0B213F] border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Especificação Técnica e Procedimentos
                </span>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedDetailProject.descricao || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0B213F] border border-slate-800">
                  <span className="text-[10px] font-bold text-[#FF8500] uppercase tracking-wider block mb-1">
                    Materiais Utilizados
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedDetailProject.materiais || 'Conforme especificado em projeto.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B213F] border border-slate-800">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    Equipamentos e Ferramental
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedDetailProject.equipamentos || 'Máquinas inversoras e ferramentas CloMec e EPIs.'}
                  </p>
                </div>
              </div>

              {selectedDetailProject.observacoes && (
                <div className="p-3.5 rounded-xl bg-[#0B213F] border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Observações de Campo
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedDetailProject.observacoes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
              <button
                onClick={() => setSelectedDetailProject(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl p-6 my-6 text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Hammer className="w-5 h-5 text-[#FF8500]" />
                <h2 className="text-lg font-bold font-industrial">
                  {editingProject ? 'Editar Projeto de Soldagem' : 'Cadastrar Novo Projeto'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Código
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white font-mono-code font-bold text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Nome do Projeto / Obra *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Fabricação de mezanino industrial galpão 2"
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Cliente & Tipo de Serviço */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Cliente *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  >
                    <option value="">Selecione o cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Tipo de Serviço *
                  </label>
                  <select
                    value={formData.tipoServico}
                    onChange={(e) => setFormData({ ...formData, tipoServico: e.target.value as ServiceType })}
                    className="w-full px-3 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  >
                    {serviceTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Endereço & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Local de Execução
                  </label>
                  <input
                    type="text"
                    value={formData.enderecoExecucao}
                    onChange={(e) => setFormData({ ...formData, enderecoExecucao: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Status da Obra
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  >
                    {projectStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Previsão de Conclusão
                  </label>
                  <input
                    type="date"
                    value={formData.previsaoConclusao}
                    onChange={(e) => setFormData({ ...formData, previsaoConclusao: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Data de Conclusão Real
                  </label>
                  <input
                    type="date"
                    value={formData.dataConclusao}
                    onChange={(e) => setFormData({ ...formData, dataConclusao: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Descrição Técnica do Trabalho
                </label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Detalhes dos chanfros, passes de solda, preparo das peças..."
                  className="w-full px-3.5 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                />
              </div>

              {/* Materiais e Equipamentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Materiais Empregados
                  </label>
                  <textarea
                    rows={2}
                    value={formData.materiais}
                    onChange={(e) => setFormData({ ...formData, materiais: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Equipamentos Utilizados
                  </label>
                  <textarea
                    rows={2}
                    value={formData.equipamentos}
                    onChange={(e) => setFormData({ ...formData, equipamentos: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 text-xs font-bold shadow-md transition disabled:opacity-60"
                >
                  {formSubmitting ? 'Salvando...' : editingProject ? 'Atualizar Projeto' : 'Salvar Projeto'}
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
              <h3 className="text-base font-bold">Excluir Projeto</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja remover este projeto? Esta ação não pode ser desfeita.
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
                  await onDeleteProject(deleteConfirmId);
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
