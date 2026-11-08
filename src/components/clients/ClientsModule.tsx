import React, { useState } from 'react';
import {
  Client,
  Quote,
  Project,
  TechnicalReport,
  ProjectPhoto,
} from '../../types';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  FileText,
  Hammer,
  FileCheck2,
  Camera,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  AlertTriangle,
  Building2,
  UserCheck,
} from 'lucide-react';
import { openWhatsAppChat } from '../../services/whatsappService';

interface ClientsModuleProps {
  clients: Client[];
  quotes: Quote[];
  projects: Project[];
  reports: TechnicalReport[];
  photos: ProjectPhoto[];
  onCreateClient: (client: Omit<Client, 'id'>) => Promise<void>;
  onUpdateClient: (id: string, client: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onOpenQuoteModalForClient?: (client: Client) => void;
  onOpenProjectModalForClient?: (client: Client) => void;
}

export const ClientsModule: React.FC<ClientsModuleProps> = ({
  clients,
  quotes,
  projects,
  reports,
  photos,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  onOpenQuoteModalForClient,
  onOpenProjectModalForClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dossierTab, setDossierTab] = useState<'info' | 'quotes' | 'projects' | 'reports' | 'photos'>('info');

  // Form State
  const initialFormState: Omit<Client, 'id' | 'createdBy' | 'createdAt'> = {
    nome: '',
    cpfCnpj: '',
    telefone: '',
    whatsapp: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: 'São Paulo',
    estado: 'SP',
    complemento: '',
    observacoes: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nome.toLowerCase().includes(term) ||
      (c.telefone && c.telefone.includes(term)) ||
      (c.whatsapp && c.whatsapp.includes(term)) ||
      (c.cpfCnpj && c.cpfCnpj.toLowerCase().includes(term)) ||
      (c.cidade && c.cidade.toLowerCase().includes(term))
    );
  });

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData(initialFormState);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nome: client.nome || '',
      cpfCnpj: client.cpfCnpj || '',
      telefone: client.telefone || '',
      whatsapp: client.whatsapp || '',
      email: client.email || '',
      cep: client.cep || '',
      endereco: client.endereco || '',
      numero: client.numero || '',
      bairro: client.bairro || '',
      cidade: client.cidade || '',
      estado: client.estado || '',
      complemento: client.complemento || '',
      observacoes: client.observacoes || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    setFormSubmitting(true);
    try {
      if (editingClient && editingClient.id) {
        await onUpdateClient(editingClient.id, formData);
        if (selectedClient && selectedClient.id === editingClient.id) {
          setSelectedClient({ ...selectedClient, ...formData });
        }
      } else {
        await onCreateClient({
          ...formData,
          createdBy: '', // Filled in parent with UID
          createdAt: new Date().toISOString(),
        });
      }
      setIsFormOpen(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteClient(id);
      setDeleteConfirmId(null);
      if (selectedClient?.id === id) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  // CEP Autocomplete Helper
  const handleCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            setFormData((prev) => ({
              ...prev,
              endereco: data.logradouro || prev.endereco,
              bairro: data.bairro || prev.bairro,
              cidade: data.localidade || prev.cidade,
              estado: data.uf || prev.estado,
            }));
          }
        }
      } catch (err) {
        console.warn('ViaCEP lookup failed:', err);
      }
    }
  };

  // Associated records for selected client
  const clientQuotes = selectedClient ? quotes.filter((q) => q.clientId === selectedClient.id) : [];
  const clientProjects = selectedClient ? projects.filter((p) => p.clientId === selectedClient.id) : [];
  const clientReports = selectedClient ? reports.filter((r) => r.clientId === selectedClient.id) : [];
  const clientPhotos = selectedClient ? photos.filter((p) => p.clientId === selectedClient.id) : [];

  return (
    <div className="space-y-5">
      {/* Module Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-industrial flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF8500]" />
            Carteira de Clientes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro, consultas cadastrais, ficha individual e histórico de serviços.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold text-sm shadow-lg shadow-[#FF8500]/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Cadastrar Novo Cliente</span>
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
          placeholder="Pesquisar por nome, telefone, WhatsApp, CPF/CNPJ ou cidade..."
          className="w-full pl-10 pr-4 py-3 bg-[#0B213F] border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF8500] transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0B213F] border border-slate-700/80">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum cliente localizado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Tente ajustar os termos da busca.'
              : 'Comece adicionando seu primeiro cliente para gerar orçamentos e agendamentos.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123F70] hover:bg-[#1A528F] text-xs font-bold text-white transition"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Agora
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const hasCpf = !!client.cpfCnpj;
            const qCount = quotes.filter((q) => q.clientId === client.id).length;
            const pCount = projects.filter((p) => p.clientId === client.id).length;

            return (
              <div
                key={client.id}
                className="rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 p-4 shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">
                        {client.nome}
                      </h3>
                      {hasCpf && (
                        <span className="text-[11px] text-slate-400 font-mono-code block">
                          Doc: {client.cpfCnpj}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        title="Editar cliente"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(client.id || null)}
                        title="Excluir cliente"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.telefone}</span>
                      {client.whatsapp && (
                        <span className="text-emerald-400 text-[10px] font-bold">
                          (WhatsApp)
                        </span>
                      )}
                    </div>

                    {client.cidade && (
                      <div className="flex items-center gap-2 truncate text-slate-400 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {client.cidade} - {client.estado}
                          {client.bairro ? ` • ${client.bairro}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Stats & Dossier Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono-code">
                    <span title="Orçamentos">{qCount} orç.</span>
                    <span title="Projetos">{pCount} proj.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {client.whatsapp && (
                      <button
                        onClick={() => openWhatsAppChat(client.whatsapp, `Olá, ${client.nome}! Aqui é da CloSolda Serviços de Soldagem.`)}
                        title="Conversar no WhatsApp"
                        className="p-1.5 rounded-lg bg-emerald-950/70 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setDossierTab('info');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#123F70] hover:bg-[#1A528F] text-xs font-semibold text-white transition flex items-center gap-1.5"
                    >
                      <span>Ficha</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INDIVIDUAL DOSSIER MODAL (Ficha Individual Completa) */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl overflow-hidden my-6">
            {/* Dossier Header */}
            <div className="bg-gradient-to-r from-[#071B35] via-[#0B2548] to-[#123F70] border-b border-slate-700 p-5 flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF8500]/20 text-[#FF8500] text-[10px] font-bold uppercase tracking-wider mb-1">
                  Ficha Individual do Cliente
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-industrial">
                  {selectedClient.nome}
                </h2>
                {selectedClient.cpfCnpj && (
                  <span className="text-xs text-slate-300 font-mono-code">
                    Documento: {selectedClient.cpfCnpj}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedClient)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title="Editar dados"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Action Contacts Bar */}
            <div className="bg-[#0B213F] px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedClient.whatsapp && (
                  <button
                    onClick={() => openWhatsAppChat(selectedClient.whatsapp, `Olá, ${selectedClient.nome}! Entramos em contato da CloSolda Serviços de Soldagem.`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                )}
                {selectedClient.telefone && (
                  <a
                    href={`tel:${selectedClient.telefone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#123F70] hover:bg-[#1A528F] text-white text-xs font-semibold transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Ligar</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onOpenQuoteModalForClient && (
                  <button
                    onClick={() => {
                      onOpenQuoteModalForClient(selectedClient);
                      setSelectedClient(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold text-xs transition"
                  >
                    + Criar Orçamento
                  </button>
                )}
                {onOpenProjectModalForClient && (
                  <button
                    onClick={() => {
                      onOpenProjectModalForClient(selectedClient);
                      setSelectedClient(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                  >
                    + Novo Projeto
                  </button>
                )}
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex border-b border-slate-800 bg-[#071B35] px-4 overflow-x-auto text-xs font-bold font-industrial">
              <button
                onClick={() => setDossierTab('info')}
                className={`py-3 px-3 border-b-2 transition ${
                  dossierTab === 'info'
                    ? 'border-[#FF8500] text-[#FF8500]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Cadastro & Endereço
              </button>
              <button
                onClick={() => setDossierTab('quotes')}
                className={`py-3 px-3 border-b-2 transition ${
                  dossierTab === 'quotes'
                    ? 'border-[#FF8500] text-[#FF8500]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Orçamentos ({clientQuotes.length})
              </button>
              <button
                onClick={() => setDossierTab('projects')}
                className={`py-3 px-3 border-b-2 transition ${
                  dossierTab === 'projects'
                    ? 'border-[#FF8500] text-[#FF8500]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Projetos & Obras ({clientProjects.length})
              </button>
              <button
                onClick={() => setDossierTab('reports')}
                className={`py-3 px-3 border-b-2 transition ${
                  dossierTab === 'reports'
                    ? 'border-[#FF8500] text-[#FF8500]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Relatórios Técnicos ({clientReports.length})
              </button>
              <button
                onClick={() => setDossierTab('photos')}
                className={`py-3 px-3 border-b-2 transition ${
                  dossierTab === 'photos'
                    ? 'border-[#FF8500] text-[#FF8500]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Fotos ({clientPhotos.length})
              </button>
            </div>

            {/* Dossier Tab Content */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {dossierTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-[#0B213F] border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contato Principal</span>
                      <p className="text-sm font-semibold text-white mt-1">{selectedClient.telefone}</p>
                      {selectedClient.whatsapp && (
                        <p className="text-xs text-emerald-400 mt-0.5">WhatsApp: {selectedClient.whatsapp}</p>
                      )}
                      {selectedClient.email && (
                        <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {selectedClient.email}
                        </p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0B213F] border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Endereço e Localidade</span>
                      <p className="text-sm font-semibold text-white mt-1">
                        {selectedClient.endereco || 'Endereço não informado'}{selectedClient.numero ? `, ${selectedClient.numero}` : ''}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedClient.bairro ? `${selectedClient.bairro} • ` : ''}{selectedClient.cidade} - {selectedClient.estado}
                      </p>
                      {selectedClient.cep && (
                        <p className="text-xs text-slate-400 font-mono-code mt-0.5">CEP: {selectedClient.cep}</p>
                      )}
                      {selectedClient.complemento && (
                        <p className="text-xs text-slate-400 mt-0.5">Compl: {selectedClient.complemento}</p>
                      )}
                    </div>
                  </div>

                  {selectedClient.observacoes && (
                    <div className="p-3.5 rounded-xl bg-[#0B213F] border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observações Internas</span>
                      <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                        {selectedClient.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {dossierTab === 'quotes' && (
                <div className="space-y-2">
                  {clientQuotes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhum orçamento emitido para este cliente.</p>
                  ) : (
                    clientQuotes.map((q) => (
                      <div key={q.id} className="p-3 rounded-xl bg-[#0B213F] border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#FF8500] font-mono-code">{q.numero}</span>
                            <span className="text-xs font-bold text-white">{q.descricaoServico}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">Emissão: {new Date(q.dataEmissao).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-white font-mono-code">
                            {q.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="block text-[10px] font-bold text-amber-400">{q.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'projects' && (
                <div className="space-y-2">
                  {clientProjects.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhum projeto registrado para este cliente.</p>
                  ) : (
                    clientProjects.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl bg-[#0B213F] border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-purple-400 font-mono-code">{p.codigo}</span>
                          <h4 className="text-xs font-bold text-white">{p.nome}</h4>
                          <span className="text-[11px] text-slate-400">{p.tipoServico}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#123F70] text-blue-200">
                          {p.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'reports' && (
                <div className="space-y-2">
                  {clientReports.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhum relatório técnico emitido para este cliente.</p>
                  ) : (
                    clientReports.map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-[#0B213F] border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-rose-400 font-mono-code">{r.numero}</span>
                          <p className="text-xs font-bold text-white">{r.objetivo}</p>
                          <span className="text-[11px] text-slate-400">Técnico: {r.responsavelNome}</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400">{r.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {dossierTab === 'photos' && (
                <div>
                  {clientPhotos.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhuma fotografia vinculada a este cliente.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {clientPhotos.map((photo) => (
                        <div key={photo.id} className="rounded-xl overflow-hidden bg-[#0B213F] border border-slate-800">
                          <img
                            src={photo.storageUrl}
                            alt={photo.legenda}
                            className="w-full h-28 object-cover"
                          />
                          <div className="p-2">
                            <span className="text-[9px] font-bold text-[#FF8500] uppercase block">{photo.etapa}</span>
                            <p className="text-[11px] text-slate-300 truncate">{photo.legenda}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CLIENT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl p-6 my-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF8500]" />
                <h2 className="text-lg font-bold font-industrial">
                  {editingClient ? 'Editar Cadastro de Cliente' : 'Novo Cadastro de Cliente'}
                </h2>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Nome Completo ou Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Indústria Mecânica Silva Ltda ou João Pereira"
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                {/* CPF / CNPJ */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Telefone de Contato *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="11987654321"
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@empresa.com.br"
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                {/* CEP with auto lookup */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => {
                      setFormData({ ...formData, cep: e.target.value });
                      handleCepLookup(e.target.value);
                    }}
                    placeholder="00000-000"
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                {/* Cidade / Estado */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                      UF *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500] uppercase"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Endereço / Logradouro
                  </label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, Avenida, Galpão, Rodovia..."
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                {/* Número / Bairro / Complemento */}
                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="123"
                      className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Distrito Industrial"
                      className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      placeholder="Galpão 4"
                      className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Observações e Notas Técnicas
                  </label>
                  <textarea
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Instruções de acesso, horários de portaria, restrições para trabalho a quente, etc."
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 text-xs font-bold shadow-md transition disabled:opacity-60"
                >
                  {formSubmitting ? 'Salvando...' : editingClient ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#071B35] border border-rose-500/40 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Confirmar Exclusão</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja realmente excluir este cliente do sistema? Esta ação é irreversível e removerá as referências deste registro.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
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
