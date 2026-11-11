import React from 'react';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { useAuth } from '../../context/AuthContext';
import { getCachedGoogleAccessToken } from '../../services/firebase';
import { LogOut, Cloud, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Header: React.FC<{ activeTabTitle?: string }> = ({ activeTabTitle }) => {
  const { user, signOutUser } = useAuth();
  const hasDriveToken = !!getCachedGoogleAccessToken();

  return (
    <header className="sticky top-0 z-30 bg-[#071B35]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" showSlogan={false} />
          {activeTabTitle && (
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-700">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold font-industrial">
                Módulo
              </span>
              <span className="text-sm font-bold text-white font-industrial">
                {activeTabTitle}
              </span>
            </div>
          )}
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* Drive status badge */}
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border ${
              hasDriveToken
                ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title={hasDriveToken ? 'Google Drive e Agenda Conectados' : 'Google Drive em Modo Local'}
          >
            <Cloud className={`w-3.5 h-3.5 ${hasDriveToken ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{hasDriveToken ? 'Drive Ativo' : 'Nuvem Pronta'}</span>
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">
                  {user.displayName || user.email?.split('@')[0] || 'Administrador'}
                </span>
                <span className="text-[10px] text-[#FF8500] font-semibold flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin CloMec
                </span>
              </div>

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Admin"
                  className="w-8 h-8 rounded-full border border-[#FF8500]/50 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#123F70] text-white flex items-center justify-center font-bold text-xs border border-slate-700">
                  <UserIcon className="w-4 h-4 text-slate-300" />
                </div>
              )}

              <div
                title="Painel Administrativo CloMec - Acesso Direto Ativo"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Acesso Direto</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
