import React, { useState, useRef } from 'react';
import {
  ProjectPhoto,
  Project,
  Client,
  PhotoStage,
} from '../../types';
import {
  Camera,
  Plus,
  Image as ImageIcon,
  Upload,
  ZoomIn,
  Trash2,
  X,
  AlertTriangle,
  FolderSync,
  Cloud,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { ensureProjectStructure, uploadToDrive } from '../../services/driveService';
import { getCachedGoogleAccessToken } from '../../services/firebase';

interface PhotoGalleryModuleProps {
  photos: ProjectPhoto[];
  projects: Project[];
  clients: Client[];
  initialProjectId?: string | null;
  onCreatePhoto: (photo: Omit<ProjectPhoto, 'id'>) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
}

export const PhotoGalleryModule: React.FC<PhotoGalleryModuleProps> = ({
  photos,
  projects,
  clients,
  initialProjectId,
  onCreatePhoto,
  onDeletePhoto,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || projects[0]?.id || ''
  );
  const [stageFilter, setStageFilter] = useState<'all' | PhotoStage>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<ProjectPhoto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadStage, setUploadStage] = useState<PhotoStage>('Antes');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [driveSyncNote, setDriveSyncNote] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectClient = selectedProject
    ? clients.find((c) => c.id === selectedProject.clientId)
    : null;

  // Filter photos for current project and stage
  const projectPhotos = photos.filter((p) => {
    const matchProject = selectedProjectId ? p.projectId === selectedProjectId : true;
    if (stageFilter === 'all') return matchProject;
    return matchProject && p.etapa === stageFilter;
  });

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Create object URLs for previews
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || selectedFiles.length === 0) {
      setUploadError('Selecione ao menos uma fotografia.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      const hasDriveToken = !!getCachedGoogleAccessToken();
      let targetFolderId: string | undefined = undefined;

      if (hasDriveToken && selectedProject && projectClient) {
        setUploadProgress(25);
        const structure = await ensureProjectStructure(
          projectClient.nome,
          projectClient.id || 'cli',
          selectedProject.codigo,
          selectedProject.id || 'prj'
        );

        if (structure) {
          if (uploadStage === 'Antes') targetFolderId = structure.antesFolderId;
          else if (uploadStage === 'Durante') targetFolderId = structure.duranteFolderId;
          else if (uploadStage === 'Depois') targetFolderId = structure.depoisFolderId;
        }
      }

      setUploadProgress(40);

      // Upload each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        let driveResult = null;

        if (hasDriveToken) {
          driveResult = await uploadToDrive(
            file,
            `CloSolda_${selectedProject?.codigo || 'PRJ'}_${uploadStage}_${Date.now()}_${i + 1}.jpg`,
            file.type || 'image/jpeg',
            targetFolderId,
            (pct) => setUploadProgress(40 + Math.round((pct * 50) / 100))
          );
        }

        // Convert file to local data URL or use drive link
        const localUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Store photo record in Firestore
        await onCreatePhoto({
          projectId: selectedProjectId,
          projectCodigo: selectedProject?.codigo,
          clientId: selectedProject?.clientId || '',
          clientNome: selectedProject?.clientNome || '',
          etapa: uploadStage,
          legenda: uploadCaption || `Registro fotográfico etapa ${uploadStage}`,
          data: uploadDate,
          storageUrl: driveResult?.thumbnailLink || localUrl,
          driveFileId: driveResult?.fileId,
          driveThumbnail: driveResult?.thumbnailLink,
          createdBy: '',
          createdAt: new Date().toISOString(),
        });
      }

      setUploadProgress(100);
      setIsUploadModalOpen(false);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadCaption('');

      if (!hasDriveToken) {
        setDriveSyncNote(
          'Fotografias salvas com sucesso! Para organizar no Google Drive automaticamente, conecte a Conta Google em Configurações.'
        );
        setTimeout(() => setDriveSyncNote(null), 6000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Falha durante o envio das fotos. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Module Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-industrial flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#FF8500]" />
            Registro Fotográfico da Obra
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspeção visual estruturada por etapas: Antes do serviço, Durante a execução e Depois da conclusão.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 font-bold text-sm shadow-lg shadow-[#FF8500]/20 transition active:scale-95"
        >
          <Camera className="w-4 h-4 stroke-[2.5]" />
          <span>Fotografar / Enviar Fotos</span>
        </button>
      </div>

      {driveSyncNote && (
        <div className="p-3.5 rounded-2xl bg-[#123F70] border border-blue-400/40 text-blue-100 text-xs flex items-center gap-2">
          <Cloud className="w-4 h-4 text-[#FF8500] shrink-0" />
          <span>{driveSyncNote}</span>
        </div>
      )}

      {/* Project Selector & Stage Tabs Bar */}
      <div className="bg-[#0B213F] border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        {/* Project Dropdown */}
        <div className="w-full md:w-80">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-industrial">
            Projeto Selecionado
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 bg-[#071B35] border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#FF8500]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} - {p.nome} ({p.clientNome})
              </option>
            ))}
          </select>
        </div>

        {/* Stage Filter Tabs (Antes / Durante / Depois) */}
        <div className="flex items-center bg-[#071B35] p-1 rounded-xl border border-slate-700 text-xs font-bold w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStageFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              stageFilter === 'all' ? 'bg-[#FF8500] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({photos.filter((p) => p.projectId === selectedProjectId).length})
          </button>
          <button
            onClick={() => setStageFilter('Antes')}
            className={`px-3 py-1.5 rounded-lg transition ${
              stageFilter === 'Antes' ? 'bg-[#FF8500] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Antes
          </button>
          <button
            onClick={() => setStageFilter('Durante')}
            className={`px-3 py-1.5 rounded-lg transition ${
              stageFilter === 'Durante' ? 'bg-[#FF8500] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Durante
          </button>
          <button
            onClick={() => setStageFilter('Depois')}
            className={`px-3 py-1.5 rounded-lg transition ${
              stageFilter === 'Depois' ? 'bg-[#FF8500] text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Depois
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {projectPhotos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0B213F] border border-slate-700/80">
          <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhuma fotografia nesta etapa</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Utilize a câmera do celular ou selecione fotos da galeria para documentar as condições da solda.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123F70] hover:bg-[#1A528F] text-xs font-bold text-white transition"
          >
            <Camera className="w-4 h-4" />
            Adicionar Fotografias
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {projectPhotos.map((photo) => {
            const stageBadgeColor =
              photo.etapa === 'Antes'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                : photo.etapa === 'Durante'
                ? 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';

            return (
              <div
                key={photo.id}
                className="group relative rounded-2xl bg-[#0B213F] border border-slate-700/80 hover:border-[#FF8500]/50 overflow-hidden shadow-md flex flex-col justify-between"
              >
                {/* Photo Image container */}
                <div
                  onClick={() => setEnlargedPhoto(photo)}
                  className="relative aspect-square w-full bg-[#071B35] cursor-pointer overflow-hidden"
                >
                  <img
                    src={photo.storageUrl}
                    alt={photo.legenda}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <ZoomIn className="w-6 h-6 drop-shadow-md" />
                  </div>
                  <span
                    className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md ${stageBadgeColor}`}
                  >
                    {photo.etapa}
                  </span>
                </div>

                {/* Caption & Date */}
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                    {photo.legenda || 'Sem legenda'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    <span className="font-mono-code">{new Date(photo.data).toLocaleDateString('pt-BR')}</span>
                    <button
                      onClick={() => setDeleteConfirmId(photo.id || null)}
                      title="Excluir fotografia"
                      className="text-slate-400 hover:text-rose-400 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ENLARGE PHOTO MODAL */}
      {enlargedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="max-w-3xl w-full rounded-3xl bg-[#071B35] border border-slate-700 overflow-hidden shadow-2xl">
            <div className="p-4 bg-[#0B213F] flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#FF8500] text-slate-950 uppercase font-industrial">
                  {enlargedPhoto.etapa}
                </span>
                <span className="text-xs text-slate-300 font-mono-code">
                  Data: {new Date(enlargedPhoto.data).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/80 flex items-center justify-center max-h-[65vh] p-2">
              <img
                src={enlargedPhoto.storageUrl}
                alt={enlargedPhoto.legenda}
                className="max-h-[60vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="p-4 bg-[#071B35]">
              <p className="text-sm font-semibold text-white">
                {enlargedPhoto.legenda}
              </p>
              {enlargedPhoto.driveFileId && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono-code">
                  <Cloud className="w-3 h-3" />
                  Armazenado no Google Drive (ID: {enlargedPhoto.driveFileId.slice(0, 12)}...)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD / CAMERA MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-[#071B35] border border-slate-700 shadow-2xl p-6 my-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#FF8500]" />
                <h2 className="text-lg font-bold font-industrial">
                  Registrar Fotografias da Obra
                </h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
                  {uploadError}
                </div>
              )}

              {/* Projeto */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Projeto *
                </label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Etapa do Serviço */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                  Etapa do Registro *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Antes', 'Durante', 'Depois'] as PhotoStage[]).map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setUploadStage(stage)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        uploadStage === stage
                          ? 'bg-[#FF8500] text-slate-950 border-[#FF8500]'
                          : 'bg-[#0B213F] text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera or File Gallery Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-industrial">
                  Captura ou Seleção de Imagens *
                </label>

                {/* Hidden input for Camera */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />

                {/* Hidden input for Gallery Multiple */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0B213F] hover:bg-[#123F70] border border-slate-700 text-slate-200 transition"
                  >
                    <Camera className="w-6 h-6 text-[#FF8500] mb-1.5" />
                    <span className="text-xs font-bold">Abrir Câmera</span>
                    <span className="text-[10px] text-slate-400">Tirar foto agora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0B213F] hover:bg-[#123F70] border border-slate-700 text-slate-200 transition"
                  >
                    <Upload className="w-6 h-6 text-blue-400 mb-1.5" />
                    <span className="text-xs font-bold">Galeria / Arquivos</span>
                    <span className="text-[10px] text-slate-400">Selecionar várias</span>
                  </button>
                </div>
              </div>

              {/* Previews */}
              {previewUrls.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                    {previewUrls.length} foto(s) selecionada(s):
                  </span>
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700">
                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(idx)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-600 text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legenda & Data */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Legenda Técnica
                  </label>
                  <input
                    type="text"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Ex: Cordão de solda MIG 100% penetrado sem porosidades"
                    className="w-full px-3 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-industrial">
                    Data
                  </label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full px-2 py-2 bg-[#0B213F] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF8500]"
                  />
                </div>
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Enviando e estruturando no Google Drive...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#FF8500] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading || selectedFiles.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#FF8500] hover:bg-[#E67600] text-slate-950 text-xs font-bold shadow-md transition disabled:opacity-60"
                >
                  {isUploading ? 'Processando...' : 'Salvar Fotografias'}
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
              <h3 className="text-base font-bold">Excluir Fotografia</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja realmente remover esta fotografia técnica da galeria do projeto?
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
                  await onDeletePhoto(deleteConfirmId);
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
