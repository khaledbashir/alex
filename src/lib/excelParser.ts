import ExcelJS from 'exceljs';
import { Subcontractor, ReportState, WorkforceDemographic } from '@/store/reportStore';

export async function parseMWBEExcel(file: File): Promise<Partial<Omit<ReportState, 'setReportData' | 'updateSubcontractor' | 'updateWorkforce'>>> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const subsSheet = workbook.getWorksheet('Dec 2025 Payments Raw Data');
    const workforceSheet = workbook.getWorksheet('For Q4 Report');
    const utilSheet = workbook.getWorksheet('Table 1');
    const eeoDataSheet = workbook.getWorksheet('Data');

    // -- PROJECT 1 PARSER --
    if (subsSheet) {
        return parseProject1(subsSheet, workforceSheet);
    }

    // -- PROJECT 2 (Utilization) PARSER --
    if (utilSheet) {
        return parseProject2Utilization(utilSheet);
    }

    // -- PROJECT 2 (EEO Data) PARSER --
    if (eeoDataSheet) {
        return parseProject2EEO(eeoDataSheet);
    }

    throw new Error('Unrecognized Excel format. Could not find recognizable sheets (e.g. "Dec 2025 Payments Raw Data", "Table 1", or "Data").');
}

function parseProject1(subsSheet: ExcelJS.Worksheet, workforceSheet: ExcelJS.Worksheet | undefined) {
    const subcontractors: Subcontractor[] = [];

    // Parse "Dec 2025 Payments Raw Data" starting from row 5
    subsSheet.eachRow((row, rowNumber) => {
        if (rowNumber < 5) return;

        const name = row.getCell(5).text?.trim(); // Awarded Contractor
        if (!name || name === 'TOTAL IN YELLOW' || name === 'Awarded Contractor') return;

        const tradeDesignation = row.getCell(6).text?.trim()?.toLowerCase() || ''; // Trade Designation
        const code = row.getCell(8).text?.trim() || 'Non-M/WBE'; // Certification Status
        const cert_received = !!row.getCell(27).value; // Certificate Re c'd is col 27 (often "Dec 2025\n1-15-26" etc.)

        // Grab contracts / payments safely by summing depending on MBE/WBE/SDVOB/Non-MWBE
        // Usually, the values exist in the respective columns. Let's look across them or just take the max if organized weirdly.
        const nonMwbeContract = Number(row.getCell(12).result ?? row.getCell(12).value) || 0;
        const sdvobContract = Number(row.getCell(16).result ?? row.getCell(16).value) || 0;
        const mbeContract = Number(row.getCell(20).result ?? row.getCell(20).value) || 0;
        const wbeContract = Number(row.getCell(24).result ?? row.getCell(24).value) || 0;

        const total_contract = Math.max(nonMwbeContract, sdvobContract, mbeContract, wbeContract);

        // Paid to date
        const nonMwbePaid = Number(row.getCell(32).result ?? row.getCell(32).value) || 0;
        const mbePaid = Number(row.getCell(33).result ?? row.getCell(33).value) || 0;
        const wbePaid = Number(row.getCell(34).result ?? row.getCell(34).value) || 0;
        // SDVOB paid isn't cleanly labeled but we'll assume total payment to date is accurate
        const totalPaidToDate = Number(row.getCell(37).result ?? row.getCell(37).value) || 0;
        const paidThisQuarter = Number(row.getCell(36).result ?? row.getCell(36).value) || 0;

        // Towards Goal: 60% if it's just a supplier
        const isSupplier = tradeDesignation.includes('supplier');
        const towards_goal = isSupplier ? total_contract * 0.6 : total_contract;

        subcontractors.push({
            id: `sub-${rowNumber}`,
            contract_number: `BP-${rowNumber}`, // fallback as BP# often empty
            date: new Date().toISOString().split('T')[0],
            code,
            name,
            federal_id: 'N/A', // not present in raw data typically
            total_contract,
            towards_goal,
            total_paid_to_date: totalPaidToDate,
            total_paid_this_quarter: paidThisQuarter,
            balance: total_contract - totalPaidToDate,
            cert_received,
            trade_designation: tradeDesignation
        });
    });

    // Parse "For Q4 Report" for Workforce demographics
    const demographicsMap: Record<string, WorkforceDemographic> = {};
    if (workforceSheet) {
        workforceSheet.eachRow((row, rowNumber) => {
            if (rowNumber < 9) return; // Data starts at row 9

            const employer = row.getCell(4).text?.trim(); // Employer
            if (!employer) return;

            const dateText = row.getCell(1).text?.trim() || ""; // Date/Time often starts string
            // Approximate month from date just to have it
            let month = 'Q4 2025';

            const ethnicity = row.getCell(7).text?.trim()?.toLowerCase() || 'unknown'; // Ethnicity

            const key = `${employer}-${month}`;
            if (!demographicsMap[key]) {
                demographicsMap[key] = {
                    employer, month, asian: 0, black: 0, hispanic: 0, white: 0, pacific_islander: 0, unknown: 0
                };
            }

            if (ethnicity.includes('asian')) demographicsMap[key].asian++;
            else if (ethnicity.includes('black')) demographicsMap[key].black++;
            else if (ethnicity.includes('hispanic')) demographicsMap[key].hispanic++;
            else if (ethnicity.includes('white')) demographicsMap[key].white++;
            else if (ethnicity.includes('pacific')) demographicsMap[key].pacific_islander++;
            else demographicsMap[key].unknown++;
        });
    }

    const workforce_demographics = Object.values(demographicsMap);

    return {
        project_details: {
            project_no: "161026-04",
            project_name: "RENOVATE PLANT SCIENCE BUILDING",
            contractor: "LeChase Construction Services, LLC"
        },
        diversity_goals: {
            MBE: 0.15,
            WBE: 0.15,
            SDVOB: 0.06
        },
        mwbe_sdvob_subcontractors_report: subcontractors,
        workforce_demographics
    };
}

function parseProject2Utilization(utilSheet: ExcelJS.Worksheet) {
    const records: any[] = [];

    utilSheet.eachRow((row, rowNumber) => {
        if (rowNumber < 2) return; // Skip headers

        const company = row.getCell(2).text?.trim();
        if (!company) return;

        const value = Number(row.getCell(3).result ?? row.getCell(3).value) || 0;
        const paid_to_date = Number(row.getCell(4).result ?? row.getCell(4).value) || 0;
        const pending_payment = Number(row.getCell(5).result ?? row.getCell(5).value) || 0;

        records.push({
            id: `p2-util-${rowNumber}`,
            company,
            value,
            towards_goal: value, // Placeholder, no strict 60% rule visible here yet
            paid_to_date,
            pending_payment
        });
    });

    return { project2_utilization: records };
}

function parseProject2EEO(dataSheet: ExcelJS.Worksheet) {
    const records: any[] = [];

    dataSheet.eachRow((row, rowNumber) => {
        if (rowNumber < 2) return; // Skip headers

        const company = row.getCell(2).text?.trim();
        if (!company) return;

        const year = row.getCell(3).value;
        const quarter = row.getCell(5).text?.trim() || String(year);

        const race_ethnicity = row.getCell(10).text?.trim() || 'Unknown';
        const gender = row.getCell(11).text?.trim() || 'Unknown';
        const num_employees = Number(row.getCell(12).value) || 0;
        const hours_worked = Number(row.getCell(13).value) || 0;
        const gross_wages = Number(row.getCell(14).value) || 0;

        records.push({
            id: `p2-eeo-${rowNumber}`,
            company,
            quarter,
            race_ethnicity,
            gender,
            num_employees,
            hours_worked,
            gross_wages
        });
    });

    return { project2_eeo_data: records };
}
