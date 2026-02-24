import ExcelJS from 'exceljs';

async function inspect(filePath: string) {
    console.log(`\n\n=== Inspecting ${filePath} ===\n`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    for (const worksheet of workbook.worksheets) {
        console.log(`\nSheet: "${worksheet.name}"`);
        console.log(`Dimensions: ${worksheet.rowCount} rows x ${worksheet.columnCount} columns`);

        // get first 10 rows
        for (let i = 1; i <= Math.min(10, worksheet.rowCount); i++) {
            const row = worksheet.getRow(i);
            console.log(`Row ${i}:`, row.values);
        }
    }
}

async function main() {
    await inspect('/tmp/raw data.xlsx').catch(e => console.log(e));
    await inspect('/root/alex/raw data.xlsx').catch(e => console.log(e));
    await inspect('/root/alex/Q4 2025.xlsx').catch(e => console.log(e));
}

main();
