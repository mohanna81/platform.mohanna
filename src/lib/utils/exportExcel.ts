import * as XLSX from 'xlsx';
import { Risk } from '@/lib/api/services/risks';

const LIKELIHOOD_LABELS: Record<string, string> = {
  '1': 'Rare',
  '2': 'Unlikely',
  '3': 'Possible',
  '4': 'Likely',
  '5': 'Almost Certain',
};

const SEVERITY_LABELS: Record<string, string> = {
  '1': 'Insignificant',
  '2': 'Minor',
  '3': 'Moderate',
  '4': 'Major',
  '5': 'Critical',
};

function riskToRow(risk: Risk, index?: number) {
  const likelihood = risk.likelihood || '0';
  const severity = risk.severity || '0';
  const ranking = (parseInt(likelihood) || 0) * (parseInt(severity) || 0);
  const consortiumNames = Array.isArray(risk.consortium)
    ? risk.consortium
        .map((c: { name?: string } | string) =>
          typeof c === 'object' && c !== null && 'name' in c ? c.name : String(c)
        )
        .join(', ')
    : '';

  const row: Record<string, string | number> = {
    'Risk Title': risk.title || '',
    'Risk Code': risk.code || '',
    'Category': risk.category || '',
    'Risk Statement': risk.statement || '',
    'Likelihood': `${LIKELIHOOD_LABELS[likelihood] || ''} (${likelihood})`,
    'Severity': `${SEVERITY_LABELS[severity] || ''} (${severity})`,
    'Risk Ranking': ranking,
    'Trigger Indicator': risk.triggerIndicator || '',
    'Trigger Status': risk.triggerStatus || 'Not Triggered',
    'Mitigation Measures': risk.mitigationMeasures || '',
    'Preventive Measures': risk.preventiveMeasures || '',
    'Reactive Measures': risk.reactiveMeasures || '',
    'Consortium(s)': consortiumNames,
    'Status': risk.status || '',
    'Created At': risk.createdAt ? new Date(risk.createdAt).toLocaleDateString() : '',
  };

  if (index !== undefined) {
    return { '#': index + 1, ...row };
  }
  return row;
}

const COL_WIDTHS = [
  { wch: 4 },   // # (only for bulk)
  { wch: 30 },  // Risk Title
  { wch: 12 },  // Risk Code
  { wch: 18 },  // Category
  { wch: 40 },  // Risk Statement
  { wch: 22 },  // Likelihood
  { wch: 22 },  // Severity
  { wch: 14 },  // Risk Ranking
  { wch: 30 },  // Trigger Indicator
  { wch: 16 },  // Trigger Status
  { wch: 40 },  // Mitigation Measures
  { wch: 40 },  // Preventive Measures
  { wch: 40 },  // Reactive Measures
  { wch: 30 },  // Consortium(s)
  { wch: 12 },  // Status
  { wch: 14 },  // Created At
];

function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportRisksToExcel(risks: Risk[]) {
  const rows = risks.map((risk, idx) => riskToRow(risk, idx));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = COL_WIDTHS;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Shared Risk Register');

  const fileName = `Shared_Risk_Register_${new Date().toISOString().slice(0, 10)}.xlsx`;
  downloadWorkbook(workbook, fileName);
}

export function exportSingleRiskToExcel(risk: Risk) {
  const row = riskToRow(risk);
  const worksheet = XLSX.utils.json_to_sheet([row]);
  worksheet['!cols'] = COL_WIDTHS.slice(1); // no # column for single risk

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Risk Details');

  const safeName = (risk.title || 'Risk').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().substring(0, 40);
  const fileName = `Risk_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  downloadWorkbook(workbook, fileName);
}
