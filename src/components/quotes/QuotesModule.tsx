import React, { useState } from 'react';
import {
  Quote,
  QuoteItem,
  Client,
  CompanySettings,
  QuoteStatus,
  ItemCategory,
} from '../../types';
import {
  FileSpreadsheet,
  Plus,
  Search,
  FileDown,
  MessageCircle,
  Copy,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Building2,
  DollarSign,
  Calendar,
  CheckCheck,
} from 'lucide-react';
import { generateQuotePDF } from '../../services/pdfService';
import { openWhatsAppChat, formatQuoteMessage } from '../../services/whatsappService';

interface QuotesModuleProps {
  quotes: Quote[];
  clients: Client[];
  settings?: Partial<CompanySettings>;
  onCreateQuote: (quote: Omit<Quote, 'id'>) => Promise<void>;
  onUpdateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  onDeleteQuote: (id: string) => Promise<void>;
  onRegisterDocument?: (doc: any) => Promise<void>;
  initialClientForQuote?: Client | null;
  onClearInitialClient?: () => void;
}

export const QuotesModule: React.FC<QuotesModuleProps> = ({
  quotes,
  clients,
  settings,
  onCreateQuote,
  onUpdateQuote,
  onDeleteQuote,
  onRegisterDocument,
  initialClientForQuote,
  onClearInitialClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(!!initialClientForQuote);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [approvalModalQuote, setApprovalModalQuote] = useState<Quote | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split('T')[0]);

  const costCategories: ItemCategory[] = [
    'Mão de obra',
    'Materiais',
    'Consumíveis de soldagem',
    'Deslocamento',
    'Equipamentos',
    'Serviços terceirizados',
    'Outros custos',
  ];

  const quoteStatuses: QuoteStatus[] = [
    'Rascunho',
    'Enviado',
    'Aguardando aprovação',
    'Aprovado',
    'Reprovado',
    'Expirado',
  ];

  // Helper to generate next sequential code
  const getNextQuoteNumber = () => {
    const year = new Date().getFullYear();
    const existingForYear = quotes.filter((q) => q.numero.includes(String(year)));
    const nextSeq = existingForYear.length + 1;
    return `ORC-${year}-${String(nextSeq).padStart(3, '0')}`;
  };

  // Form State
  const defaultClient = initialClientForQuote || clients[0];
  const initialFormState: Omit<Quote, 'id' | 'createdBy' | 'createdAt'> = {
    numero: getNextQuoteNumber(),
    clientId: defaultClient?.id || '',
    clientNome: defaultClient?.nome || '',
    clientTelefone: defaultClient?.telefone || '',
    clientWhatsapp: defaultClient?.whatsapp || '',
    clientEndereco: defaultClient?.endereco ? `${defaultClient.endereco}, ${defaultClient.numero || ''}` : '',
    dataEmissao: new Date().toISOString().split('T')[0],
    validade: (() => {
      const d = new Date();
      d.setDate(d.getDate() + (settings?.validadePadraoDias || 15));
      return d.toISOString().split('T')[0];
    })(),
    descricaoServico: '',
    localExecucao: defaultClient?.endereco ? `${defaultClient.endereco}, ${defaultClient.numero || ''} - ${defaultClient.cidade || ''}` : '',
    prazoEstimado: '5 a 7 dias úteis após aprovação',
    condicoesPagamento: settings?.condicoesPadrao || '50% de entrada no início dos trabalhos e saldo na entrega/conclusão.',
    itens: [
      {
        quoteId: '',
        descricao: 'Serviço de soldagem especializada e acabamento mecânico',
        categoria: 'Mão de obra',
        quantidade: 1,
        unidade: 'serviço',
        valorUnitario: 850,
        valorTotal: 850,
      },
    ],
    subtotal: 850,
    desconto: 0,
    acrescimo: 0,
    valorTotal: 850,
    status: 'Rascunho',
    observacoesComerciais: 'Valores sujeitos a alteração em caso de mudanças nas especificações técnicas do projeto.',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Recalculate totals whenever items or discounts change
  const recalculateTotals = (items: QuoteItem[], desc: number, acre: number) => {
    const sub = items.reduce((acc, it) => acc + (Number(it.valorTotal) || 0), 0);
    const tot = Math.max(0, sub - (Number(desc) || 0) + (Number(acre) || 0));
    return { subtotal: sub, valorTotal: tot };
  };

  const handleOpenCreate = () => {
    setEditingQuote(null);
    const client = clients[0];
    const newNum = getNextQuoteNumber();
    const def = {
      ...initialFormState,
      numero: newNum,
      clientId: client?.id || '',
      clientNome: client?.nome || '',
      clientTelefone: client?.telefone || '',
      clientWhatsapp: client?.whatsapp || '',
      clientEndereco: client?.endereco ? `${client.endereco}, ${client.numero || ''}` : '',
      localExecucao: client?.endereco ? `${client.endereco}, ${client.numero || ''} - ${client.cidade || ''}` : '',
    };
    setFormData(def);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      numero: quote.numero,
      clientId: quote.clientId,
      clientNome: quote.clientNome,
      clientTelefone: quote.clientTelefone || '',
      clientWhatsapp: quote.clientWhatsapp || '',
      clientEndereco: quote.clientEndereco || '',
      dataEmissao: quote.dataEmissao,
      validade: quote.validade,
      descricaoServico: quote.descricaoServico,
      localExecucao: quote.localExecucao || '',
      prazoEstimado: quote.prazoEstimado || '',
      condicoesPagamento: quote.condicoesPagamento || '',
      itens: quote.itens || [],
      subtotal: quote.subtotal,
      desconto: quote.desconto || 0,
      acrescimo: quote.acrescimo || 0,
      valorTotal: quote.valorTotal,
      status: quote.status,
      observacoesComerciais: quote.observacoesComerciais || '',
      aprovadoEm: quote.aprovadoEm,
      observacoesAprovacao: quote.observacoesAprovacao,
    });
    setIsEditorOpen(true);
  };

  const handleDuplicate = (quote: Quote) => {
    const newNum = getNextQuoteNumber();
    setEditingQuote(null);
    setFormData({
      ...quote,
      numero: newNum,
      status: 'Rascunho',
      dataEmissao: new Date().toISOString().split('T')[0],
      aprovadoEm: undefined,
      observacoesAprovacao: undefined,
    });
    setIsEditorOpen(true);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData((prev) => ({
        ...prev,
        clientId: client.id || '',
        clientNome: client.nome,
        clientTelefone: client.telefone || '',
        clientWhatsapp: client.whatsapp || '',
        clientEndereco: client.endereco ? `${client.endereco}, ${client.numero || ''}` : '',
        localExecucao: client.endereco ? `${client.endereco}, ${client.numero || ''} - ${client.cidade || ''}` : prev.localExecucao,
      }));
    }
  };

  // Item Table Handlers
  const handleAddItem = () => {
    const newItem: QuoteItem = {
      quoteId: editingQuote?.id || '',
      descricao: '',
      categoria: 'Mão de obra',
      quantidade: 1,
      unidade: 'un',
      valorUnitario: 0,
      valorTotal: 0,
    };
    const updated = [...formData.itens, newItem];
    const { subtotal, valorTotal } = recalculateTotals(updated, formData.desconto, formData.acrescimo);
    setFormData({ ...formData, itens: updated, subtotal, valorTotal });
  };

  const handleUpdateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...formData.itens];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantidade' || field === 'valorUnitario') {
      const q = field === 'quantidade' ? Number(value) : item.quantidade;
      const vu = field === 'valorUnitario' ? Number(value) : item.valorUnitario;
      item.valorTotal = (q || 0) * (vu || 0);
    }

    updated[index] = item;
    const { subtotal, valorTotal } = recalculateTotals(updated, formData.desconto, formData.acrescimo);
    setFormData({ ...formData, itens: updated, subtotal, valorTotal });
  };

  const handleRemoveItem = (index: number) => {
    const updated = formData.itens.filter((_, i) => i !== index);
    const { subtotal, valorTotal } = recalculateTotals(updated, formData.desconto, formData.acrescimo);
    setFormData({ ...formData, itens: updated, subtotal, valorTotal });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricaoServico.trim() || formData.itens.length === 0) return;

    setFormSubmitting(true);
    try {
      if (editingQuote && editingQuote.id) {
        await onUpdateQuote(editingQuote.id, formData);
      } else {
        await onCreateQuote({
          ...formData,
          createdBy: '',
          createdAt: new Date().toISOString(),
        });
      }
      setIsEditorOpen(false);
      setEditingQuote(null);
      if (onClearInitialClient) onClearInitialClient();
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleGeneratePDF = async (quote: Quote) => {
    try {
      const doc = generateQuotePDF(quote, settings);
      const fileName = `Orcamento_${quote.numero}_CloSolda.pdf`;
      doc.save(fileName);

      // Register document record in library
      if (onRegisterDocument) {
        await onRegisterDocument({
          clientId: quote.clientId,
          clientNome: quote.clientNome,
          tipo: 'Orçamento',
          titulo: `Orçamento Oficial ${quote.numero}`,
          numeroRef: quote.numero,
          data: quote.dataEmissao,
          createdBy: '',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error generating quote PDF:', err);
      alert('Erro ao gerar PDF do orçamento.');
    }
  };

  const handleShareWhatsApp = (quote: Quote) => {
    const phone = quote.clientWhatsapp || quote.clientTelefone;
    if (!phone) {
      alert('Cliente não possui telefone cadastrado.');
      return;
    }
    const message = formatQuoteMessage({ nome: quote.clientNome }, quote);
    openWhatsAppChat(phone, message);
  };

  const handleConfirmApproval = async () => {
    if (!approvalModalQuote || !approvalModalQuote.id) return;
    try {
      await onUpdateQuote(approvalModalQuote.id, {
        status: 'Aprovado',
        aprovadoEm: approvalDate,
        observacoesAprovacao: approvalNotes,
      });
      setApprovalModalQuote(null);
      setApprovalNotes('');
    } catch (error) {
      console.error('Error confirming approval:', error);
    }
  };

  // Filtered quotes
  const filteredQuotes = quotes.filter((q) => {
    const term = searchTerm.toLowerCase();
    const matchTerm =
      q.numero.toLowerCase().includes(term) ||
      q.clientNome.toLowerCase().includes(term) ||
      q.descricaoServico.toLowerCase().includes(term);

    if (statusFilter === 'all') return matchTerm;
    return matchTerm && q.status === statusFilter;
  });

  return (
    <div className="space-y-5">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-industrial flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#FF8500]" />
            Gerenciador de Orçamentos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Elaboração comercial com cálculo de custos, tabela de itens, PDF CloSolda e aprovação.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold text-sm shadow-lg shadow-[#FF8500]/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Criar Novo Orçamento</span>
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
            placeholder="Pesquisar por número do orçamento, cliente ou descrição do serviço..."
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
            {quoteStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quotes Cards List */}
      {filteredQuotes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0B213F] border border-slate-700/80">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum orçamento encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente remover os filtros da pesquisa.'
              : 'Clique no botão acima para criar a primeira proposta comercial da CloSolda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const statusBadgeColor =
              quote.status === 'Aprovado'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                : quote.status === 'Aguardando aprovação'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                : quote.status === 'Reprovado'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={quote.id}
                className="rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 p-4 shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-[#FF8500] font-mono-code">
                      {quote.numero}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {quote.clientNome}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeColor}`}>
                      {quote.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {quote.descricaoServico}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                    <span>Emissão: {new Date(quote.dataEmissao).toLocaleDateString('pt-BR')}</span>
                    <span>Validade: {new Date(quote.validade).toLocaleDateString('pt-BR')}</span>
                    {quote.itens && <span>{quote.itens.length} item(ns)</span>}
                    {quote.aprovadoEm && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        Aprovado em {new Date(quote.aprovadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price and Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Valor Total
                    </span>
                    <span className="text-lg sm:text-xl font-black text-white font-mono-code text-emerald-400">
                      {quote.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* PDF Generator */}
                    <button
                      onClick={() => handleGeneratePDF(quote)}
                      title="Gerar e Baixar PDF CloSolda"
                      className="p-2 rounded-xl bg-[#123F70] hover:bg-[#1A528F] text-white transition flex items-center gap-1 text-xs font-semibold"
                    >
                      <FileDown className="w-4 h-4 text-[#FF8500]" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      onClick={() => handleShareWhatsApp(quote)}
                      title="Enviar Proposta por WhatsApp"
                      className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {/* Approve Register */}
                    {quote.status !== 'Aprovado' && (
                      <button
                        onClick={() => {
                          setApprovalModalQuote(quote);
                          setApprovalNotes(quote.observacoesAprovacao || '');
                        }}
                        title="Registrar Aprovação do Cliente"
                        className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Aprovar</span>
                      </button>
                    )}

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(quote)}
                      title="Duplicar Orçamento"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(quote)}
                      title="Editar Orçamento"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirmId(quote.id || null)}
                      title="Excluir Orçamento"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT FULL QUOTE MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl p-5 sm:p-6 my-6 text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#FF8500]" />
                <h2 className="text-lg font-bold font-industrial">
                  {editingQuote ? `Editar Orçamento ${editingQuote.numero}` : 'Gerador Profissional de Orçamento CloSolda'}
                </h2>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Número do Orçamento
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
                    Data de Emissão *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dataEmissao}
                    onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Validade da Proposta *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validade}
                    onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Client & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Cliente Solicitante *
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  >
                    <option value="">Selecione o cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.cidade ? `(${c.cidade} - ${c.estado})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Status Inicial
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as QuoteStatus })}
                    className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  >
                    {quoteStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Descrição Geral do Serviço Solicitado *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.descricaoServico}
                  onChange={(e) => setFormData({ ...formData, descricaoServico: e.target.value })}
                  placeholder="Ex: Fabricação e instalação de portão basculante em tubo galvanizado, soldagem MIG e aplicação de primer antiferrugem."
                  className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                />
              </div>

              {/* Local & Prazo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Local de Execução
                  </label>
                  <input
                    type="text"
                    value={formData.localExecucao}
                    onChange={(e) => setFormData({ ...formData, localExecucao: e.target.value })}
                    placeholder="Endereço da obra ou oficina CloSolda"
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Prazo Estimado de Execução
                  </label>
                  <input
                    type="text"
                    value={formData.prazoEstimado}
                    onChange={(e) => setFormData({ ...formData, prazoEstimado: e.target.value })}
                    placeholder="Ex: 7 a 10 dias úteis"
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* ITEMS TABLE WITH COST CATEGORIES (Mandatory) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-industrial">
                    Itens e Composição de Custos *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#123F70] hover:bg-[#1A528F] text-xs font-bold text-white transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {formData.itens.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-[#0B213F] border border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-2 text-xs"
                    >
                      <div className="w-full md:w-36 shrink-0">
                        <select
                          value={item.categoria}
                          onChange={(e) => handleUpdateItem(index, 'categoria', e.target.value as ItemCategory)}
                          className="w-full px-2 py-1.5 bg-[#071B35] border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none"
                        >
                          {costCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:flex-1">
                        <input
                          type="text"
                          required
                          value={item.descricao}
                          onChange={(e) => handleUpdateItem(index, 'descricao', e.target.value)}
                          placeholder="Descrição do item ou insumo"
                          className="w-full px-2.5 py-1.5 bg-[#071B35] border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                        >
                        </input>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        <div className="w-16">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantidade}
                            onChange={(e) => handleUpdateItem(index, 'quantidade', e.target.value)}
                            placeholder="Qtd"
                            className="w-full px-2 py-1.5 bg-[#071B35] border border-slate-700 rounded-lg text-white text-center text-xs font-mono-code focus:outline-none"
                          />
                        </div>

                        <div className="w-16">
                          <input
                            type="text"
                            value={item.unidade}
                            onChange={(e) => handleUpdateItem(index, 'unidade', e.target.value)}
                            placeholder="Unid"
                            className="w-full px-2 py-1.5 bg-[#071B35] border border-slate-700 rounded-lg text-slate-300 text-center text-xs focus:outline-none"
                          />
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.valorUnitario}
                            onChange={(e) => handleUpdateItem(index, 'valorUnitario', e.target.value)}
                            placeholder="Valor Unit"
                            className="w-full px-2 py-1.5 bg-[#071B35] border border-slate-700 rounded-lg text-white text-right text-xs font-mono-code focus:outline-none"
                          />
                        </div>

                        <div className="w-24 text-right font-bold text-white font-mono-code">
                          {item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>

                        {formData.itens.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculations Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0B213F] border border-slate-700">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Desconto (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.desconto}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const { subtotal, valorTotal } = recalculateTotals(formData.itens, val, formData.acrescimo);
                      setFormData({ ...formData, desconto: val, subtotal, valorTotal });
                    }}
                    className="w-full px-3 py-1.5 bg-[#071B35] border border-slate-700 rounded-xl text-rose-300 text-xs font-mono-code text-right focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Acréscimos / Taxas (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.acrescimo}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const { subtotal, valorTotal } = recalculateTotals(formData.itens, formData.desconto, val);
                      setFormData({ ...formData, acrescimo: val, subtotal, valorTotal });
                    }}
                    className="w-full px-3 py-1.5 bg-[#071B35] border border-slate-700 rounded-xl text-amber-300 text-xs font-mono-code text-right focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-center sm:items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Final Calculado
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#FF8500] font-mono-code">
                    {formData.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-code">
                    Subtotal: {formData.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Conditions & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Condições de Pagamento e Prazos
                  </label>
                  <textarea
                    rows={2}
                    value={formData.condicoesPagamento}
                    onChange={(e) => setFormData({ ...formData, condicoesPagamento: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Observações Comerciais e Garantias
                  </label>
                  <textarea
                    rows={2}
                    value={formData.observacoesComerciais}
                    onChange={(e) => setFormData({ ...formData, observacoesComerciais: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
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
                  {formSubmitting ? 'Salvando...' : editingQuote ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVAL REGISTRATION MODAL (Mandatory) */}
      {approvalModalQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#071B35] border border-emerald-500/40 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-2 mb-3 text-emerald-400">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold">Registrar Aprovação do Cliente</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Informe a data de aprovação e eventuais observações comerciais acordadas com o cliente para o orçamento <strong className="text-white font-mono-code">{approvalModalQuote.numero}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data de Aprovação
                </label>
                <input
                  type="date"
                  value={approvalDate}
                  onChange={(e) => setApprovalDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Termos da Aprovação
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Ex: Aprovado via WhatsApp pelo Sr. Carlos. Entrada de 50% paga via PIX no mesmo dia."
                  className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  onClick={() => setApprovalModalQuote(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmApproval}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-md"
                >
                  Confirmar Aprovação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#071B35] border border-rose-500/40 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Excluir Orçamento</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja realmente excluir este orçamento? A exclusão é permanente.
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
                  await onDeleteQuote(deleteConfirmId);
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
