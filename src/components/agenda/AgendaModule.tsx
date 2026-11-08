import React, { useState } from 'react';
import {
  Appointment,
  Client,
  AppointmentType,
  AppointmentStatus,
} from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  MessageCircle,
  CalendarCheck,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { openWhatsAppChat, formatAppointmentMessage } from '../../services/whatsappService';
import { syncAppointmentToGoogleCalendar } from '../../services/driveService';
import { getCachedGoogleAccessToken } from '../../services/firebase';

interface AgendaModuleProps {
  appointments: Appointment[];
  clients: Client[];
  onCreateAppointment: (appt: Omit<Appointment, 'id'>) => Promise<void>;
  onUpdateAppointment: (id: string, appt: Partial<Appointment>) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
}

export const AgendaModule: React.FC<AgendaModuleProps> = ({
  appointments,
  clients,
  onCreateAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Form State
  const initialFormState: Omit<Appointment, 'id' | 'createdBy' | 'createdAt'> = {
    clientId: clients[0]?.id || '',
    clientNome: clients[0]?.nome || '',
    tipo: 'Visita técnica',
    data: selectedDate,
    horarioInicio: '09:00',
    horarioFim: '10:30',
    endereco: '',
    descricao: '',
    observacoes: '',
    status: 'Confirmado',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const appointmentTypes: AppointmentType[] = [
    'Visita técnica',
    'Elaboração de orçamento',
    'Execução de soldagem',
    'Manutenção',
    'Entrega de serviço',
    'Retorno ao cliente',
  ];

  const appointmentStatuses: AppointmentStatus[] = [
    'Pendente',
    'Confirmado',
    'Em andamento',
    'Concluído',
    'Cancelado',
  ];

  const handleOpenCreate = () => {
    setEditingAppt(null);
    const client = clients[0];
    setFormData({
      ...initialFormState,
      clientId: client?.id || '',
      clientNome: client?.nome || '',
      endereco: client?.endereco ? `${client.endereco}, ${client.numero || ''} - ${client.cidade || ''}` : '',
      data: selectedDate,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setFormData({
      clientId: appt.clientId,
      clientNome: appt.clientNome,
      tipo: appt.tipo,
      data: appt.data,
      horarioInicio: appt.horarioInicio,
      horarioFim: appt.horarioFim || '',
      endereco: appt.endereco || '',
      descricao: appt.descricao || '',
      observacoes: appt.observacoes || '',
      status: appt.status,
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
        endereco: client.endereco ? `${client.endereco}${client.numero ? `, ${client.numero}` : ''} - ${client.cidade}` : prev.endereco,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.data || !formData.horarioInicio) return;

    setFormSubmitting(true);
    try {
      if (editingAppt && editingAppt.id) {
        await onUpdateAppointment(editingAppt.id, formData);
      } else {
        await onCreateAppointment({
          ...formData,
          createdBy: '',
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setEditingAppt(null);
    } catch (error) {
      console.error('Error saving appointment:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSyncCalendar = async (appt: Appointment) => {
    const hasToken = getCachedGoogleAccessToken();
    if (!hasToken) {
      setSyncStatusMsg('Conecte sua Conta Google nas Configurações para sincronizar com o Google Calendar.');
      setTimeout(() => setSyncStatusMsg(null), 5000);
      return;
    }

    const eventId = await syncAppointmentToGoogleCalendar(appt);
    if (eventId) {
      await onUpdateAppointment(appt.id!, { googleEventId: eventId });
      setSyncStatusMsg('Compromisso sincronizado com o Google Calendar com sucesso!');
    } else {
      setSyncStatusMsg('Não foi possível sincronizar o evento. Verifique a autorização da conta Google.');
    }
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleSendWhatsAppConfirmation = (appt: Appointment) => {
    const client = clients.find((c) => c.id === appt.clientId);
    const phone = client?.whatsapp || client?.telefone;
    if (!phone) {
      alert('Telefone do cliente não encontrado.');
      return;
    }
    const message = formatAppointmentMessage({ nome: appt.clientNome }, appt);
    openWhatsAppChat(phone, message);
  };

  // Date navigation helpers
  const changeDateByDays = (days: number) => {
    const cur = new Date(selectedDate + 'T12:00:00');
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  // Filter appointments for current view
  const todayStr = new Date().toISOString().split('T')[0];

  const getFilteredAppointments = () => {
    if (viewMode === 'daily') {
      return appointments.filter((a) => a.data === selectedDate);
    }
    if (viewMode === 'weekly') {
      const start = new Date(selectedDate + 'T12:00:00');
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(start.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);

      const monStr = monday.toISOString().split('T')[0];
      const sunStr = sunday.toISOString().split('T')[0];
      return appointments.filter((a) => a.data >= monStr && a.data <= sunStr);
    }
    // Monthly
    const [year, month] = selectedDate.split('-');
    return appointments.filter((a) => a.data.startsWith(`${year}-${month}`));
  };

  const currentViewAppointments = getFilteredAppointments();

  // Upcoming alerts (today + next 48h)
  const next48h = new Date();
  next48h.setDate(next48h.getDate() + 2);
  const next48hStr = next48h.toISOString().split('T')[0];
  const urgentAlerts = appointments.filter(
    (a) => a.data >= todayStr && a.data <= next48hStr && a.status !== 'Cancelado' && a.status !== 'Concluído'
  );

  return (
    <div className="space-y-5">
      {/* Module Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-industrial flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#FF8500]" />
            Agenda e Atendimentos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visitas técnicas, orçamentos in loco, execução de solda e sincronização com Google Calendar.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold text-sm shadow-lg shadow-[#FF8500]/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {syncStatusMsg && (
        <div className="p-3.5 rounded-2xl bg-[#123F70] border border-blue-400/40 text-blue-100 text-xs flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-[#FF8500] shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Urgent 48h Alert Banner */}
      {urgentAlerts.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-200">
              Atenção: Você tem {urgentAlerts.length} compromisso(s) para hoje ou próximos 2 dias!
            </span>
          </div>
          <span className="text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
            Próximos
          </span>
        </div>
      )}

      {/* Control Bar: Views & Date Navigation */}
      <div className="bg-[#0B213F] border border-slate-700/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Date Selector with Next / Prev */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDateByDays(viewMode === 'monthly' ? -30 : viewMode === 'weekly' ? -7 : -1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#071B35] border border-slate-700 text-white text-xs font-bold font-mono-code focus:outline-none focus:border-[#FF8500]"
          />

          <button
            onClick={() => changeDateByDays(viewMode === 'monthly' ? 30 : viewMode === 'weekly' ? 7 : 1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Hoje
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#071B35] p-1 rounded-xl border border-slate-700 text-xs font-bold">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 rounded-lg transition ${
              viewMode === 'daily' ? 'bg-[#FF8500] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Diário
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 rounded-lg transition ${
              viewMode === 'weekly' ? 'bg-[#FF8500] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 rounded-lg transition ${
              viewMode === 'monthly' ? 'bg-[#FF8500] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mensal
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {currentViewAppointments.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0B213F] border border-slate-700/80">
          <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum compromisso agendado no período</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Utilize o botão acima para cadastrar uma visita técnica, elaboração de orçamento ou execução de soldagem.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123F70] hover:bg-[#1A528F] text-xs font-bold text-white transition"
          >
            <Plus className="w-4 h-4" />
            Agendar Compromisso
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentViewAppointments.map((appt) => {
            const isToday = appt.data === todayStr;
            const statusColor =
              appt.status === 'Confirmado'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                : appt.status === 'Em andamento'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                : appt.status === 'Concluído'
                ? 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                : appt.status === 'Cancelado'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={appt.id}
                className={`rounded-2xl bg-[#0B213F] border p-4 shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isToday ? 'border-[#FF8500]/60 ring-1 ring-[#FF8500]/20' : 'border-slate-700/80'
                }`}
              >
                {/* Time & Type Column */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center min-w-[70px] p-2.5 rounded-xl bg-[#071B35] border border-slate-700/80 text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {new Date(appt.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </span>
                    <span className="text-base font-extrabold text-white font-mono-code">
                      {new Date(appt.data + 'T12:00:00').getDate()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-code">
                      {new Date(appt.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {appt.clientNome}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#123F70] text-blue-200">
                        {appt.tipo}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1 font-mono-code text-[#FF8500] font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{appt.horarioInicio}{appt.horarioFim ? ` - ${appt.horarioFim}` : ''}</span>
                      </div>

                      {appt.endereco && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-xs">{appt.endereco}</span>
                        </div>
                      )}
                    </div>

                    {appt.descricao && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {appt.descricao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons Column */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* WhatsApp confirmation */}
                  <button
                    onClick={() => handleSendWhatsAppConfirmation(appt)}
                    className="p-2 rounded-xl bg-emerald-950/70 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30 transition flex items-center gap-1.5 text-xs font-bold"
                    title="Confirmar com o cliente pelo WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Confirmar</span>
                  </button>

                  {/* Google Calendar sync */}
                  <button
                    onClick={() => handleSyncCalendar(appt)}
                    className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                      appt.googleEventId
                        ? 'bg-blue-950/70 text-blue-300 border-blue-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                    title="Sincronizar com Google Calendar"
                  >
                    <CalendarCheck className="w-4 h-4 text-blue-400" />
                    <span className="hidden sm:inline">{appt.googleEventId ? 'Sincronizado' : 'Google Agenda'}</span>
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(appt)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Editar compromisso"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteConfirmId(appt.id || null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition"
                    title="Excluir agendamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT APPOINTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl p-6 my-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#FF8500]" />
                <h2 className="text-lg font-bold font-industrial">
                  {editingAppt ? 'Editar Compromisso' : 'Novo Agendamento CloSolda'}
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
              {/* Cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Cliente *
                </label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                >
                  <option value="">Selecione um cliente cadastrado...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cidade ? `(${c.cidade})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Atendimento */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Tipo de Atendimento *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as AppointmentType })}
                  className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                >
                  {appointmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data & Horários */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.horarioInicio}
                    onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Término
                  </label>
                  <input
                    type="time"
                    value={formData.horarioFim}
                    onChange={(e) => setFormData({ ...formData, horarioFim: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Endereço de Execução */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Endereço do Atendimento
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, galpão, local da soldagem..."
                  className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Status do Agendamento
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                  className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                >
                  {appointmentStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Descrição do Serviço / Pauta
                </label>
                <textarea
                  rows={2}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Medição in loco de portão basculante ou inspeção de tubulação MIG/MAG"
                  className="w-full px-3.5 py-2.5 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                />
              </div>

              {/* Botões */}
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
                  className="px-5 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 text-xs font-bold shadow-md transition disabled:opacity-60"
                >
                  {formSubmitting ? 'Salvando...' : editingAppt ? 'Atualizar Agendamento' : 'Confirmar Agendamento'}
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
              <h3 className="text-base font-bold">Cancelar / Excluir Compromisso</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja remover este atendimento da agenda? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  await onDeleteAppointment(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
