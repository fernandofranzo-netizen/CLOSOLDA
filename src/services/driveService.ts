import { getCachedGoogleAccessToken, signInWithGoogle } from './firebase';

export interface DriveFolderInfo {
  id: string;
  name: string;
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

/**
 * Searches for a folder by name inside a parent folder in Google Drive.
 */
export async function findDriveFolder(
  folderName: string,
  parentFolderId?: string,
  token?: string
): Promise<DriveFolderInfo | null> {
  const accessToken = token || getCachedGoogleAccessToken();
  if (!accessToken) return null;

  try {
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      console.warn('Drive folder search response:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  } catch (error) {
    console.error('Error finding Drive folder:', error);
    return null;
  }
}

/**
 * Creates a folder inside a parent folder in Google Drive.
 */
export async function createDriveFolder(
  folderName: string,
  parentFolderId?: string,
  token?: string
): Promise<DriveFolderInfo | null> {
  const accessToken = token || getCachedGoogleAccessToken();
  if (!accessToken) return null;

  try {
    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      console.warn('Drive create folder response:', res.status);
      return null;
    }

    const data = await res.json();
    return { id: data.id, name: folderName };
  } catch (error) {
    console.error('Error creating Drive folder:', error);
    return null;
  }
}

/**
 * Ensures a folder exists (finds or creates it).
 */
export async function findOrCreateFolder(
  folderName: string,
  parentFolderId?: string,
  token?: string
): Promise<DriveFolderInfo | null> {
  const existing = await findDriveFolder(folderName, parentFolderId, token);
  if (existing) return existing;
  return await createDriveFolder(folderName, parentFolderId, token);
}

/**
 * Sets up the CloSolda structured hierarchy:
 * CloSolda / Clientes / [Cliente_ID] / Projetos / [Projeto_ID] / [Etapa]
 */
export async function ensureProjectStructure(
  clientName: string,
  clientId: string,
  projectCode: string,
  projectId: string
): Promise<{
  rootFolderId?: string;
  clientFolderId?: string;
  projectFolderId?: string;
  antesFolderId?: string;
  duranteFolderId?: string;
  depoisFolderId?: string;
  relatoriosFolderId?: string;
  orcamentosFolderId?: string;
} | null> {
  const token = getCachedGoogleAccessToken();
  if (!token) return null;

  try {
    // 1. Root CloSolda folder
    const root = await findOrCreateFolder('CloSolda', undefined, token);
    if (!root) return null;

    // 2. Clientes folder
    const clientsFolder = await findOrCreateFolder('Clientes', root.id, token);
    if (!clientsFolder) return null;

    // 3. Specific Client folder
    const cleanClientName = clientName.replace(/[^a-zA-Z0-9_\- ]/g, '_').slice(0, 40);
    const clientFolder = await findOrCreateFolder(`Cliente_${cleanClientName}_${clientId.slice(0, 6)}`, clientsFolder.id, token);
    if (!clientFolder) return null;

    // 4. Projetos folder
    const projectsFolder = await findOrCreateFolder('Projetos', clientFolder.id, token);
    if (!projectsFolder) return null;

    // 5. Specific Project folder
    const projFolder = await findOrCreateFolder(`Projeto_${projectCode}_${projectId.slice(0, 6)}`, projectsFolder.id, token);
    if (!projFolder) return null;

    // 6. Subfolders: Antes, Durante, Depois, Relatorios, Orcamentos
    const antes = await findOrCreateFolder('Antes', projFolder.id, token);
    const durante = await findOrCreateFolder('Durante', projFolder.id, token);
    const depois = await findOrCreateFolder('Depois', projFolder.id, token);
    const relatorios = await findOrCreateFolder('Relatorios', projFolder.id, token);
    const orcamentos = await findOrCreateFolder('Orcamentos', projFolder.id, token);

    return {
      rootFolderId: root.id,
      clientFolderId: clientFolder.id,
      projectFolderId: projFolder.id,
      antesFolderId: antes?.id,
      duranteFolderId: durante?.id,
      depoisFolderId: depois?.id,
      relatoriosFolderId: relatorios?.id,
      orcamentosFolderId: orcamentos?.id,
    };
  } catch (error) {
    console.error('Error structuring Drive folders:', error);
    return null;
  }
}

/**
 * Uploads a file (photo or PDF) to Google Drive.
 */
export async function uploadToDrive(
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  folderId?: string,
  onProgress?: (pct: number) => void
): Promise<DriveUploadResult | null> {
  let token = getCachedGoogleAccessToken();
  if (!token) {
    console.warn('Google Drive access token not available in memory');
    return null;
  }

  try {
    if (onProgress) onProgress(20);

    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name: fileName,
      mimeType,
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    if (onProgress) onProgress(50);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    if (onProgress) onProgress(90);

    if (!res.ok) {
      console.error('Upload failed with status:', res.status);
      return null;
    }

    const data = await res.json();
    if (onProgress) onProgress(100);

    return {
      fileId: data.id,
      webViewLink: data.webViewLink,
      thumbnailLink: data.thumbnailLink,
    };
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    return null;
  }
}

/**
 * Adds an appointment event to Google Calendar.
 */
export async function syncAppointmentToGoogleCalendar(appointment: {
  tipo: string;
  clientNome: string;
  data: string; // YYYY-MM-DD
  horarioInicio: string; // HH:MM
  horarioFim?: string; // HH:MM
  endereco?: string;
  descricao?: string;
}): Promise<string | null> {
  const token = getCachedGoogleAccessToken();
  if (!token) return null;

  try {
    const startIso = `${appointment.data}T${appointment.horarioInicio}:00`;
    const endHour = appointment.horarioFim || `${parseInt(appointment.horarioInicio.split(':')[0], 10) + 1}:${appointment.horarioInicio.split(':')[1] || '00'}`;
    const endIso = `${appointment.data}T${endHour}:00`;

    const event = {
      summary: `CloSolda: ${appointment.tipo} - ${appointment.clientNome}`,
      description: appointment.descricao || `Compromisso agendado com ${appointment.clientNome} pela CloSolda.`,
      location: appointment.endereco || '',
      start: {
        dateTime: new Date(startIso).toISOString(),
      },
      end: {
        dateTime: new Date(endIso).toISOString(),
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (res.ok) {
      const data = await res.json();
      return data.id;
    }
    return null;
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    return null;
  }
}
