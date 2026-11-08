import React from 'react';
import {
  Client,
  Quote,
  Appointment,
  Project,
} from '../../types';
import {
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Hammer,
  DollarSign,
  Calendar,
  AlertTriangle,
  PlusCircle,
  Camera,
  FileCheck2,
  ChevronRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { TabId } from '../common/Navigation';

interface DashboardViewProps {
  clients: Client[];
  quotes: Quote[];
  appointments: Appointment[];
  projects: Project[];
  onNavigate: (tab: TabId) => void;
  onOpenModal: (action: 'client' | 'appointment' | 'quote' | 'project' | 'report' | 'photo') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  quotes,
  appointments,
  projects,
  onNavigate,
  onOpenModal,
}) => {
  // Compute dynamic metrics
  const totalClients = clients.length;
  const quotesDraft = quotes.filter((q) => q.status === 'Rascunho' || q.status === 'Enviado').length;
  const quotesAwaiting = quotes.filter((q) => q.status === 'Aguardando aprovação').length;
  const quotesApproved = quotes.filter((q) => q.status === 'Aprovado').length;

  const totalApprovedValue = quotes
    .filter((q) => q.status === 'Aprovado')
    .reduce((sum, q) => sum + (q.valorTotal || 0), 0);

  const servicesScheduled = appointments.filter((a) => a.status === 'Confirmado' || a.status === 'Pendente').length;
  const projectsRunning = projects.filter((p) => p.status === 'Em execução').length;
  const projectsCompleted = projects.filter((p) => p.status === 'Concluído' || p.status === 'Entregue').length;

  // Filter today's appointments and upcoming
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.data === todayStr && a.status !== 'Cancelado');

  const upcomingAppointments = appointments
    .filter((a) => a.data >= todayStr && a.status !== 'Cancelado' && a.status !== 'Concluído')
    .slice(0, 5);

  const urgentQuotes = quotes.filter((q) => q.status === 'Aguardando aprovação').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Banner with Industrial Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071B35] via-[#0B2548] to-[#123F70] border border-slate-700/80 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF8500]/20 border border-[#FF8500]/40 text-[#FF8500] text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#FF8500] animate-ping" />
            Painel Operacional CloMec
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-industrial tracking-wide">
            Qualidade, Segurança e Compromisso
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Gestão integrada de clientes, visitas técnicas, orçamentos comerciais, soldagem especializada e registros de qualidade.
          </p>
        </div>
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-[#FF8500]/10 to-transparent pointer-events-none" />
      </div>

      {/* QUICK ACTION SHORTCUTS (Mandatory) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-industrial">
            Ações Rápidas
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onOpenModal('client')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0B213F] hover:bg-[#123F70] border border-slate-700/80 transition-all group active:scale-95 shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-[#FF8500] group-hover:text-slate-950 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2 text-center">Novo Cliente</span>
          </button>

          <button
            onClick={() => onOpenModal('appointment')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0B213F] hover:bg-[#123F70] border border-slate-700/80 transition-all group active:scale-95 shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-[#FF8500] group-hover:text-slate-950 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2 text-center">Novo Agendamento</span>
          </button>

          <button
            onClick={() => onOpenModal('quote')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0B213F] hover:bg-[#123F70] border border-slate-700/80 transition-all group active:scale-95 shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-[#FF8500] group-hover:text-slate-950 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2 text-center">Novo Orçamento</span>
          </button>

          <button
            onClick={() => onOpenModal('project')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0B213F] hover:bg-[#123F70] border border-slate-700/80 transition-all group active:scale-95 shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-[#FF8500] group-hover:text-slate-950 transition">
              <Hammer className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2 text-center">Novo Projeto</span>
          </button>

          <button
            onClick={() => onOpenModal('photo')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0B213F] hover:bg-[#123F70] border border-slate-700/80 transition-all group active:scale-95 shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-[#FF8500] group-hover:text-slate-950 transition">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2 text-center">Registrar Fotos</span>
          </button>

          <button
            onClick={() => onOpenModal('report')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#0B213F] hover:bg-[#123F70] border border-slate-700/80 transition-all group active:scale-95 shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-[#FF8500] group-hover:text-slate-950 transition">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-2 text-center">Gerar Relatório</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC METRIC INDICATORS (Mandatory) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-industrial">
            Indicadores Operacionais
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Clientes */}
          <div
            onClick={() => onNavigate('clients')}
            className="cursor-pointer p-4 rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total de Clientes</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono-code">
              {totalClients}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-[#FF8500] transition">
              <span>Ver carteira de clientes</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card: Valor Orçamentos Aprovados */}
          <div
            onClick={() => onNavigate('quotes')}
            className="cursor-pointer p-4 rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Orçamentos Aprovados</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-2 font-mono-code truncate">
              {totalApprovedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <strong className="text-emerald-300">{quotesApproved}</strong> orçamentos fechados
            </div>
          </div>

          {/* Card: Orçamentos em Negociação */}
          <div
            onClick={() => onNavigate('quotes')}
            className="cursor-pointer p-4 rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Aguardando Aprovação</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2 font-mono-code">
              {quotesAwaiting}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {quotesDraft} em elaboração/enviados
            </div>
          </div>

          {/* Card: Serviços em Andamento */}
          <div
            onClick={() => onNavigate('projects')}
            className="cursor-pointer p-4 rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Obras em Execução</span>
              <div className="p-2 rounded-xl bg-[#FF8500]/10 text-[#FF8500]">
                <Hammer className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FF8500] mt-2 font-mono-code">
              {projectsRunning}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {projectsCompleted} serviços concluídos
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: Compromissos do Dia / Alertas & Próximos Atendimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Agenda de Hoje & Próximos Atendimentos */}
        <div className="rounded-3xl bg-[#0B213F] border border-slate-700/80 p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF8500]" />
              <h3 className="font-bold text-sm text-white font-industrial">
                Compromissos e Visitas Técnicas
              </h3>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-[#FF8500] hover:underline font-semibold"
            >
              Abrir Agenda Completa
            </button>
          </div>

          {/* Today's Special Alert if any */}
          {todayAppointments.length > 0 && (
            <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-300">
                  Você tem {todayAppointments.length} atendimento(s) programado(s) para hoje!
                </span>
              </div>
              <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                Hoje
              </span>
            </div>
          )}

          {upcomingAppointments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Nenhum agendamento pendente para os próximos dias.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#071B35] border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {appt.clientNome}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#123F70] text-blue-200">
                        {appt.tipo}
                      </span>
                    </div>
                    {appt.endereco && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                        <span className="truncate">{appt.endereco}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-[#FF8500] font-mono-code">
                      {appt.horarioInicio}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(appt.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Orçamentos em Destaque & Alertas Comerciais */}
        <div className="rounded-3xl bg-[#0B213F] border border-slate-700/80 p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white font-industrial">
                Propostas e Orçamentos Recentes
              </h3>
            </div>
            <button
              onClick={() => onNavigate('quotes')}
              className="text-xs text-[#FF8500] hover:underline font-semibold"
            >
              Ver Todos
            </button>
          </div>

          {quotes.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Nenhum orçamento cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-2.5">
              {quotes.slice(0, 5).map((q) => {
                const statusColor =
                  q.status === 'Aprovado'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                    : q.status === 'Aguardando aprovação'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                    : q.status === 'Reprovado'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#071B35] border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="space-y-0.5 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#FF8500] font-mono-code">
                          {q.numero}
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {q.clientNome}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {q.descricaoServico}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-white font-mono-code">
                        {q.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border mt-0.5 ${statusColor}`}>
                        {q.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
