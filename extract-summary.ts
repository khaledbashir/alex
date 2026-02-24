import ExcelJS from 'exceljs';
import fs from 'fs';

async function extract(filePath: string, outFile: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const result: any = {};
    for (const worksheet of workbook.worksheets) {
        result[worksheet.name] = {
            rowCount: worksheet.rowCount,
            colCount: worksheet.columnCount,
            rows: []
        };
        for (let i = 1; i <= Math.min(10, worksheet.rowCount); i++) {
            result[worksheet.name].rows.push(worksheet.getRow(i).values);
        }
    }
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
}

async function main() {
    await extract('/root/alex/raw data.xlsx', '/root/alex/raw-data-summary.json').catch(e => console.log(e));
    await extract('/root/alex/Q4 2025.xlsx', '/root/alex/q4-summary.json').catch(e => console.log(e));
}

main();
