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

export function formatQuoteMessage(client: { nome: string }, quote: Quote): string {
  const formattedTotal = quote.valorTotal.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return `Olá, ${client.nome}!

Segue o orçamento *${quote.numero}* referente ao serviço solicitado à *CloSolda*:

📋 *Serviço:* ${quote.descricaoServico}
💰 *Valor Total:* ${formattedTotal}
📅 *Validade:* ${quote.validade ? new Date(quote.validade).toLocaleDateString('pt-BR') : '15 dias'}
💳 *Condições:* ${quote.condicoesPagamento || 'A combinar'}

O PDF detalhado e oficial do orçamento foi gerado com todas as especificações técnicas, materiais e garantias.
Fico à disposição para esclarecer qualquer dúvida ou agendar o início dos trabalhos!

Atenciosamente,
*CloSolda — Serviços de Soldagem*
Qualidade, Segurança e Compromisso`;
}

export function formatReportMessage(client: { nome: string }, report: TechnicalReport): string {
  return `Olá, ${client.nome}!

Segue a notificação do *Relatório Técnico de Execução (${report.numero})* emitido pela *CloSolda*:

🔍 *Objetivo:* ${report.objetivo}
🔧 *Responsável Técnico:* ${report.responsavelNome}
✅ *Situação:* ${report.situacaoFinal}
📅 *Data de Conclusão:* ${report.dataConclusao ? new Date(report.dataConclusao).toLocaleDateString('pt-BR') : 'Concluído'}

O laudo técnico completo em PDF contendo registros fotográficos (Antes, Durante e Depois) e especificações foi anexado.

Atenciosamente,
*CloSolda — Serviços de Soldagem*
Qualidade, Segurança e Compromisso`;
}

export function formatAppointmentMessage(client: { nome: string }, appointment: Appointment): string {
  const formattedDate = new Date(appointment.data + 'T12:00:00').toLocaleDateString('pt-BR');
  return `Olá, ${client.nome}!

Confirmamos o seu agendamento com a *CloSolda*:

📅 *Data:* ${formattedDate}
⏰ *Horário:* às ${appointment.horarioInicio}${appointment.horarioFim ? ` até ${appointment.horarioFim}` : ''}
🛠️ *Tipo:* ${appointment.tipo}
📍 *Local:* ${appointment.endereco || 'Conforme combinado'}

${appointment.descricao ? `ℹ️ *Detalhes:* ${appointment.descricao}\n` : ''}Caso precise reagendar ou tiver alguma dúvida, basta nos responder por aqui!

Atenciosamente,
*CloSolda — Serviços de Soldagem*
Qualidade, Segurança e Compromisso`;
}

export function formatServiceCompletedMessage(client: { nome: string }, projectName: string, projectCode: string): string {
  return `Olá, ${client.nome}!

Temos a satisfação de informar que o serviço referente ao projeto *${projectCode} - ${projectName}* foi concluído com sucesso e rigoroso padrão de qualidade pela equipe *CloSolda*! ⚡🛠️

Agradecemos pela confiança em nosso trabalho. Estamos à disposição para futuras demandas e manutenções.

Atenciosamente,
*CloSolda — Serviços de Soldagem*
Qualidade, Segurança e Compromisso`;
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
