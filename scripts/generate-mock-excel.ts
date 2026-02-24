import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

async function generateMockExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Output');

    // Let's create some dummy rows that our parser will find
    // Our parser looks for the string "Name" in the row to consider it header row
    // Then columns: 1: contract_number, 2: date, 3: code, 4: name, 5: federal_id, 6: contract, 7: paid_to_date, 8: paid_quarter

    sheet.addRow(['Project Details']);
    sheet.addRow(['Project No.', '161026-04']);
    sheet.addRow(['Project Name', 'RENOVATE PLANT SCIENCE BUILDING']);
    sheet.addRow(['Contractor', 'LeChase Construction Services, LLC']);
    sheet.addRow([]);

    sheet.addRow([
        'Contract Number',
        'Date',
        'Code',
        'Subcontractor Name',
        'Federal ID',
        'Total Contract',
        'Total Paid to Date',
        'Total Paid this Quarter'
    ]);

    sheet.addRow(['CN-0001', '2026-02-23', 'MBE', 'Acme Corporation', '12-3456789', 1500000, 750000, 300000]);
    sheet.addRow(['CN-0002', '2026-02-23', 'WBE', 'Stark Industries', '98-7654321', 800000, 400000, 50000]);
    sheet.addRow(['CN-0003', '2026-02-23', 'SDVOB', 'Wayne Enterprises', '11-2233445', 300000, 100000, 20000]);
    sheet.addRow(['CN-0004', '2026-02-23', 'MBE', 'Globex', '22-3344556', 2500000, 1200000, 400000]);

    const filePath = path.join(process.cwd(), 'mock_data.xlsx');
    await workbook.xlsx.writeFile(filePath);

    console.log(`Mock Excel generated at ${filePath}`);
}

generateMockExcel().catch(console.error);
