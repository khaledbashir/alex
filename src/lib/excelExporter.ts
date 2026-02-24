import ExcelJS from 'exceljs';
import { ReportState } from '@/store/reportStore';

export async function exportMWBEExcel(data: Omit<ReportState, 'setReportData' | 'updateSubcontractor' | 'updateWorkforce'>) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('MWBE & Workforce Report');

    // Set column widths
    sheet.columns = [
        { header: 'Contract No.', key: 'contract_number', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Code', key: 'code', width: 10 },
        { header: 'Subcontractor Name', key: 'name', width: 35 },
        { header: 'Federal ID', key: 'federal_id', width: 15 },
        { header: 'Total Contract', key: 'total_contract', width: 20 },
        { header: 'Total Paid to Date', key: 'total_paid_to_date', width: 20 },
        { header: 'Paid This Quarter', key: 'total_paid_this_quarter', width: 20 },
        { header: 'Balance', key: 'balance', width: 20 },
    ];

    // Header Styling
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF004488' } // Dark blue
    };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Add Data
    data.mwbe_sdvob_subcontractors_report.forEach(sub => {
        sheet.addRow({
            contract_number: sub.contract_number,
            date: sub.date,
            code: sub.code,
            name: sub.name,
            federal_id: sub.federal_id,
            total_contract: sub.total_contract,
            total_paid_to_date: sub.total_paid_to_date,
            total_paid_this_quarter: sub.total_paid_this_quarter,
            balance: sub.balance,
        });
    });

    // Number formats for currency columns
    ['F', 'G', 'H', 'I'].forEach(col => {
        sheet.getColumn(col).numFmt = '"$"#,##0.00';
    });

    // Add Project Info Summary below table
    const summaryStart = data.mwbe_sdvob_subcontractors_report.length + 3;
    sheet.getCell(`A${summaryStart}`).value = 'Project Details';
    sheet.getCell(`A${summaryStart}`).font = { bold: true };

    sheet.getCell(`A${summaryStart + 1}`).value = 'Project No.';
    sheet.getCell(`B${summaryStart + 1}`).value = data.project_details.project_no;

    sheet.getCell(`A${summaryStart + 2}`).value = 'Project Name';
    sheet.getCell(`B${summaryStart + 2}`).value = data.project_details.project_name;

    sheet.getCell(`A${summaryStart + 3}`).value = 'Contractor';
    sheet.getCell(`B${summaryStart + 3}`).value = data.project_details.contractor;

    // Add Diversity Goals Summary
    sheet.getCell(`D${summaryStart}`).value = 'Diversity Goals';
    sheet.getCell(`D${summaryStart}`).font = { bold: true };

    sheet.getCell(`D${summaryStart + 1}`).value = 'MBE';
    sheet.getCell(`E${summaryStart + 1}`).value = data.diversity_goals.MBE;
    sheet.getCell(`E${summaryStart + 1}`).numFmt = '0%';

    sheet.getCell(`D${summaryStart + 2}`).value = 'WBE';
    sheet.getCell(`E${summaryStart + 2}`).value = data.diversity_goals.WBE;
    sheet.getCell(`E${summaryStart + 2}`).numFmt = '0%';

    sheet.getCell(`D${summaryStart + 3}`).value = 'SDVOB';
    sheet.getCell(`E${summaryStart + 3}`).value = data.diversity_goals.SDVOB;
    sheet.getCell(`E${summaryStart + 3}`).numFmt = '0%';

    return await workbook.xlsx.writeBuffer();
}
