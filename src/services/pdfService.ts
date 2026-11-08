import { jsPDF } from 'jspdf';
import { Quote, TechnicalReport, CompanySettings, ProjectPhoto } from '../types';

export function generateQuotePDF(quote: Quote, settings?: Partial<CompanySettings>): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Header Banner Background: CloSolda Navy #071B35
  doc.setFillColor(7, 27, 53);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Orange accent stripe
  doc.setFillColor(255, 133, 0);
  doc.rect(0, 38, pageWidth, 2.5, 'F');

  // Header Brand CloSolda
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CLO', margin, 20);
  doc.setTextColor(255, 133, 0);
  doc.text('SOLDA', margin + 17, 20);

  doc.setFontSize(8.5);
  doc.setTextColor(174, 184, 196);
  doc.setFont('helvetica', 'normal');
  doc.text('QUALIDADE • SEGURANÇA • COMPROMISSO', margin, 26);
  doc.text('Serviços de Soldagem Industrial e Residencial', margin, 31);

  // Quote Number & Date (Header Right)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`PROPOSTA COMERCIAL`, pageWidth - margin, 18, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(255, 133, 0);
  doc.text(quote.numero, pageWidth - margin, 25, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setTextColor(200, 210, 220);
  doc.setFont('helvetica', 'normal');
  const emissionStr = quote.dataEmissao ? new Date(quote.dataEmissao).toLocaleDateString('pt-BR') : '';
  const validityStr = quote.validade ? new Date(quote.validade).toLocaleDateString('pt-BR') : '15 dias';
  doc.text(`Emissão: ${emissionStr} | Validade: ${validityStr}`, pageWidth - margin, 31, { align: 'right' });

  y = 47;

  // Company and Client Info Cards
  const colWidth = (pageWidth - margin * 2 - 6) / 2;

  // Left Card: Company Data
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 34, 2, 2, 'FD');
  doc.setFillColor(7, 27, 53);
  doc.rect(margin, y, colWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DADOS DO PRESTADOR', margin + 3, y + 4.5);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const compName = settings?.nomeFantasia || 'CloSolda — Serviços de Soldagem';
  const compDoc = settings?.cnpjCpf ? `CNPJ/CPF: ${settings.cnpjCpf}` : 'Prestação de Serviços Especializados';
  const compPhone = settings?.telefone || settings?.whatsapp || '(00) 00000-0000';
  const compEmail = settings?.email || 'contato@closolda.com.br';
  const compCity = settings?.cidade ? `${settings.cidade} - ${settings.estado || 'BR'}` : 'Brasil';
  doc.text(compName, margin + 3, y + 11);
  doc.text(compDoc, margin + 3, y + 16);
  doc.text(`Contato: ${compPhone}`, margin + 3, y + 21);
  doc.text(`Email: ${compEmail}`, margin + 3, y + 26);
  doc.text(`Local: ${compCity}`, margin + 3, y + 31);

  // Right Card: Client Data
  const rightX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, colWidth, 34, 2, 2, 'FD');
  doc.setFillColor(18, 63, 112);
  doc.rect(rightX, y, colWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DADOS DO CLIENTE', rightX + 3, y + 4.5);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Cliente: ${quote.clientNome}`, rightX + 3, y + 11);
  doc.text(`Telefone/WhatsApp: ${quote.clientTelefone || quote.clientWhatsapp || 'Não informado'}`, rightX + 3, y + 16);
  doc.text(`Local de Execução: ${quote.localExecucao || quote.clientEndereco || 'No endereço do cliente'}`, rightX + 3, y + 21);
  doc.text(`Prazo Estimado: ${quote.prazoEstimado || 'A combinar com o cliente'}`, rightX + 3, y + 26);
  doc.text(`Status: ${quote.status}`, rightX + 3, y + 31);

  y += 39;

  // Service Description Section
  doc.setFillColor(7, 27, 53);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DESCRIÇÃO DO SERVIÇO SOLICITADO', margin + 3, y + 4.5);

  y += 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  const descHeight = 16;
  doc.rect(margin, y, pageWidth - margin * 2, descHeight, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const descLines = doc.splitTextToSize(quote.descricaoServico, pageWidth - margin * 2 - 6);
  doc.text(descLines.slice(0, 3), margin + 3, y + 5);

  y += descHeight + 5;

  // Table of Items
  doc.setFillColor(7, 27, 53);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ITENS E COMPOSIÇÃO DE CUSTOS', margin + 3, y + 5);

  y += 7;
  // Table Header
  const colCat = 32;
  const colDesc = 82;
  const colQtd = 16;
  const colUnit = 16;
  const colValUnit = 24;
  const colValTotal = 24;

  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  let curX = margin + 2;
  doc.text('Categoria', curX, y + 4.2); curX += colCat;
  doc.text('Descrição', curX, y + 4.2); curX += colDesc;
  doc.text('Qtd', curX, y + 4.2, { align: 'center' }); curX += colQtd;
  doc.text('Unid.', curX, y + 4.2, { align: 'center' }); curX += colUnit;
  doc.text('Valor Unit.', curX + colValUnit - 2, y + 4.2, { align: 'right' }); curX += colValUnit;
  doc.text('Total', curX + colValTotal - 2, y + 4.2, { align: 'right' });

  y += 6;

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const items = quote.itens || [];

  if (items.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum item discriminado no orçamento.', margin + 3, y + 5.5);
    y += 8;
  } else {
    items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'FD');

      doc.setTextColor(51, 65, 85);
      let rowX = margin + 2;
      doc.text(doc.splitTextToSize(item.categoria, colCat - 2)[0] || '', rowX, y + 4.5);
      rowX += colCat;

      const descSnippet = doc.splitTextToSize(item.descricao, colDesc - 2)[0] || '';
      doc.text(descSnippet, rowX, y + 4.5);
      rowX += colDesc;

      doc.text(String(item.quantidade), rowX + colQtd / 2, y + 4.5, { align: 'center' });
      rowX += colQtd;

      doc.text(item.unidade || 'un', rowX + colUnit / 2, y + 4.5, { align: 'center' });
      rowX += colUnit;

      const vuFormatted = item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      doc.text(`R$ ${vuFormatted}`, rowX + colValUnit - 2, y + 4.5, { align: 'right' });
      rowX += colValUnit;

      const vtFormatted = item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${vtFormatted}`, rowX + colValTotal - 2, y + 4.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += 6.5;
    });
  }

  // Totals Box (Right aligned)
  y += 2;
  const totalsBoxWidth = 85;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsBoxX, y, totalsBoxWidth, 24, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', totalsBoxX + 4, y + 5);
  doc.text(`R$ ${quote.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, totalsBoxX + totalsBoxWidth - 4, y + 5, { align: 'right' });

  if (quote.desconto > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text('Desconto:', totalsBoxX + 4, y + 10);
    doc.text(`- R$ ${quote.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, totalsBoxX + totalsBoxWidth - 4, y + 10, { align: 'right' });
  }

  if (quote.acrescimo > 0) {
    doc.setTextColor(180, 83, 9);
    doc.text('Acréscimos/Taxas:', totalsBoxX + 4, y + 15);
    doc.text(`+ R$ ${quote.acrescimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, totalsBoxX + totalsBoxWidth - 4, y + 15, { align: 'right' });
  }

  // Final Total Bar inside totals box
  doc.setFillColor(7, 27, 53);
  doc.rect(totalsBoxX, y + 16.5, totalsBoxWidth, 7.5, 'F');
  doc.setTextColor(255, 133, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('VALOR TOTAL:', totalsBoxX + 4, y + 21.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`R$ ${quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, totalsBoxX + totalsBoxWidth - 4, y + 21.5, { align: 'right' });

  // Payment Terms & Notes (Left side of totals)
  const payTermsWidth = totalsBoxX - margin - 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, payTermsWidth, 24, 1.5, 1.5, 'FD');
  doc.setTextColor(7, 27, 53);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CONDIÇÕES DE PAGAMENTO E OBSERVAÇÕES:', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  const payText = quote.condicoesPagamento || settings?.condicoesPadrao || '50% de entrada no início e saldo na conclusão do serviço.';
  const payLines = doc.splitTextToSize(payText, payTermsWidth - 6);
  doc.text(payLines.slice(0, 4), margin + 3, y + 9);

  if (settings?.chavePix) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 63, 112);
    doc.text(`Chave PIX (${settings.tipoPix || 'Chave'}): ${settings.chavePix}`, margin + 3, y + 21);
  }

  y += 29;

  // Commercial Approval Block & Signatures
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 2, 2, 'FD');

  doc.setTextColor(7, 27, 53);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TERMO DE APROVAÇÃO DO CLIENTE E EMISSÃO TÉCNICA', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Ao aprovar este orçamento, o cliente concorda com os serviços discriminados, prazos estimados e condições de pagamento acordadas.', margin + 4, y + 9.5);

  // Signatures Lines
  const sigY = y + 26;
  const sigColWidth = (pageWidth - margin * 2 - 20) / 2;

  // Prestador signature
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 6, sigY, margin + 6 + sigColWidth, sigY);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  const respName = settings?.responsavelNome || 'CloSolda Serviços Técnicos';
  doc.text(respName, margin + 6 + sigColWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Responsável Técnico / CloSolda', margin + 6 + sigColWidth / 2, sigY + 8, { align: 'center' });

  // Cliente signature
  const clientSigX = margin + 14 + sigColWidth;
  doc.setDrawColor(148, 163, 184);
  doc.line(clientSigX, sigY, clientSigX + sigColWidth, sigY);
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.clientNome, clientSigX + sigColWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura do Cliente / Data de Aprovação', clientSigX + sigColWidth / 2, sigY + 8, { align: 'center' });

  // Footer Stripe
  doc.setFillColor(7, 27, 53);
  doc.rect(0, pageHeight - 9, pageWidth, 9, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CloSolda • Soluções em Soldagem Industrial e Residencial • Qualidade, Segurança e Compromisso', pageWidth / 2, pageHeight - 3.5, { align: 'center' });

  return doc;
}

export function generateReportPDF(
  report: TechnicalReport,
  photos?: ProjectPhoto[],
  settings?: Partial<CompanySettings>
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Header Banner Background: CloSolda Navy #071B35
  doc.setFillColor(7, 27, 53);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Orange accent stripe
  doc.setFillColor(255, 133, 0);
  doc.rect(0, 38, pageWidth, 2.5, 'F');

  // Header Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('CLO', margin, 20);
  doc.setTextColor(255, 133, 0);
  doc.text('SOLDA', margin + 17, 20);

  doc.setFontSize(8.5);
  doc.setTextColor(174, 184, 196);
  doc.setFont('helvetica', 'normal');
  doc.text('RELATÓRIO TÉCNICO DE EXECUÇÃO E QUALIDADE', margin, 26);
  doc.text('Soldagem Industrial e Estrutural • Inspeção e Laudo', margin, 31);

  // Report Number & Date
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LAUDO TÉCNICO', pageWidth - margin, 18, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(255, 133, 0);
  doc.text(report.numero, pageWidth - margin, 25, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 220);
  doc.setFont('helvetica', 'normal');
  const reportDateStr = report.data ? new Date(report.data).toLocaleDateString('pt-BR') : '';
  doc.text(`Data: ${reportDateStr} | Projeto: ${report.projectCodigo || 'PRJ-ESP'}`, pageWidth - margin, 31, { align: 'right' });

  y = 47;

  // Identification Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 2, 2, 'FD');
  doc.setFillColor(7, 27, 53);
  doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('1. IDENTIFICAÇÃO DO SERVIÇO E DO CLIENTE', margin + 3, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const leftIdX = margin + 3;
  const rightIdX = margin + (pageWidth - margin * 2) / 2 + 2;

  doc.text(`Cliente: ${report.clientNome}`, leftIdX, y + 10);
  doc.text(`Local de Execução: ${report.localExecucao}`, leftIdX, y + 15);
  doc.text(`Status do Laudo: ${report.status}`, leftIdX, y + 20);

  doc.text(`Responsável Técnico: ${report.responsavelNome}`, rightIdX, y + 10);
  doc.text(`Conclusão: ${report.dataConclusao ? new Date(report.dataConclusao).toLocaleDateString('pt-BR') : 'Finalizado'}`, rightIdX, y + 15);
  doc.text(`Prestador: ${settings?.nomeFantasia || 'CloSolda'}`, rightIdX, y + 20);

  y += 29;

  // Section 2: Technical Description & Diagnostics
  const drawSection = (title: string, content: string, height: number = 18) => {
    doc.setFillColor(18, 63, 112);
    doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(title, margin + 3, y + 4.2);

    y += 5.5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageWidth - margin * 2, height, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(content || 'Não aplicável.', pageWidth - margin * 2 - 6);
    doc.text(lines.slice(0, 4), margin + 3, y + 4.5);

    y += height + 3.5;
  };

  drawSection('2. OBJETIVO DO SERVIÇO E SITUAÇÃO ENCONTRADA', `Objetivo: ${report.objetivo}\nSituação Inicial Encontrada: ${report.situacaoEncontrada}`, 17);
  drawSection('3. ATIVIDADES REALIZADAS E PROCEDIMENTOS DE SOLDAGEM', `Atividades: ${report.atividades}\nProcedimentos Executados: ${report.procedimentos}`, 18);
  drawSection('4. MATERIAIS, CONSUMÍVEIS E EQUIPAMENTOS UTILIZADOS', `Materiais / Ligas: ${report.materiais}\nEquipamentos de Solda: ${report.equipamentos}`, 16);
  drawSection('5. PARECER FINAL, RECOMENDAÇÕES E PENDÊNCIAS', `Situação Final: ${report.situacaoFinal}\nRecomendações: ${report.recomendacoes || 'Manter inspeções periódicas.'}\nPendências: ${report.pendencias || 'Nenhuma pendência identificada. Trabalho 100% liberado.'}`, 18);

  // Photographic Evidence Section
  const stagePhotos = photos || [];
  if (stagePhotos.length > 0) {
    doc.addPage();
    // Header for Page 2
    doc.setFillColor(7, 27, 53);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`REGISTRO FOTOGRÁFICO • RELATÓRIO ${report.numero}`, margin, 13);
    doc.setTextColor(255, 133, 0);
    doc.setFontSize(8);
    doc.text('Evidências de Inspeção Visual (Antes / Durante / Depois)', pageWidth - margin, 13, { align: 'right' });

    let photoY = 26;
    doc.setFillColor(18, 63, 112);
    doc.rect(margin, photoY, pageWidth - margin * 2, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('6. REGISTRO FOTOGRÁFICO POR ETAPAS', margin + 3, photoY + 4.2);

    photoY += 8;

    // Display photos grid
    stagePhotos.slice(0, 4).forEach((p, idx) => {
      const boxW = (pageWidth - margin * 2 - 8) / 2;
      const boxH = 48;
      const col = idx % 2;
      const pX = margin + col * (boxW + 8);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(pX, photoY, boxW, boxH, 2, 2, 'FD');

      // Stage Tag
      doc.setFillColor(p.etapa === 'Antes' ? 180 : p.etapa === 'Durante' ? 245 : 16, p.etapa === 'Antes' ? 83 : p.etapa === 'Durante' ? 158 : 185, p.etapa === 'Antes' ? 9 : p.etapa === 'Durante' ? 11 : 129);
      doc.rect(pX, photoY, boxW, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(`Etapa: ${p.etapa.toUpperCase()} • ${p.data}`, pX + 3, photoY + 3.8);

      // Photo placeholder / image if available
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`[Fotografia Técnica Registrada]`, pX + boxW / 2, photoY + 22, { align: 'center' });

      // Caption
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const capLines = doc.splitTextToSize(`Legenda: ${p.legenda || 'Inspeção técnica'}`, boxW - 6);
      doc.text(capLines.slice(0, 2), pX + 3, photoY + 36);

      if (idx % 2 === 1) photoY += boxH + 6;
    });

    if (stagePhotos.length % 2 === 1) photoY += 54;
  }

  // Signatures on Current Page
  const currentY = y > pageHeight - 55 ? pageHeight - 48 : y + 3;
  const sigBoxW = (pageWidth - margin * 2 - 12) / 2;

  doc.setDrawColor(148, 163, 184);
  // Resp Tec
  doc.line(margin + 5, currentY + 16, margin + 5 + sigBoxW, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(report.responsavelNome || 'Soldador Especialista', margin + 5 + sigBoxW / 2, currentY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Responsável Técnico / CloSolda', margin + 5 + sigBoxW / 2, currentY + 24, { align: 'center' });

  // Cliente
  const cX = margin + 7 + sigBoxW;
  doc.line(cX + 5, currentY + 16, cX + 5 + sigBoxW, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(report.clientNome, cX + 5 + sigBoxW / 2, currentY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Ciência do Cliente / Recebimento da Obra', cX + 5 + sigBoxW / 2, currentY + 24, { align: 'center' });

  // Footer Stripe
  doc.setFillColor(7, 27, 53);
  doc.rect(0, pageHeight - 9, pageWidth, 9, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('CloSolda • Soluções em Soldagem Industrial e Residencial • Qualidade, Segurança e Compromisso', pageWidth / 2, pageHeight - 3.5, { align: 'center' });

  return doc;
}
