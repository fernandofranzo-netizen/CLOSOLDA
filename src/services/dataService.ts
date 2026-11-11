import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Client,
  Appointment,
  Quote,
  Project,
  ProjectPhoto,
  TechnicalReport,
  DocumentRecord,
  CompanySettings,
} from '../types';

// ==========================================
// CLIENTS
// ==========================================
export const subscribeClients = (
  _userId: string,
  onData: (clients: Client[]) => void
) => {
  const colRef = collection(db, 'clients');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Client[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Client, 'id'>) });
      });
      // Sort alphabetically by name
      list.sort((a, b) => a.nome.localeCompare(b.nome));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    }
  );
};

export const createClient = async (clientData: Omit<Client, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...clientData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'clients');
  }
};

export const updateClient = async (id: string, clientData: Partial<Client>): Promise<void> => {
  try {
    const docRef = doc(db, 'clients', id);
    await updateDoc(docRef, {
      ...clientData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
  }
};

// ==========================================
// APPOINTMENTS
// ==========================================
export const subscribeAppointments = (
  _userId: string,
  onData: (appointments: Appointment[]) => void
) => {
  const colRef = collection(db, 'appointments');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Appointment, 'id'>) });
      });
      // Sort by date and time
      list.sort((a, b) => `${a.data}T${a.horarioInicio}`.localeCompare(`${b.data}T${b.horarioInicio}`));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    }
  );
};

export const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'appointments');
  }
};

export const updateAppointment = async (id: string, data: Partial<Appointment>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'appointments', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
  }
};

export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'appointments', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
  }
};

// ==========================================
// QUOTES (ORÇAMENTOS)
// ==========================================
export const subscribeQuotes = (
  _userId: string,
  onData: (quotes: Quote[]) => void
) => {
  const colRef = collection(db, 'quotes');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Quote[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Quote, 'id'>) });
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quotes');
    }
  );
};

export const createQuote = async (quoteData: Omit<Quote, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'quotes'), {
      ...quoteData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'quotes');
  }
};

export const updateQuote = async (id: string, quoteData: Partial<Quote>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'quotes', id), {
      ...quoteData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `quotes/${id}`);
  }
};

export const deleteQuote = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'quotes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `quotes/${id}`);
  }
};

// ==========================================
// PROJECTS
// ==========================================
export const subscribeProjects = (
  _userId: string,
  onData: (projects: Project[]) => void
) => {
  const colRef = collection(db, 'projects');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Project, 'id'>) });
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    }
  );
};

export const createProject = async (projectData: Omit<Project, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'projects');
  }
};

export const updateProject = async (id: string, projectData: Partial<Project>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'projects', id), {
      ...projectData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
  }
};

// ==========================================
// PROJECT PHOTOS
// ==========================================
export const subscribeProjectPhotos = (
  _userId: string,
  projectId: string | null,
  onData: (photos: ProjectPhoto[]) => void
) => {
  const colRef = collection(db, 'project_photos');
  const q = projectId
    ? query(colRef, where('projectId', '==', projectId))
    : query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ProjectPhoto[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ProjectPhoto, 'id'>) });
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'project_photos');
    }
  );
};

export const createProjectPhoto = async (photoData: Omit<ProjectPhoto, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'project_photos'), {
      ...photoData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'project_photos');
  }
};

export const deleteProjectPhoto = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'project_photos', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `project_photos/${id}`);
  }
};

// ==========================================
// TECHNICAL REPORTS
// ==========================================
export const subscribeReports = (
  _userId: string,
  onData: (reports: TechnicalReport[]) => void
) => {
  const colRef = collection(db, 'reports');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: TechnicalReport[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<TechnicalReport, 'id'>) });
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    }
  );
};

export const createReport = async (reportData: Omit<TechnicalReport, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      ...reportData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reports');
  }
};

export const updateReport = async (id: string, reportData: Partial<TechnicalReport>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'reports', id), {
      ...reportData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${id}`);
  }
};

export const deleteReport = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'reports', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
  }
};

// ==========================================
// DOCUMENTS
// ==========================================
export const subscribeDocuments = (
  _userId: string,
  onData: (docs: DocumentRecord[]) => void
) => {
  const colRef = collection(db, 'documents');
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: DocumentRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<DocumentRecord, 'id'>) });
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    }
  );
};

export const createDocumentRecord = async (docData: Omit<DocumentRecord, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'documents'), {
      ...docData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'documents');
  }
};

export const deleteDocumentRecord = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'documents', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
  }
};

// ==========================================
// COMPANY SETTINGS
// ==========================================
export const getCompanySettings = async (userId: string): Promise<CompanySettings | null> => {
  try {
    // Try global clomec-company first, then fallback to userId or any settings doc
    let docSnap = await getDoc(doc(db, 'settings', 'clomec-company'));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<CompanySettings, 'id'>) };
    }
    if (userId) {
      docSnap = await getDoc(doc(db, 'settings', userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...(docSnap.data() as Omit<CompanySettings, 'id'>) };
      }
    }
    // Also try getting the first settings doc in collection
    const querySnap = await getDocs(collection(db, 'settings'));
    if (!querySnap.empty) {
      const first = querySnap.docs[0];
      return { id: first.id, ...(first.data() as Omit<CompanySettings, 'id'>) };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `settings/${userId}`);
  }
};

export const saveCompanySettings = async (
  userId: string,
  settings: Partial<CompanySettings>
): Promise<void> => {
  try {
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'settings', 'clomec-company'), payload, { merge: true });
    if (userId) {
      await setDoc(doc(db, 'settings', userId), payload, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `settings/${userId}`);
  }
};
