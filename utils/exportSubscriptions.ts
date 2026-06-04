import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { usePreferencesStore } from '@/store/preferencesStore';
import { Subscription } from '@/types/subscription';
import { formatCurrency as formatMoney } from '@/utils/currency';
import { getLocale, translate, TranslationKey } from '@/utils/i18n';

export type ExportFormat = 'json' | 'csv' | 'pdf';

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function getExportFileName(timestamp: string, extension: ExportFormat) {
  return `substrack-simple-tracker-${timestamp}.${extension}`;
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

function getExportLanguage() {
  return usePreferencesStore.getState().languageCode;
}

function getExportLocale() {
  return getLocale(getExportLanguage());
}

function t(key: TranslationKey, params?: Record<string, string | number>) {
  return translate(getExportLanguage(), key, params);
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
    'Name',
    'Price',
    'Billing Cycle',
    'Billing Day',
    'Start Date',
    'Renewal Date',
    'Next Billing Date',
    'Category',
    'Notes',
  ];

  const rows = subscriptions.map((subscription) =>
    [
      subscription.name,
      formatMoney(subscription.price, subscription.currency, getExportLocale()),
      subscription.billingCycle,
      subscription.billingDay,
      subscription.startDate,
      subscription.renewalDate,
      subscription.nextBillingDate,
      subscription.category,
      subscription.notes,
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [headers.map(escapeCsv).join(','), ...rows].join('\n');
}

function buildPdfMarkup(subscriptions: Subscription[]) {
  const exportedAt = new Date().toLocaleString(getExportLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rows = subscriptions
    .map(
      (subscription) => `
        <tr>
          <td>${escapeHtml(subscription.name)}</td>
          <td>${escapeHtml(subscription.category)}</td>
          <td>${escapeHtml(subscription.billingCycle)}</td>
          <td>${escapeHtml(formatMoney(subscription.price, subscription.currency, getExportLocale()))}</td>
          <td>${escapeHtml(subscription.nextBillingDate)}</td>
          <td>${escapeHtml(subscription.notes || '-')}</td>
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
        <h1>Substrack - Simple Tracker</h1>
        <p>${escapeHtml(t('lastUpdated', { date: exportedAt }))} · ${escapeHtml(t('activeSubscriptionsCount', { count: subscriptions.length }))}</p>
        ${
          subscriptions.length === 0
            ? `<div class="empty">${escapeHtml(t('noSubscriptions'))}</div>`
            : `
              <table>
                <thead>
                  <tr>
                    <th>${escapeHtml(t('sortName'))}</th>
                    <th>${escapeHtml(t('category'))}</th>
                    <th>${escapeHtml(t('billingCycle'))}</th>
                    <th>${escapeHtml(t('price'))}</th>
                    <th>${escapeHtml(t('nextBillingDate'))}</th>
                    <th>${escapeHtml(t('notes'))}</th>
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
    const uri = `${basePath}${getExportFileName(timestamp, 'json')}`;
    await FileSystem.writeAsStringAsync(uri, buildJsonPayload(subscriptions));
    await shareFile(uri, 'application/json', `${t('exportSubscriptions')} JSON`);
    return;
  }

  if (format === 'csv') {
    const uri = `${basePath}${getExportFileName(timestamp, 'csv')}`;
    await FileSystem.writeAsStringAsync(uri, buildCsvPayload(subscriptions));
    await shareFile(uri, 'text/csv', `${t('exportSubscriptions')} CSV`);
    return;
  }

  const printedFile = await Print.printToFileAsync({
    html: buildPdfMarkup(subscriptions),
  });
  const uri = `${basePath}${getExportFileName(timestamp, 'pdf')}`;

  await FileSystem.copyAsync({ from: printedFile.uri, to: uri });
  await shareFile(uri, 'application/pdf', `${t('exportSubscriptions')} PDF`);
}
