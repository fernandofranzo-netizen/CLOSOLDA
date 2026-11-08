import React, { useState } from 'react';
import {
  DocumentRecord,
  Client,
  Project,
  DocumentType,
} from '../../types';
import {
  FolderOpen,
  Search,
  FileSpreadsheet,
  FileCheck2,
  Camera,
  FileText,
  Download,
  Share2,
  Trash2,
  ExternalLink,
  Calendar,
  Filter,
} from 'lucide-react';
import { openWhatsAppChat } from '../../services/whatsappService';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface DocumentsModuleProps {
  documents: DocumentRecord[];
  clients: Client[];
  projects: Project[];
  onDeleteDocument: (id: string) => Promise<void>;
}

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({
  documents,
  clients,
  projects,
  onDeleteDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const docTypes: DocumentType[] = [
    'Orçamento',
    'Relatório técnico',
    'Fotografia',
    'Documento comercial',
    'Outro',
  ];

  const filteredDocs = documents.filter((doc) => {
    const term = searchTerm.toLowerCase();
    const matchTerm =
      doc.titulo.toLowerCase().includes(term) ||
      doc.clientNome.toLowerCase().includes(term) ||
      (doc.numeroRef && doc.numeroRef.toLowerCase().includes(term));

    const matchType = typeFilter === 'all' || doc.tipo === typeFilter;
    const matchClient = clientFilter === 'all' || doc.clientId === clientFilter;
    const matchProject = projectFilter === 'all' || doc.projectId === projectFilter;

    return matchTerm && matchType && matchClient && matchProject;
  });

  const getDocIcon = (tipo: DocumentType) => {
    switch (tipo) {
      case 'Orçamento':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'Relatório técnico':
        return <FileCheck2 className="w-5 h-5 text-rose-400" />;
      case 'Fotografia':
        return <Camera className="w-5 h-5 text-cyan-400" />;
      default:
        return <FileText className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleShareDoc = (doc: DocumentRecord) => {
    const client = clients.find((c) => c.id === doc.clientId);
    const phone = client?.whatsapp || client?.telefone;
    const msg = `Olá, ${doc.clientNome}! Segue o link/referência do documento *${doc.titulo}* (${doc.numeroRef || ''}) da *CloMec*.`;
    if (phone) {
      openWhatsAppChat(phone, msg);
    } else {
      if (navigator.share) {
        navigator.share({ title: doc.titulo, text: msg, url: doc.driveViewUrl || doc.downloadUrl });
      } else {
        alert('Compartilhamento não disponível sem telefone cadastrado.');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-industrial flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-[#FF8500]" />
            Biblioteca Central de Documentos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Repositório e histórico de orçamentos, laudos técnicos, contratos e fotografias.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0B213F] border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por título, número de referência (ORC/REL) ou cliente..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#FF8500] transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tipo */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-industrial">
              Tipo de Documento
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#071B35] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
            >
              <option value="all">Todos os Tipos</option>
              {docTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-industrial">
              Filtrar por Cliente
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#071B35] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
            >
              <option value="all">Todos os Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Projeto */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-industrial">
              Filtrar por Projeto
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#071B35] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
            >
              <option value="all">Todos os Projetos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} - {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0B213F] border border-slate-700/80">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum documento na biblioteca</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Assim que você gerar um orçamento em PDF ou emitir um laudo técnico, eles serão catalogados aqui para consulta rápida.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 p-3.5 shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-[#071B35] border border-slate-700 shrink-0">
                  {getDocIcon(doc.tipo)}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">
                      {doc.titulo}
                    </h4>
                    {doc.numeroRef && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#071B35] border border-slate-700 text-[#FF8500]">
                        {doc.numeroRef}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>Cliente: <strong className="text-slate-300">{doc.clientNome}</strong></span>
                    {doc.projectCodigo && <span>Projeto: {doc.projectCodigo}</span>}
                    <span>Data: {new Date(doc.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                {doc.driveViewUrl && (
                  <a
                    href={doc.driveViewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                    title="Ver no Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => handleShareDoc(doc)}
                  className="p-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] transition text-xs flex items-center gap-1.5 font-semibold group shadow-sm"
                  title="Compartilhar via WhatsApp"
                >
                  <WhatsAppIcon variant="official" className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  onClick={() => onDeleteDocument(doc.id!)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition"
                  title="Excluir da biblioteca"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
