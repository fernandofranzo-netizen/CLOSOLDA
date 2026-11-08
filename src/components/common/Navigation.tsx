import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileSpreadsheet,
  Hammer,
  Camera,
  FileCheck2,
  FolderOpen,
  Settings,
} from 'lucide-react';

export type TabId =
  | 'dashboard'
  | 'clients'
  | 'agenda'
  | 'quotes'
  | 'projects'
  | 'photos'
  | 'reports'
  | 'documents'
  | 'settings';

interface NavigationProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  badges?: {
    quotesAwaiting?: number;
    appointmentsToday?: number;
    projectsRunning?: number;
  };
}

export const navigationItems = [
  { id: 'dashboard' as TabId, label: 'Início', icon: LayoutDashboard },
  { id: 'clients' as TabId, label: 'Clientes', icon: Users },
  { id: 'agenda' as TabId, label: 'Agenda', icon: Calendar, badgeKey: 'appointmentsToday' as const },
  { id: 'quotes' as TabId, label: 'Orçamentos', icon: FileSpreadsheet, badgeKey: 'quotesAwaiting' as const },
  { id: 'projects' as TabId, label: 'Projetos', icon: Hammer, badgeKey: 'projectsRunning' as const },
  { id: 'photos' as TabId, label: 'Fotos', icon: Camera },
  { id: 'reports' as TabId, label: 'Relatórios', icon: FileCheck2 },
  { id: 'documents' as TabId, label: 'Documentos', icon: FolderOpen },
  { id: 'settings' as TabId, label: 'Ajustes', icon: Settings },
];

export const DesktopSidebar: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  badges = {},
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#071B35] border-r border-slate-800 p-4 shrink-0 min-h-[calc(100vh-61px)]">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-industrial">
        Menu Operacional
      </div>
      <nav className="space-y-1.5 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#123F70] text-white shadow-md border-l-4 border-[#FF8500]'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-[#FF8500]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {!!badgeCount && badgeCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#FF8500] text-slate-950 font-mono-code">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Industrial Footer Tag */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono-code flex items-center justify-between">
        <span>CloMec v2.6.4</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </aside>
  );
};

export const MobileBottomNav: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  badges = {},
}) => {
  // Mobile bottom bar shows 5 primary items, with a "Mais" action or full horizontal scrolling
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#071B35]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around overflow-x-auto gap-1 no-scrollbar">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-1 rounded-lg text-[10px] font-semibold transition ${
                isActive
                  ? 'text-[#FF8500]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {!!badgeCount && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-[#FF8500] text-slate-950">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[56px]">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF8500] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
