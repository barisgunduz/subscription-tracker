import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Subscription } from '@/types/subscription';

export type ExportFormat = 'json' | 'csv' | 'pdf';

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeCsv(value: string | number) {
  const normalized = String(value).replaceAll('"', '""');
  return `"${normalized}"`;
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function buildJsonPayload(subscriptions: Subscription[]) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      subscriptions,
    },
    null,
    2
  );
}

function buildCsvPayload(subscriptions: Subscription[]) {
  const headers = [
    'ID',
    'Service Key',
    'Name',
    'Price',
    'Currency',
    'Billing Cycle',
    'Billing Day',
    'Start Date',
    'Next Billing Date',
    'Category',
    'Status',
    'Notes',
  ];

  const rows = subscriptions.map((subscription) =>
    [
      subscription.id,
      subscription.serviceKey,
      subscription.name,
      subscription.price,
      subscription.currency,
      subscription.billingCycle,
      subscription.billingDay,
      subscription.startDate,
      subscription.nextBillingDate,
      subscription.category,
      subscription.status,
      subscription.notes,
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [headers.map(escapeCsv).join(','), ...rows].join('\n');
}

function buildPdfMarkup(subscriptions: Subscription[]) {
  const exportedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rows = subscriptions
    .map(
      (subscription) => `
        <tr>
          <td>${escapeHtml(subscription.name)}</td>
          <td>${escapeHtml(subscription.category)}</td>
          <td>${escapeHtml(subscription.status)}</td>
          <td>${escapeHtml(subscription.billingCycle)}</td>
          <td>${escapeHtml(formatCurrency(subscription.price, subscription.currency))}</td>
          <td>${escapeHtml(subscription.nextBillingDate)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
            padding: 24px;
            color: #221c17;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 24px;
          }
          p {
            margin: 0 0 20px;
            color: #736960;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border-bottom: 1px solid #e7dbcf;
            text-align: left;
            padding: 10px 8px;
            vertical-align: top;
          }
          th {
            background: #f6f1ea;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .empty {
            padding: 18px;
            border-radius: 16px;
            background: #f6f1ea;
            color: #736960;
          }
        </style>
      </head>
      <body>
        <h1>Subscription Export</h1>
        <p>Exported ${escapeHtml(exportedAt)} · ${subscriptions.length} subscriptions</p>
        ${
          subscriptions.length === 0
            ? '<div class="empty">No subscriptions available.</div>'
            : `
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Cycle</th>
                    <th>Price</th>
                    <th>Next Billing</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            `
        }
      </body>
    </html>
  `;
}

async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  const isSharingAvailable = await Sharing.isAvailableAsync();

  if (!isSharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri, {
    mimeType,
    dialogTitle,
  });
}

export async function exportSubscriptions(
  subscriptions: Subscription[],
  format: ExportFormat
) {
  const timestamp = getTimestamp();
  const basePath = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!basePath) {
    throw new Error('No writable export directory is available.');
  }

  if (format === 'json') {
    const uri = `${basePath}subscriptions-${timestamp}.json`;
    await FileSystem.writeAsStringAsync(uri, buildJsonPayload(subscriptions));
    await shareFile(uri, 'application/json', 'Export subscriptions as JSON');
    return;
  }

  if (format === 'csv') {
    const uri = `${basePath}subscriptions-${timestamp}.csv`;
    await FileSystem.writeAsStringAsync(uri, buildCsvPayload(subscriptions));
    await shareFile(uri, 'text/csv', 'Export subscriptions as CSV');
    return;
  }

  const { uri } = await Print.printToFileAsync({
    html: buildPdfMarkup(subscriptions),
  });

  await shareFile(uri, 'application/pdf', 'Export subscriptions as PDF');
}
