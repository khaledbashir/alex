import ExcelJS from 'exceljs';
import * as fs from 'fs';

async function summarizeExcel(filePath: string) {
    console.log(`\n\n=== SUMMARIZING: ${filePath} ===`);
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        workbook.eachSheet((worksheet, sheetId) => {
            console.log(`\n-- Sheet: "${worksheet.name}" (ID: ${sheetId}) --`);
            const rowCount = worksheet.rowCount;
            const colCount = worksheet.columnCount;
            console.log(`Dimensions: ${rowCount} rows x ${colCount} columns`);

            console.log(`First 5 rows:`);
            let rowsShown = 0;
            worksheet.eachRow((row, rowNumber) => {
                if (rowsShown < 5) {
                    console.log(`Row ${rowNumber}:`, JSON.stringify(row.values));
                    rowsShown++;
                }
            });
        });
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
    }
}

async function main() {
    const files = [
        './raw data participation.xlsx',
        './Utilization Payment Data.xlsx',
        './EEO Data 2.10.26.xlsx'
    ];

    for (const file of files) {
        if (fs.existsSync(file)) {
            await summarizeExcel(file);
        } else {
            console.log(`\n\n=== FILE NOT FOUND: ${file} ===`);
        }
    }
}

main();
