import ExcelJS from 'exceljs';

async function main() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('/root/alex/raw data.xlsx');
    const sheet = workbook.getWorksheet('Dec 2025 Payments Raw Data');

    if (!sheet) {
        console.log("Sheet not found");
        return;
    }

    const headerRow = sheet.getRow(3);
    const mapping: any = {};
    headerRow.eachCell((cell, colNumber) => {
        mapping[colNumber] = cell.value;
    });

    console.log("Dec 2025 Payments Raw Data Headers:");
    for (const [col, val] of Object.entries(mapping)) {
        console.log(`Col ${col}: ${val}`);
    }

    const q4Sheet = workbook.getWorksheet('For Q4 Report');
    if (q4Sheet) {
        const headerRowQ4 = q4Sheet.getRow(8);
        const mappingQ4: any = {};
        headerRowQ4.eachCell((cell, colNumber) => {
            mappingQ4[colNumber] = cell.value;
        });
        console.log("\nFor Q4 Report Headers (Row 8):");
        for (const [col, val] of Object.entries(mappingQ4)) {
            console.log(`Col ${col}: ${val}`);
        }
    }

}

main().catch(console.error);
