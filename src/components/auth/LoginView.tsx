import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Flame,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginGoogle, loginEmail, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('manutencaolaminor@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('manutencaolaminor@gmail.com');
  const [resetLoading, setResetLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginGoogle();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Falha ao autenticar com o Google. Verifique a conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, informe e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginEmail(email, password);
    } catch (err: unknown) {
      console.error(err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou senha incorretos. Caso utilize o Google, clique no botão "Acessar com o Google" acima.');
      } else {
        setErrorMsg('Não foi possível realizar o login. Verifique suas credenciais.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    setErrorMsg(null);
    try {
      await sendPasswordReset(resetEmail);
      setSuccessMsg(`Instruções de redefinição de senha enviadas para ${resetEmail}.`);
      setShowResetModal(false);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Falha ao enviar e-mail de recuperação. Verifique o endereço digitado.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071B35] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background industrial glowing accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#123F70]/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#FF8500]/15 blur-3xl pointer-events-none" />

      {/* Top PWA install bar on login */}
      <div className="w-full max-w-md flex justify-end mb-4">
        <PWAInstallButton compact />
      </div>

      <div className="w-full max-w-md bg-[#0B213F]/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size="lg" showSlogan={true} className="mb-2" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>Acesso Administrativo Restrito</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* PRIMARY AUTH: Google Sign-in */}
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-[#FF8500] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Como acessar:</span>
            </div>
            <p className="text-[11px] text-slate-300">
              • <strong>Acesso Rápido:</strong> Clique em <strong className="text-white">Acessar com o Google</strong> para entrar diretamente sem precisar digitar senha.
            </p>
            <p className="text-[11px] text-slate-300">
              • <strong>Com E-mail e Senha:</strong> Digite seu e-mail e a senha desejada (mínimo 6 caracteres). No primeiro acesso, a senha informada será automaticamente cadastrada.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isLoading ? 'Conectando...' : 'Acessar com o Google (Recomendado)'}</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700" />
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ou com e-mail e senha
            </span>
            <div className="flex-grow border-t border-slate-700" />
          </div>

          {/* Form Email / Password */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-industrial">
                E-mail do Administrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clomec.com.br"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF8500] focus:ring-1 focus:ring-[#FF8500] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-industrial">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs text-[#FF8500] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#071B35] border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF8500] focus:ring-1 focus:ring-[#FF8500] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-[#FF8500]/20 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema CloMec'}</span>
            </button>
          </form>
        </div>

        {/* Security Policy Notice */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Ambiente exclusivo para gestão operacional da <strong className="text-slate-200">CloMec</strong>.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Cadastro público desativado por política de segurança interna.
          </p>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#071B35] border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-5 h-5 text-[#FF8500]" />
              <h3 className="font-bold text-base">Recuperar Senha</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Informe o e-mail de administrador para receber o link seguro de redefinição de senha.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail cadastrado
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF8500]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-1/2 py-2 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 text-xs font-bold transition"
                >
                  {resetLoading ? 'Enviando...' : 'Enviar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
