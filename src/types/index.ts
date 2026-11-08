export type AppointmentType =
  | 'Visita técnica'
  | 'Elaboração de orçamento'
  | 'Execução de soldagem'
  | 'Manutenção'
  | 'Entrega de serviço'
  | 'Retorno ao cliente';

export type AppointmentStatus =
  | 'Pendente'
  | 'Confirmado'
  | 'Em andamento'
  | 'Concluído'
  | 'Cancelado';

export type QuoteStatus =
  | 'Rascunho'
  | 'Enviado'
  | 'Aguardando aprovação'
  | 'Aprovado'
  | 'Reprovado'
  | 'Expirado';

export type ItemCategory =
  | 'Mão de obra'
  | 'Materiais'
  | 'Consumíveis de soldagem'
  | 'Deslocamento'
  | 'Equipamentos'
  | 'Serviços terceirizados'
  | 'Outros custos';

export type ServiceType =
  | 'Soldagem MIG/MAG'
  | 'Soldagem TIG'
  | 'Soldagem eletrodo revestido'
  | 'Fabricação de estruturas metálicas'
  | 'Portões e grades'
  | 'Corrimãos e guarda-corpos'
  | 'Reparos e manutenção'
  | 'Soldagem de tubulações'
  | 'Serviços industriais'
  | 'Serviços residenciais'
  | 'Outros';

export type ProjectStatus =
  | 'Aguardando início'
  | 'Em execução'
  | 'Pausado'
  | 'Concluído'
  | 'Entregue';

export type PhotoStage = 'Antes' | 'Durante' | 'Depois';

export type ReportStatus = 'Em elaboração' | 'Finalizado';

export type DocumentType =
  | 'Orçamento'
  | 'Relatório técnico'
  | 'Fotografia'
  | 'Documento comercial'
  | 'Outro';

export interface Client {
  id?: string;
  nome: string;
  cpfCnpj?: string;
  telefone: string;
  whatsapp: string;
  email?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  complemento?: string;
  observacoes?: string;
  driveFolderId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Appointment {
  id?: string;
  clientId: string;
  clientNome: string;
  tipo: AppointmentType;
  data: string; // YYYY-MM-DD
  horarioInicio: string; // HH:MM
  horarioFim?: string; // HH:MM
  endereco?: string;
  descricao?: string;
  observacoes?: string;
  status: AppointmentStatus;
  googleEventId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface QuoteItem {
  id?: string;
  quoteId: string;
  descricao: string;
  categoria: ItemCategory;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  createdBy?: string;
  createdAt?: string;
}

export interface Quote {
  id?: string;
  numero: string; // ORC-2026-001
  clientId: string;
  clientNome: string;
  clientTelefone?: string;
  clientWhatsapp?: string;
  clientEndereco?: string;
  dataEmissao: string;
  validade: string;
  descricaoServico: string;
  localExecucao?: string;
  prazoEstimado?: string;
  condicoesPagamento?: string;
  itens: QuoteItem[];
  subtotal: number;
  desconto: number;
  acrescimo: number;
  valorTotal: number;
  status: QuoteStatus;
  aprovadoEm?: string;
  observacoesAprovacao?: string;
  observacoesComerciais?: string;
  drivePdfId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id?: string;
  codigo: string; // PRJ-2026-001
  clientId: string;
  clientNome: string;
  quoteId?: string;
  quoteNumero?: string;
  nome: string;
  tipoServico: ServiceType;
  enderecoExecucao?: string;
  dataInicio?: string;
  previsaoConclusao?: string;
  dataConclusao?: string;
  descricao: string;
  materiais?: string;
  equipamentos?: string;
  observacoes?: string;
  status: ProjectStatus;
  driveFolderId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectPhoto {
  id?: string;
  projectId: string;
  projectCodigo?: string;
  clientId: string;
  clientNome?: string;
  etapa: PhotoStage;
  legenda: string;
  data: string;
  storageUrl: string; // base64 / blob / local URL
  driveFileId?: string;
  driveThumbnail?: string;
  createdBy: string;
  createdAt: string;
}

export interface TechnicalReport {
  id?: string;
  numero: string; // REL-2026-001
  projectId: string;
  projectCodigo?: string;
  clientId: string;
  clientNome: string;
  data: string;
  localExecucao: string;
  objetivo: string;
  situacaoEncontrada: string;
  atividades: string;
  procedimentos: string;
  materiais: string;
  equipamentos: string;
  observacoes?: string;
  pendencias?: string;
  recomendacoes?: string;
  situacaoFinal: string;
  dataConclusao?: string;
  responsavelNome: string;
  responsavelCargo?: string;
  assinaturaResponsavel?: string;
  drivePdfId?: string;
  status: ReportStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DocumentRecord {
  id?: string;
  clientId: string;
  clientNome: string;
  projectId?: string;
  projectCodigo?: string;
  tipo: DocumentType;
  titulo: string;
  numeroRef?: string;
  data: string;
  driveFileId?: string;
  driveViewUrl?: string;
  downloadUrl?: string;
  fileSize?: string;
  createdBy: string;
  createdAt: string;
}

export interface CompanySettings {
  id?: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  chavePix: string;
  tipoPix: string;
  dadosBancarios: string;
  responsavelNome: string;
  responsavelCargo: string;
  condicoesPadrao: string;
  validadePadraoDias: number;
  proximoNumeroOrcamento: number;
  proximoNumeroRelatorio: number;
  proximoCodigoProjeto: number;
  driveFolderPrincipalId?: string;
  driveAccountConnected?: boolean;
  calendarAccountConnected?: boolean;
  createdBy: string;
  updatedAt?: string;
}
