import { Client, Quote, TechnicalReport, Appointment } from '../types';

export function sanitizePhoneNumber(phone: string): string {
  // Extract all numbers
  const digits = phone.replace(/\D/g, '');
  // Default to Brazil country code +55 if not already prefixed
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function openWhatsAppChat(phone: string, message: string) {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(message.trim());
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function formatQuoteMessage(client: { nome: string }, quote: Quote, docLink?: string): string {
  const formattedTotal = quote.valorTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return `Olá, ${client.nome}!

Segue o orçamento *${quote.numero}* referente ao serviço solicitado à *CloMec*:

📋 *Serviço:* ${quote.descricaoServico}
💰 *Valor Total:* ${formattedTotal}
📅 *Validade:* ${quote.validade ? new Date(quote.validade).toLocaleDateString('pt-BR') : '15 dias'}
💳 *Condições:* ${quote.condicoesPagamento || 'A combinar'}
${docLink ? `\n🔗 *Acesse o PDF Oficial Online:* ${docLink}\n` : ''}
📄 *Documento Oficial em Anexo:* Segue em anexo o arquivo oficial em PDF (.PDF) contendo o detalhamento de materiais, custos, etapas e garantias CloMec.

Fico à disposição para esclarecer qualquer dúvida ou agendar o início dos trabalhos!

Atenciosamente,
*CloMec — Serviços Especializados e Metalmecânica*
Qualidade, Segurança e Compromisso`;
}

export function formatReportMessage(client: { nome: string }, report: TechnicalReport, docLink?: string): string {
  return `Olá, ${client.nome}!

Segue a notificação do *Relatório Técnico de Execução (${report.numero})* emitido pela *CloMec*:

🔍 *Objetivo:* ${report.objetivo}
🔧 *Responsável Técnico:* ${report.responsavelNome}
✅ *Situação:* ${report.situacaoFinal}
📅 *Data de Conclusão:* ${report.dataConclusao ? new Date(report.dataConclusao).toLocaleDateString('pt-BR') : 'Concluído'}
${docLink ? `\n🔗 *Acesse o Laudo em PDF Online:* ${docLink}\n` : ''}
📄 *Documento Oficial em Anexo:* Segue em anexo o Laudo Técnico completo em formato PDF (.PDF) contendo os registros fotográficos (Antes, Durante e Depois) e as especificações de soldagem.

Atenciosamente,
*CloMec — Serviços Especializados e Metalmecânica*
Qualidade, Segurança e Compromisso`;
}

export function formatAppointmentMessage(client: { nome: string }, appointment: Appointment): string {
  const formattedDate = new Date(appointment.data + 'T12:00:00').toLocaleDateString('pt-BR');
  return `Olá, ${client.nome}!

Confirmamos o seu agendamento com a *CloMec*:

📅 *Data:* ${formattedDate}
⏰ *Horário:* às ${appointment.horarioInicio}${appointment.horarioFim ? ` até ${appointment.horarioFim}` : ''}
🛠️ *Tipo:* ${appointment.tipo}
📍 *Local:* ${appointment.endereco || 'Conforme combinado'}

${appointment.descricao ? `ℹ️ *Detalhes:* ${appointment.descricao}\n` : ''}Caso precise reagendar ou tiver alguma dúvida, basta nos responder por aqui!

Atenciosamente,
*CloMec — Serviços Especializados e Metalmecânica*
Qualidade, Segurança e Compromisso`;
}

export function formatServiceCompletedMessage(client: { nome: string }, projectName: string, projectCode: string): string {
  return `Olá, ${client.nome}!

Temos a satisfação de informar que o serviço referente ao projeto *${projectCode} - ${projectName}* foi concluído com sucesso e rigoroso padrão de qualidade pela equipe *CloMec*! ⚡🛠️

Agradecemos pela confiança em nosso trabalho. Estamos à disposição para futuras demandas e manutenções.

Atenciosamente,
*CloMec — Serviços Especializados e Metalmecânica*
Qualidade, Segurança e Compromisso`;
}

export interface ShareAttachmentResult {
  sharedNatively: boolean;
  fileName: string;
}

/**
 * Shares Quote via WhatsApp with PDF attached natively on supported platforms (PWA / Mobile / WebShare).
 * On desktop or browsers without file share support, triggers download and opens WhatsApp Web.
 */
export async function shareQuoteWithPdfAttachment(
  client: { nome: string; whatsapp?: string; telefone?: string },
  quote: Quote,
  pdfFile: File,
  docLink?: string
): Promise<ShareAttachmentResult> {
  const message = formatQuoteMessage(client, quote, docLink);
  const phone = client.whatsapp || client.telefone || '';

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Orçamento Oficial ${quote.numero} - CloMec`,
        text: message,
      });
      return { sharedNatively: true, fileName: pdfFile.name };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { sharedNatively: true, fileName: pdfFile.name };
      }
      console.warn('Native share failed, falling back to WhatsApp Web URL:', error);
    }
  }

  if (phone) {
    openWhatsAppChat(phone, message);
  }
  return { sharedNatively: false, fileName: pdfFile.name };
}

/**
 * Shares Technical Report via WhatsApp with PDF attached.
 */
export async function shareReportWithPdfAttachment(
  client: { nome: string; whatsapp?: string; telefone?: string },
  report: TechnicalReport,
  pdfFile: File,
  docLink?: string
): Promise<ShareAttachmentResult> {
  const message = formatReportMessage(client, report, docLink);
  const phone = client.whatsapp || client.telefone || '';

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Laudo Técnico Oficial ${report.numero} - CloMec`,
        text: message,
      });
      return { sharedNatively: true, fileName: pdfFile.name };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { sharedNatively: true, fileName: pdfFile.name };
      }
      console.warn('Native share failed, falling back to WhatsApp Web URL:', error);
    }
  }

  if (phone) {
    openWhatsAppChat(phone, message);
  }
  return { sharedNatively: false, fileName: pdfFile.name };
}

export async function shareFileNative(file: File, title: string, text: string): Promise<boolean> {
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao compartilhar nativamente:', error);
      }
      return false;
    }
  }
  return false;
}
