import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchasedKey, StoreSettings, PurchaseInvoice, TransactionRecord, ResellerUser } from '../types';

export interface ExportAccountingTransactionsPdfOptions {
  soldKeys?: PurchasedKey[];
  transactions?: TransactionRecord[];
  storeSettings?: StoreSettings;
  filterLabel?: string;
  customTitle?: string;
  dateRangeLabel?: string;
  adminName?: string;
}

/**
 * Generates and downloads an official financial transaction history
 * and accounting ledger statement in PDF format for tax, auditing, and bookkeeping.
 */
export function exportAccountingTransactionsToPdf({
  soldKeys = [],
  transactions = [],
  storeSettings,
  filterLabel,
  customTitle,
  dateRangeLabel,
  adminName,
}: ExportAccountingTransactionsPdfOptions): {
  success: boolean;
  count: number;
  filename: string;
  totalRevenue: number;
  totalCredit: number;
  totalDebit: number;
} {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const storeName = storeSettings?.shopName || 'KALAM FF PANEL';
  const tagline = storeSettings?.tagline || 'Official Digital License & Key Reselling Platform';
  const reportTitle = customTitle || 'OFFICIAL TRANSACTION HISTORY & ACCOUNTING STATEMENT';

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const timestampString = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cleanStoreSlug = storeName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `${cleanStoreSlug}_accounting_transactions_${timestampString}.pdf`;

  // Compile unified accounting ledger entries:
  interface AccountingEntry {
    id: string;
    date: string;
    description: string;
    category: string;
    method: string;
    status: string;
    amount: number;
    isCredit: boolean;
  }

  const entries: AccountingEntry[] = [];
  const seenTxIds = new Set<string>();

  // 1. Process sold keys as verified sales transactions
  soldKeys.forEach((key, idx) => {
    const txId = key.invoiceNumber || key.orderId || `SALE-${key.id || idx + 1}`;
    seenTxIds.add(txId);
    entries.push({
      id: txId,
      date: key.purchaseDate || dateFormatted,
      description: `${key.productName || 'Digital License'} [${key.planName || 'Standard'}]`,
      category: 'KEY SALE / REVENUE',
      method: 'Wallet Balance / Direct',
      status: key.status || 'COMPLETED',
      amount: Number(key.price) || 0,
      isCredit: true,
    });
  });

  // 2. Process wallet transactions & deposits
  transactions.forEach((tx, idx) => {
    const txId = tx.id || `TXN-${idx + 1}`;
    if (seenTxIds.has(txId) || (tx.utrOrReference && seenTxIds.has(tx.utrOrReference))) {
      return;
    }
    const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.amount > 0;
    entries.push({
      id: txId,
      date: tx.date || dateFormatted,
      description: tx.description || (tx.type === 'DEPOSIT' ? 'Wallet Deposit / Top-up' : 'Adjustment / Payout'),
      category: tx.type === 'DEPOSIT' ? 'WALLET TOPUP' : tx.type.replace('_', ' '),
      method: tx.method || (tx.type === 'DEPOSIT' ? 'UPI / Auto-Gateway' : 'Store Balance'),
      status: tx.status || 'COMPLETED',
      amount: Math.abs(Number(tx.amount) || 0),
      isCredit: isDeposit,
    });
  });

  // Calculate accounting aggregates
  const totalCount = entries.length;
  const totalCredit = entries.filter((e) => e.isCredit).reduce((acc, e) => acc + e.amount, 0);
  const totalDebit = entries.filter((e) => !e.isCredit).reduce((acc, e) => acc + e.amount, 0);
  const grossSales = soldKeys.reduce((acc, k) => acc + (Number(k.price) || 0), 0);
  const netTurnover = totalCredit - totalDebit;
  const avgOrderValue =
    soldKeys.length > 0
      ? grossSales / soldKeys.length
      : totalCount > 0
      ? totalCredit / totalCount
      : 0;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Header Brand Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(storeName.toUpperCase(), 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(tagline, 14, 20);

  // Right Header: Report Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(reportTitle, pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${dateFormatted} at ${timeFormatted}`, pageWidth - 14, 18, { align: 'right' });
  doc.text(
    `Scope: ${filterLabel || dateRangeLabel || 'All Historical Records'} (${totalCount} Transactions)`,
    pageWidth - 14,
    23,
    { align: 'right' }
  );

  // Subtle divider rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 26, pageWidth - 14, 26);

  // 3. Accounting Executive KPI Cards (4 cards)
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 16;
  const cardY = 29;

  const statBoxes = [
    {
      label: 'TOTAL GROSS SALES',
      value: `INR ${grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: [5, 150, 105], // Emerald 600
      bg: [236, 253, 245],
      border: [167, 243, 208],
    },
    {
      label: 'TOTAL TRANSACTIONS',
      value: `${totalCount} Records`,
      color: [15, 23, 42],
      bg: [241, 245, 249],
      border: [203, 213, 225],
    },
    {
      label: 'AVERAGE ORDER VALUE',
      value: `INR ${avgOrderValue.toFixed(2)}`,
      color: [2, 132, 199], // Sky 600
      bg: [240, 249, 255],
      border: [186, 230, 253],
    },
    {
      label: 'NET TURNOVER VOLUME',
      value: `INR ${netTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: [124, 58, 237], // Purple 600
      bg: [245, 243, 255],
      border: [221, 214, 254],
    },
  ];

  statBoxes.forEach((stat, index) => {
    const x = 14 + index * (cardWidth + 3);
    doc.setFillColor(stat.bg[0], stat.bg[1], stat.bg[2]);
    doc.setDrawColor(stat.border[0], stat.border[1], stat.border[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, x + 3.5, cardY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.value, x + 3.5, cardY + 12);
  });

  // 4. Data Table using autoTable
  const tableRows =
    entries.length > 0
      ? entries.map((entry, idx) => {
          const formattedAmount = `${entry.isCredit ? '+' : '-'} INR ${entry.amount.toFixed(2)}`;
          return [
            idx + 1,
            entry.date,
            entry.id,
            entry.description,
            entry.category,
            entry.method,
            entry.status,
            formattedAmount,
          ];
        })
      : [
          [
            '1',
            dateFormatted,
            'N/A',
            'No transactions recorded yet in accounting period',
            'AUDIT',
            'N/A',
            'COMPLETED',
            'INR 0.00',
          ],
        ];

  autoTable(doc, {
    startY: cardY + cardHeight + 5,
    margin: { left: 14, right: 14 },
    head: [
      [
        '#',
        'Date & Time',
        'Reference / Invoice ID',
        'Description / Particulars',
        'Type / Ledger',
        'Channel',
        'Status',
        'Amount (INR)',
      ],
    ],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      valign: 'middle',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // #
      1: { cellWidth: 32 }, // Date
      2: { cellWidth: 44, font: 'courier', fontStyle: 'bold' }, // Ref ID
      3: { cellWidth: 70, fontStyle: 'bold' }, // Particulars
      4: { cellWidth: 34 }, // Type
      5: { cellWidth: 30 }, // Channel
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }, // Status
      7: { cellWidth: 29, halign: 'right', fontStyle: 'bold' }, // Amount
    },
    foot: [
      [
        '',
        '',
        'Statement Totals',
        `${totalCount} Total Transactions`,
        '',
        '',
        'Net Total:',
        `INR ${netTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 6) {
          const val = String(data.cell.raw).toUpperCase();
          if (val === 'COMPLETED' || val === 'ACTIVE') {
            data.cell.styles.textColor = [5, 150, 105]; // Emerald
          } else if (val === 'PENDING') {
            data.cell.styles.textColor = [180, 83, 9]; // Amber
          } else if (val === 'FAILED' || val === 'EXPIRED') {
            data.cell.styles.textColor = [220, 38, 38]; // Red
          }
        }
        if (data.column.index === 7) {
          const val = String(data.cell.raw);
          if (val.startsWith('+')) {
            data.cell.styles.textColor = [5, 150, 105];
          } else if (val.startsWith('-')) {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      }
    },
    didDrawPage: () => {
      const currentHeight = doc.internal.pageSize.getHeight();
      const currentWidth = doc.internal.pageSize.getWidth();

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, currentHeight - 11, currentWidth - 14, currentHeight - 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated on ${dateFormatted} at ${timeFormatted} | ${storeName} Official Accounting & Transaction Statement • For Tax & Bookkeeping Audit`,
        14,
        currentHeight - 6
      );

      doc.text(
        `Page ${doc.getNumberOfPages()}`,
        currentWidth - 14,
        currentHeight - 6,
        { align: 'right' }
      );
    },
  });

  doc.save(filename);

  return {
    success: true,
    count: totalCount,
    filename,
    totalRevenue: grossSales,
    totalCredit,
    totalDebit,
  };
}

export interface ExportAccountingTransactionsCsvOptions {
  soldKeys?: PurchasedKey[];
  transactions?: TransactionRecord[];
  storeSettings?: StoreSettings;
  filterLabel?: string;
}

/**
 * Generates and downloads an accounting and transaction ledger spreadsheet in CSV format
 * for direct analysis and import into Microsoft Excel or Google Sheets.
 */
export function exportAccountingTransactionsToCsv({
  soldKeys = [],
  transactions = [],
  storeSettings,
  filterLabel,
}: ExportAccountingTransactionsCsvOptions): {
  success: boolean;
  count: number;
  filename: string;
} {
  const storeName = storeSettings?.shopName || 'KALAM FF PANEL';
  const now = new Date();
  const timestampString = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cleanStoreSlug = storeName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `${cleanStoreSlug}_accounting_ledger_${timestampString}.csv`;

  // Headers
  const headers = [
    '#',
    'Transaction Date & Time',
    'Reference / Invoice ID',
    'Order Reference',
    'Description / Product',
    'Plan / Duration',
    'License Key(s)',
    'Type / Category',
    'Channel / Payment Method',
    'Status',
    'Flow',
    'Amount (INR)',
  ];

  const rows: string[][] = [];
  const seenTxIds = new Set<string>();

  // 1. Process sold keys
  soldKeys.forEach((key, idx) => {
    const txId = key.invoiceNumber || key.orderId || `SALE-${key.id || idx + 1}`;
    seenTxIds.add(txId);
    rows.push([
      String(idx + 1),
      key.purchaseDate || now.toLocaleString(),
      txId,
      key.orderId || 'N/A',
      key.productName || 'Digital Key',
      key.planName || 'Standard Plan',
      key.keyCode || 'N/A',
      'KEY SALE / REVENUE',
      'Wallet Balance / Direct',
      key.status || 'COMPLETED',
      'CREDIT (+)',
      String(Number(key.price) || 0),
    ]);
  });

  // 2. Process transactions
  transactions.forEach((tx, idx) => {
    const txId = tx.id || `TXN-${idx + 1}`;
    if (seenTxIds.has(txId) || (tx.utrOrReference && seenTxIds.has(tx.utrOrReference))) {
      return;
    }
    const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.amount > 0;
    rows.push([
      String(rows.length + 1),
      tx.date || now.toLocaleString(),
      txId,
      tx.utrOrReference || 'N/A',
      tx.description || (tx.type === 'DEPOSIT' ? 'Wallet Deposit / Topup' : 'Adjustment'),
      'N/A',
      'N/A',
      tx.type === 'DEPOSIT' ? 'WALLET TOPUP' : tx.type.replace('_', ' '),
      tx.method || (tx.type === 'DEPOSIT' ? 'UPI / Gateway' : 'Store Balance'),
      tx.status || 'COMPLETED',
      isDeposit ? 'CREDIT (+)' : 'DEBIT (-)',
      String(Math.abs(Number(tx.amount) || 0)),
    ]);
  });

  // Convert to CSV format with proper escaping
  const csvContent = [
    `"sep=,"`, // Excel CSV hint
    `"${storeName} - Accounting & Transaction Ledger Report"`,
    `"Generated on: ${now.toLocaleString()} | Scope: ${filterLabel || 'All Transactions'}"`,
    '',
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    count: rows.length,
    filename,
  };
}

export interface ExportSoldKeysPdfOptions {
  soldKeys: PurchasedKey[];
  storeSettings?: StoreSettings;
  filterLabel?: string;
  customTitle?: string;
}

/**
 * Generates and downloads a clean, publication-ready PDF sales audit report
 * for all or filtered sold license keys.
 */
export function exportSoldKeysToPdf({
  soldKeys,
  storeSettings,
  filterLabel,
  customTitle,
}: ExportSoldKeysPdfOptions): { success: boolean; count: number; filename: string } {
  if (!soldKeys || soldKeys.length === 0) {
    throw new Error('No sold keys available to export.');
  }

  // Use landscape A4 for license keys and order hashes
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const storeName = storeSettings?.shopName || 'KALAM FF PANEL';
  const tagline = storeSettings?.tagline || 'Premium Digital License & Key Store';
  const reportTitle = customTitle || 'HISTORICAL SOLD KEYS & SALES AUDIT REPORT';

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const timestampString = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cleanStoreSlug = storeName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `${cleanStoreSlug}_sold_keys_${timestampString}.pdf`;

  // Financial aggregates
  const totalKeys = soldKeys.length;
  const totalRevenue = soldKeys.reduce((acc, k) => acc + (Number(k.price) || 0), 0);
  const activeCount = soldKeys.filter((k) => k.status === 'ACTIVE').length;
  const usedCount = soldKeys.filter((k) => k.status === 'USED').length;
  const expiredCount = soldKeys.filter((k) => k.status === 'EXPIRED').length;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(14, 165, 233); // Cyan 500
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Header Brand Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(storeName.toUpperCase(), 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(tagline, 14, 20);

  // Right Header: Report Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(14, 165, 233);
  doc.text(reportTitle, pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${dateFormatted} at ${timeFormatted}`, pageWidth - 14, 18, { align: 'right' });
  doc.text(
    `Scope: ${filterLabel || 'Full Historical Record'} (${totalKeys} ${totalKeys === 1 ? 'Key' : 'Keys'})`,
    pageWidth - 14,
    23,
    { align: 'right' }
  );

  // Subtle divider rule
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.4);
  doc.line(14, 26, pageWidth - 14, 26);

  // 3. Summary Metric Stat Cards (4 inline boxes)
  const cardWidth = (pageWidth - 28 - 9) / 4; // 4 cards with 3mm gaps
  const cardHeight = 16;
  const cardY = 29;

  const statBoxes = [
    {
      label: 'TOTAL KEYS SOLD',
      value: `${totalKeys}`,
      color: [15, 23, 42],
      bg: [241, 245, 249],
      border: [203, 213, 225],
    },
    {
      label: 'GROSS SALES REVENUE',
      value: `INR ${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: [5, 150, 105], // Emerald 600
      bg: [236, 253, 245], // Emerald 50
      border: [167, 243, 208],
    },
    {
      label: 'ACTIVE LICENSES',
      value: `${activeCount}`,
      color: [2, 132, 199], // Sky 600
      bg: [240, 249, 255],
      border: [186, 230, 253],
    },
    {
      label: 'USED / EXPIRED',
      value: `${usedCount} / ${expiredCount}`,
      color: [180, 83, 9], // Amber 700
      bg: [254, 243, 199],
      border: [253, 230, 138],
    },
  ];

  statBoxes.forEach((stat, index) => {
    const x = 14 + index * (cardWidth + 3);

    // Box Background
    doc.setFillColor(stat.bg[0], stat.bg[1], stat.bg[2]);
    doc.setDrawColor(stat.border[0], stat.border[1], stat.border[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, x + 3.5, cardY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.value, x + 3.5, cardY + 12);
  });

  // 4. Data Table
  const tableRows = soldKeys.map((key, idx) => {
    const formattedDate = key.purchaseDate || 'N/A';
    const priceFormatted = `INR ${(Number(key.price) || 0).toFixed(2)}`;
    const invoiceNumber = key.invoiceNumber || key.orderId || 'N/A';
    const plan = key.planName || 'Standard';
    const status = key.status || 'ACTIVE';

    return [
      idx + 1,
      formattedDate,
      key.productName || 'Unknown Product',
      plan,
      key.keyCode || 'N/A',
      invoiceNumber,
      priceFormatted,
      status,
    ];
  });

  autoTable(doc, {
    startY: cardY + cardHeight + 5,
    margin: { left: 14, right: 14 },
    head: [['#', 'Purchase Date', 'Product Name', 'Plan', 'License Key Code', 'Invoice / Order ID', 'Amount', 'Status']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      valign: 'middle',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59], // Slate 800
      cellPadding: 2.2,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // #
      1: { cellWidth: 32 }, // Purchase Date
      2: { cellWidth: 44, fontStyle: 'bold' }, // Product Name
      3: { cellWidth: 24 }, // Plan
      4: { cellWidth: 70, font: 'courier', fontStyle: 'bold', textColor: [2, 132, 199] }, // License Key Code
      5: { cellWidth: 42, font: 'courier' }, // Invoice / Order ID
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }, // Amount
      7: { cellWidth: 21, halign: 'center', fontStyle: 'bold' }, // Status
    },
    foot: [
      [
        '',
        '',
        'Summary Totals',
        `${totalKeys} Sold`,
        '',
        'Gross Total:',
        `INR ${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        '',
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    didParseCell: (data) => {
      // Highlight Status column cells
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw).toUpperCase();
        if (val === 'ACTIVE') {
          data.cell.styles.textColor = [5, 150, 105]; // Emerald
        } else if (val === 'USED') {
          data.cell.styles.textColor = [180, 83, 9]; // Amber
        } else if (val === 'EXPIRED') {
          data.cell.styles.textColor = [220, 38, 38]; // Red
        }
      }
    },
    didDrawPage: () => {
      // Footer on every page
      const currentHeight = doc.internal.pageSize.getHeight();
      const currentWidth = doc.internal.pageSize.getWidth();

      // Top subtle border of footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, currentHeight - 11, currentWidth - 14, currentHeight - 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        `Generated on ${dateFormatted} at ${timeFormatted} | ${storeName} Official Sales Audit Document`,
        14,
        currentHeight - 6
      );

      doc.text(
        `Page ${doc.getNumberOfPages()}`,
        currentWidth - 14,
        currentHeight - 6,
        { align: 'right' }
      );
    },
  });

  // Save the document to trigger browser download
  doc.save(filename);

  return {
    success: true,
    count: totalKeys,
    filename,
  };
}

/**
 * Generates and downloads a branded, high-contrast PDF invoice receipt
 * for a customer purchase.
 */
export function exportInvoiceToPdf(
  invoice: PurchaseInvoice,
  storeSettings?: StoreSettings
): { success: boolean; filename: string } {
  if (!invoice) {
    throw new Error('No invoice data provided to export.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const storeName = storeSettings?.shopName || invoice.shopName || 'KALAM FF PANEL';
  const tagline = storeSettings?.tagline || 'Official Digital License Store';
  const filename = `${invoice.invoiceNumber || 'INVOICE'}_Receipt.pdf`;

  // 1. Top Brand Banner (Cyan Accent)
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Header Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(storeName.toUpperCase(), 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(tagline, 14, 21);

  // Right Header: Status Stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(14, 165, 233);
  doc.text('PAYMENT RECEIPT', pageWidth - 14, 15, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text(`STATUS: ${invoice.status || 'PAID'}`, pageWidth - 14, 21, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 26, pageWidth - 14, 26);

  // 3. Invoice Meta & Customer Box
  const metaBoxY = 31;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, metaBoxY, pageWidth - 28, 28, 3, 3, 'FD');

  // Left col: Invoice Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE NUMBER', 18, metaBoxY + 6);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.invoiceNumber, 18, metaBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ORDER ID', 18, metaBoxY + 18);
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(invoice.orderId || 'N/A', 18, metaBoxY + 23);

  // Middle col: Date & Payment Method
  const midX = pageWidth / 2 - 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE & TIME', midX, metaBoxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.date || new Date().toLocaleString(), midX, metaBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT METHOD', midX, metaBoxY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 165, 233);
  doc.text(String(invoice.paymentMethod || 'WALLET / UPI').toUpperCase(), midX, metaBoxY + 23);

  // Right col: Customer Info
  const rightX = pageWidth - 65;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO', rightX, metaBoxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.buyerName || 'Customer', rightX, metaBoxY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (invoice.buyerUsername) {
    doc.text(`@${invoice.buyerUsername}`, rightX, metaBoxY + 16);
  }
  if (invoice.buyerEmail) {
    doc.text(invoice.buyerEmail, rightX, metaBoxY + 21);
  }

  // 4. Products Table using autoTable
  const tableStartY = metaBoxY + 34;
  const currencySymbol = 'INR';

  autoTable(doc, {
    startY: tableStartY,
    theme: 'grid',
    head: [['Product Description', 'Plan Duration', 'Platform / Device', 'Qty', 'Unit Price', 'Total']],
    body: [
      [
        invoice.productName || 'Digital License Key',
        invoice.planDuration || 'Standard',
        invoice.deviceType || invoice.category || 'All Devices',
        String(invoice.quantity || 1),
        `${currencySymbol} ${(invoice.unitPrice || 0).toFixed(2)}`,
        `${currencySymbol} ${(invoice.totalAmount || 0).toFixed(2)}`,
      ],
    ],
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 28 },
      2: { cellWidth: 32 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [14, 165, 233] },
    },
    foot: [
      [
        '',
        '',
        '',
        '',
        'Total Paid:',
        `${currencySymbol} ${(invoice.totalAmount || 0).toFixed(2)}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3,
    },
  });

  const finalTableY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Delivered License Keys Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`DELIVERED DIGITAL LICENSE KEYS (${(invoice.keys || []).length})`, 14, finalTableY);

  let keyBoxY = finalTableY + 4;
  (invoice.keys || []).forEach((k, idx) => {
    doc.setFillColor(240, 249, 255); // Sky 50
    doc.setDrawColor(186, 230, 253); // Sky 200
    doc.roundedRect(14, keyBoxY, pageWidth - 28, 10, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(14, 165, 233);
    doc.text(`KEY #${idx + 1}:`, 18, keyBoxY + 6.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(k, 36, keyBoxY + 6.5);

    keyBoxY += 12;
  });

  // 6. Security Note & Support Box
  const noticeY = Math.max(keyBoxY + 4, pageHeight - 38);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, noticeY, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('VERIFIED GENUINE PRODUCT & WARRANTY GUARANTEE', 18, noticeY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This electronic receipt certifies that the keys delivered above are original, genuine, and active in the system.',
    18,
    noticeY + 11
  );
  doc.text(
    `Official Support Channel: ${invoice.supportContact || storeSettings?.supportUsername || '@Kalam_Mods_Official'} | Retain this invoice for warranty and renewals.`,
    18,
    noticeY + 16
  );

  // Footer Rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${storeName} Official Electronic Billing • Generated on ${new Date().toLocaleString()}`,
    14,
    pageHeight - 6
  );
  doc.text('Page 1 of 1', pageWidth - 14, pageHeight - 6, { align: 'right' });

  // Save to browser download
  doc.save(filename);

  return {
    success: true,
    filename,
  };
}

/**
 * Generates and downloads a clean PDF documentation sheet
 * for all Project Deployment Environment Variables.
 */
export function exportEnvVariablesToPdf(
  storeSettings?: StoreSettings
): { success: boolean; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const storeName = storeSettings?.shopName || 'KALAM FF PANEL';
  const filename = `${storeName.replace(/[^a-zA-Z0-9]/g, '_')}_Env_Variables.pdf`;

  // Top Bar
  doc.setFillColor(99, 102, 241); // Indigo
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(storeName.toUpperCase(), 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Deployment Environment Variables & Gateway Manifest', 14, 21);

  // Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
  doc.text('DEPLOYMENT CONFIGURATION', pageWidth - 14, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 21, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 26, pageWidth - 14, 26);

  // Intro note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Note: These variables can be added to your hosting platform (Cloud Run, Vercel, VPS) during deployment. All values are also saved in internal database defaults.',
    14,
    32,
    { maxWidth: pageWidth - 28 }
  );

  const variables = [
    {
      name: 'FAMGATEWAY_API_KEY',
      value: 'fam_a9527c6c2dd4d26ad5223cfc3c4c5fa9289b574e',
      role: 'Active Primary Auto-UPI Gateway Key',
      status: 'Primary Gateway',
    },
    {
      name: 'FAMGATEWAY_GATEWAY_URL',
      value: 'https://famgateway.in/api/create-order.php',
      role: 'Primary Gateway Order Endpoint',
      status: 'Primary Gateway',
    },
    {
      name: 'FAMPAY_API_KEY',
      value: 'fam_201277f4313d5f176512809e8b8d5c639b91c8ea',
      role: 'Secondary FreePanel Payment API Key',
      status: 'Fallback Gateway',
    },
    {
      name: 'FAMPAY_GATEWAY_URL',
      value: 'https://py.freepanel.in/api/v1/orders',
      role: 'Secondary FreePanel Order Endpoint',
      status: 'Fallback Gateway',
    },
    {
      name: 'ZAPUPI_KEY',
      value: 'zap9616e75062c85cc1995818322ae0d1d5',
      role: 'ZapUPI Gateway Secret Key',
      status: 'Fallback Gateway',
    },
    {
      name: 'ZAPUPI_GATEWAY_URL',
      value: 'https://pay.zapupi.com/api/create-order',
      role: 'ZapUPI Create Order Endpoint',
      status: 'Fallback Gateway',
    },
    {
      name: 'ADITYAHOST_API_KEY',
      value: 'AH_LIVE_sk_89218a091c4920b78',
      role: 'AdityaHost UPI QR API Key',
      status: 'Fallback Gateway',
    },
    {
      name: 'ADITYAHOST_GATEWAY_URL',
      value: 'https://adityahost.in/api/qr.php',
      role: 'AdityaHost QR API Endpoint',
      status: 'Fallback Gateway',
    },
    {
      name: 'ADITYAHOST_UPI',
      value: 'kalamffpanel@fampay',
      role: 'AdityaHost Primary Payee UPI ID',
      status: 'Merchant VPA',
    },
    {
      name: 'IMAP_HOST',
      value: 'imap.gmail.com',
      role: 'UTR Email Scraper Host (Optional)',
      status: 'Optional Scraper',
    },
    {
      name: 'IMAP_PORT',
      value: '993',
      role: 'UTR Email Scraper TLS Port',
      status: 'Optional Scraper',
    },
  ];

  autoTable(doc, {
    startY: 40,
    theme: 'grid',
    head: [['Environment Variable', 'Value / Default Setting', 'Role / Provider', 'Status']],
    body: variables.map((v) => [v.name, v.value, v.role, v.status]),
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 54, font: 'courier', fontStyle: 'bold', textColor: [99, 102, 241] },
      1: { cellWidth: 62, font: 'courier' },
      2: { cellWidth: 42 },
      3: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw);
        if (val.includes('Primary')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    },
  });

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${storeName} Official Environment Manifest • Secure Configuration Document`,
    14,
    pageHeight - 6
  );
  doc.text('Page 1 of 1', pageWidth - 14, pageHeight - 6, { align: 'right' });

  doc.save(filename);

  return {
    success: true,
    filename,
  };
}

export interface ExportUsersPdfOptions {
  users: ResellerUser[];
  storeSettings?: StoreSettings;
  filterLabel?: string;
  customTitle?: string;
  adminName?: string;
}

/**
 * Generates and downloads a branded, official user accounts and wallet balance
 * ledger in PDF format for bookkeeping, financial liability accounting, and administrative audits.
 */
export function exportUsersToPdf({
  users = [],
  storeSettings,
  filterLabel,
  customTitle,
  adminName,
}: ExportUsersPdfOptions): {
  success: boolean;
  count: number;
  filename: string;
  totalBalance: number;
} {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const storeName = storeSettings?.shopName || 'KALAM FF PANEL';
  const tagline = storeSettings?.tagline || 'Official Digital License & Key Reselling Platform';
  const reportTitle = customTitle || 'USER ACCOUNTS & WALLET BALANCES (BOOKKEEPING LEDGER)';

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const timestampString = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cleanStoreSlug = storeName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `${cleanStoreSlug}_users_bookkeeping_${timestampString}.pdf`;

  // Financial and account aggregates
  const totalCount = users.length;
  const totalBalance = users.reduce((acc, u) => acc + (Number(u.walletBalance) || 0), 0);
  const positiveAccounts = users.filter((u) => (Number(u.walletBalance) || 0) > 0).length;
  const avgBalance = totalCount > 0 ? totalBalance / totalCount : 0;

  // 1. Top Decorative Brand Bar (Indigo/Cyan Accent)
  doc.setFillColor(99, 102, 241); // Indigo 500
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Header Brand Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(storeName.toUpperCase(), 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(tagline, 14, 20);

  // Right Header: Report Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(reportTitle, pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${dateFormatted} at ${timeFormatted}`, pageWidth - 14, 18, { align: 'right' });
  doc.text(
    `Scope: ${filterLabel || 'Current Filtered User List'} (${totalCount} Accounts)`,
    pageWidth - 14,
    23,
    { align: 'right' }
  );

  // Subtle divider rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 26, pageWidth - 14, 26);

  // 3. KPI Summary Boxes for Bookkeeping (4 inline boxes)
  const availableWidth = pageWidth - 28;
  const cardWidth = (availableWidth - 9) / 4;
  const cardHeight = 15;
  const cardY = 29;

  const statBoxes = [
    {
      label: 'TOTAL ACCOUNTS',
      value: `${totalCount} Users`,
      color: [15, 23, 42], // Slate 900
      bg: [241, 245, 249],
      border: [203, 213, 225],
    },
    {
      label: 'TOTAL WALLET BALANCE',
      value: `INR ${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: [5, 150, 105], // Emerald 600
      bg: [236, 253, 245],
      border: [167, 243, 208],
    },
    {
      label: 'POSITIVE BALANCES',
      value: `${positiveAccounts} Accounts`,
      color: [2, 132, 199], // Sky 600
      bg: [240, 249, 255],
      border: [186, 230, 253],
    },
    {
      label: 'AVERAGE BALANCE',
      value: `INR ${avgBalance.toFixed(2)}`,
      color: [124, 58, 237], // Purple 600
      bg: [245, 243, 255],
      border: [221, 214, 254],
    },
  ];

  statBoxes.forEach((stat, index) => {
    const x = 14 + index * (cardWidth + 3);
    doc.setFillColor(stat.bg[0], stat.bg[1], stat.bg[2]);
    doc.setDrawColor(stat.border[0], stat.border[1], stat.border[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, x + 3, cardY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.text(stat.value, x + 3, cardY + 11);
  });

  // 4. Data Table Rows: name, email, wallet balance (plus role and status)
  const tableRows =
    users.length > 0
      ? users.map((user, idx) => {
          const userName = user.name || 'Unnamed User';
          const usernameTag = user.username ? ` (@${user.username})` : '';
          const email = user.email || 'N/A';
          const role = user.role || (user.isReseller ? 'RESELLER' : 'USER');
          const status = user.status || 'ACTIVE';
          const balanceNum = Number(user.walletBalance) || 0;
          const formattedBalance = `INR ${balanceNum.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;

          return [
            idx + 1,
            `${userName}${usernameTag}`,
            email,
            role,
            status,
            formattedBalance,
          ];
        })
      : [
          [
            '1',
            'No matching users found',
            'N/A',
            'USER',
            'ACTIVE',
            'INR 0.00',
          ],
        ];

  autoTable(doc, {
    startY: cardY + cardHeight + 5,
    margin: { left: 14, right: 14 },
    head: [
      [
        '#',
        'User / Name',
        'Email Address',
        'Role',
        'Status',
        'Wallet Balance (INR)',
      ],
    ],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      valign: 'middle',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // #
      1: { cellWidth: 48, fontStyle: 'bold' }, // User / Name
      2: { cellWidth: 54 }, // Email Address
      3: { cellWidth: 20, halign: 'center' }, // Role
      4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }, // Status
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }, // Wallet Balance
    },
    foot: [
      [
        '',
        'Bookkeeping Statement Totals',
        `${totalCount} Filtered Users`,
        '',
        'Total Balance:',
        `INR ${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Status column highlighting
        if (data.column.index === 4) {
          const val = String(data.cell.raw).toUpperCase();
          if (val === 'ACTIVE') {
            data.cell.styles.textColor = [5, 150, 105]; // Emerald
          } else if (val === 'WARNING') {
            data.cell.styles.textColor = [180, 83, 9]; // Amber
          } else if (val === 'BLOCKED' || val === 'INACTIVE') {
            data.cell.styles.textColor = [220, 38, 38]; // Red
          }
        }
        // Balance column highlighting
        if (data.column.index === 5) {
          const raw = String(data.cell.raw);
          const num = parseFloat(raw.replace(/[^0-9.-]/g, ''));
          if (num > 0) {
            data.cell.styles.textColor = [5, 150, 105]; // Emerald 600
          } else if (num < 0) {
            data.cell.styles.textColor = [220, 38, 38]; // Red 600
          } else {
            data.cell.styles.textColor = [100, 116, 139]; // Slate 500
          }
        }
      }
    },
    didDrawPage: () => {
      const currentHeight = doc.internal.pageSize.getHeight();
      const currentWidth = doc.internal.pageSize.getWidth();

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, currentHeight - 11, currentWidth - 14, currentHeight - 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated on ${dateFormatted} at ${timeFormatted} | ${storeName} Official User Accounts Ledger • Bookkeeping & Audit Record`,
        14,
        currentHeight - 6
      );

      doc.text(
        `Page ${doc.getNumberOfPages()}`,
        currentWidth - 14,
        currentHeight - 6,
        { align: 'right' }
      );
    },
  });

  doc.save(filename);

  return {
    success: true,
    count: totalCount,
    filename,
    totalBalance,
  };
}

