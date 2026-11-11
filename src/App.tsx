import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import {
  DesktopSidebar,
  MobileBottomNav,
  TabId,
  navigationItems,
} from './components/common/Navigation';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DashboardView } from './components/dashboard/DashboardView';
import { ClientsModule } from './components/clients/ClientsModule';
import { AgendaModule } from './components/agenda/AgendaModule';
import { QuotesModule } from './components/quotes/QuotesModule';
import { ProjectsModule } from './components/projects/ProjectsModule';
import { PhotoGalleryModule } from './components/photos/PhotoGalleryModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { DocumentsModule } from './components/documents/DocumentsModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { BrandLogo } from './components/common/BrandLogo';

import {
  Client,
  Appointment,
  Quote,
  Project,
  ProjectPhoto,
  TechnicalReport,
  DocumentRecord,
  CompanySettings,
} from './types';

import {
  subscribeClients,
  createClient,
  updateClient,
  deleteClient,
  subscribeAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  subscribeQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  subscribeProjects,
  createProject,
  updateProject,
  deleteProject,
  subscribeProjectPhotos,
  createProjectPhoto,
  deleteProjectPhoto,
  subscribeReports,
  createReport,
  updateReport,
  deleteReport,
  subscribeDocuments,
  createDocumentRecord,
  deleteDocumentRecord,
  getCompanySettings,
  saveCompanySettings,
} from './services/dataService';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');

  // Real-time Firestore state
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [reports, setReports] = useState<TechnicalReport[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  // Shortcut cross-modal states
  const [initialClientForQuote, setInitialClientForQuote] = useState<Client | null>(null);
  const [initialProjectIdForPhoto, setInitialProjectIdForPhoto] = useState<string | null>(null);
  const [initialProjectIdForReport, setInitialProjectIdForReport] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setAppointments([]);
      setQuotes([]);
      setProjects([]);
      setPhotos([]);
      setReports([]);
      setDocuments([]);
      setSettings(null);
      return;
    }

    const uid = user.uid;

    // Load company settings
    getCompanySettings(uid).then((res) => {
      if (res) setSettings(res);
    });

    // Subscriptions
    const unsubClients = subscribeClients(uid, setClients);
    const unsubAppts = subscribeAppointments(uid, setAppointments);
    const unsubQuotes = subscribeQuotes(uid, setQuotes);
    const unsubProjects = subscribeProjects(uid, setProjects);
    const unsubPhotos = subscribeProjectPhotos(uid, null, setPhotos);
    const unsubReports = subscribeReports(uid, setReports);
    const unsubDocs = subscribeDocuments(uid, setDocuments);

    return () => {
      unsubClients();
      unsubAppts();
      unsubQuotes();
      unsubProjects();
      unsubPhotos();
      unsubReports();
      unsubDocs();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071B35] flex flex-col items-center justify-center p-4">
        <BrandLogo size="xl" showSlogan={true} className="animate-pulse" />
        <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#FF8500] font-industrial uppercase tracking-widest">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF8500] animate-ping" />
          <span>Iniciando Sistema CloMec...</span>
        </div>
      </div>
    );
  }

  const activeUserId = user?.uid || 'clomec-admin-user';

  // Badges for navigation
  const todayStr = new Date().toISOString().split('T')[0];
  const appointmentsToday = appointments.filter((a) => a.data === todayStr && a.status !== 'Cancelado').length;
  const quotesAwaiting = quotes.filter((q) => q.status === 'Aguardando aprovação').length;
  const projectsRunning = projects.filter((p) => p.status === 'Em execução').length;

  const currentTabItem = navigationItems.find((n) => n.id === currentTab);

  // Quick Action handler from Dashboard
  const handleDashboardQuickAction = (
    action: 'client' | 'appointment' | 'quote' | 'project' | 'report' | 'photo'
  ) => {
    if (action === 'client') setCurrentTab('clients');
    if (action === 'appointment') setCurrentTab('agenda');
    if (action === 'quote') setCurrentTab('quotes');
    if (action === 'project') setCurrentTab('projects');
    if (action === 'photo') setCurrentTab('photos');
    if (action === 'report') setCurrentTab('reports');
  };

  const handleNavigateToPhotos = (projectId: string) => {
    setInitialProjectIdForPhoto(projectId);
    setCurrentTab('photos');
  };

  const handleNavigateToReports = (projectId: string) => {
    setInitialProjectIdForReport(projectId);
    setCurrentTab('reports');
  };

  const handleOpenQuoteForClient = (client: Client) => {
    setInitialClientForQuote(client);
    setCurrentTab('quotes');
  };

  return (
    <div className="min-h-screen bg-[#071B35] text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header activeTabTitle={currentTabItem?.label} />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <DesktopSidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          badges={{
            appointmentsToday,
            quotesAwaiting,
            projectsRunning,
          }}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              clients={clients}
              quotes={quotes}
              appointments={appointments}
              projects={projects}
              onNavigate={setCurrentTab}
              onOpenModal={handleDashboardQuickAction}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsModule
              clients={clients}
              quotes={quotes}
              projects={projects}
              reports={reports}
              photos={photos}
              onCreateClient={async (c) => {
                await createClient({ ...c, createdBy: activeUserId });
              }}
              onUpdateClient={updateClient}
              onDeleteClient={deleteClient}
              onOpenQuoteModalForClient={handleOpenQuoteForClient}
            />
          )}

          {currentTab === 'agenda' && (
            <AgendaModule
              appointments={appointments}
              clients={clients}
              onCreateAppointment={async (a) => {
                await createAppointment({ ...a, createdBy: activeUserId });
              }}
              onUpdateAppointment={updateAppointment}
              onDeleteAppointment={deleteAppointment}
            />
          )}

          {currentTab === 'quotes' && (
            <QuotesModule
              quotes={quotes}
              clients={clients}
              settings={settings || undefined}
              initialClientForQuote={initialClientForQuote}
              onClearInitialClient={() => setInitialClientForQuote(null)}
              onCreateQuote={async (q) => {
                await createQuote({ ...q, createdBy: activeUserId });
              }}
              onUpdateQuote={updateQuote}
              onDeleteQuote={deleteQuote}
              onRegisterDocument={async (d) => {
                await createDocumentRecord({ ...d, createdBy: activeUserId });
              }}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsModule
              projects={projects}
              clients={clients}
              quotes={quotes}
              onCreateProject={async (p) => {
                await createProject({ ...p, createdBy: activeUserId });
              }}
              onUpdateProject={updateProject}
              onDeleteProject={deleteProject}
              onNavigateToPhotos={handleNavigateToPhotos}
              onNavigateToReports={handleNavigateToReports}
            />
          )}

          {currentTab === 'photos' && (
            <PhotoGalleryModule
              photos={photos}
              projects={projects}
              clients={clients}
              initialProjectId={initialProjectIdForPhoto}
              onCreatePhoto={async (ph) => {
                await createProjectPhoto({ ...ph, createdBy: activeUserId });
              }}
              onDeletePhoto={deleteProjectPhoto}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsModule
              reports={reports}
              projects={projects}
              clients={clients}
              photos={photos}
              settings={settings || undefined}
              initialProjectIdForReport={initialProjectIdForReport}
              onCreateReport={async (r) => {
                await createReport({ ...r, createdBy: activeUserId });
              }}
              onUpdateReport={updateReport}
              onDeleteReport={deleteReport}
              onRegisterDocument={async (d) => {
                await createDocumentRecord({ ...d, createdBy: activeUserId });
              }}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentsModule
              documents={documents}
              clients={clients}
              projects={projects}
              onDeleteDocument={deleteDocumentRecord}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsModule
              settings={settings}
              onSaveSettings={async (newSettings) => {
                await saveCompanySettings(activeUserId, newSettings);
                setSettings((prev) => ({ ...(prev || ({} as CompanySettings)), ...newSettings } as CompanySettings));
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        badges={{
          appointmentsToday,
          quotesAwaiting,
          projectsRunning,
        }}
      />

      {/* Connectivity Status Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
