import { create } from 'zustand';

export interface Subcontractor {
    id: string;
    contract_number: string;
    date: string;
    code: string; // e.g. MBE, WBE, SDVOB, Non-MWBE
    name: string;
    federal_id: string;
    total_contract: number;
    towards_goal: number;
    total_paid_to_date: number;
    total_paid_this_quarter: number;
    balance: number;
    cert_received: boolean;
    trade_designation?: string;
}

export interface WorkforceDemographic {
    employer: string;
    month: string;
    asian: number;
    black: number;
    hispanic: number;
    white: number;
    pacific_islander: number;
    unknown: number;
}

// --- PROJECT 2 INTERFACES ---
export interface Project2Utilization {
    id: string;
    company: string;
    value: number;
    towards_goal: number;
    paid_to_date: number;
    pending_payment: number;
}

export interface Project2EEOData {
    id: string;
    company: string;
    quarter: string;
    race_ethnicity: string;
    gender: string;
    num_employees: number;
    hours_worked: number;
    gross_wages: number;
}

export interface ReportState {
    project_details: {
        project_no: string;
        project_name: string;
        contractor: string;
        total_contract_value?: number;
    };
    diversity_goals: {
        MBE: number;
        WBE: number;
        SDVOB: number;
    };
    mwbe_sdvob_subcontractors_report: Subcontractor[];
    workforce_demographics: WorkforceDemographic[];

    // Project 2
    project2_utilization: Project2Utilization[];
    project2_eeo_data: Project2EEOData[];

    setReportData: (data: Partial<Omit<ReportState, 'setReportData' | 'updateSubcontractor' | 'updateWorkforce'>>) => void;
    updateSubcontractor: (id: string, data: Partial<Subcontractor>) => void;
}

export const useReportStore = create<ReportState>((set) => ({
    project_details: { project_no: '', project_name: '', contractor: '', total_contract_value: 0 },
    diversity_goals: { MBE: 0.15, WBE: 0.15, SDVOB: 0.06 },
    mwbe_sdvob_subcontractors_report: [],
    workforce_demographics: [],

    project2_utilization: [],
    project2_eeo_data: [],

    setReportData: (data) => set((state) => ({ ...state, ...data })),

    updateSubcontractor: (id, data) =>
        set((state) => ({
            mwbe_sdvob_subcontractors_report: state.mwbe_sdvob_subcontractors_report.map((sub) =>
                sub.id === id ? { ...sub, ...data } : sub
            ),
        })),
}));
