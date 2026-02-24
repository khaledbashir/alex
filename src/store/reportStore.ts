import { create } from 'zustand';

export interface Subcontractor {
    id: string;
    contract_number: string;
    date: string;
    code: string; // e.g. MBE, WBE, SDVOB
    name: string;
    federal_id: string;
    total_contract: number;
    total_paid_to_date: number;
    total_paid_this_quarter: number;
    balance: number;
}

export interface ReportState {
    project_details: {
        project_no: string;
        project_name: string;
        contractor: string;
    };
    diversity_goals: {
        MBE: number;
        WBE: number;
        SDVOB: number;
    };
    mwbe_sdvob_subcontractors_report: Subcontractor[];
    workforce_tracking_ad_sheet: {
        african_american: number;
        hispanic: number;
        women: number;
    };
    setReportData: (data: Partial<Omit<ReportState, 'setReportData' | 'updateSubcontractor'>>) => void;
    updateSubcontractor: (id: string, data: Partial<Subcontractor>) => void;
    updateWorkforce: (data: Partial<ReportState['workforce_tracking_ad_sheet']>) => void;
}

export const useReportStore = create<ReportState>((set) => ({
    project_details: { project_no: '', project_name: '', contractor: '' },
    diversity_goals: { MBE: 0.15, WBE: 0.15, SDVOB: 0.06 },
    mwbe_sdvob_subcontractors_report: [],
    workforce_tracking_ad_sheet: { african_american: 0, hispanic: 0, women: 0 },

    setReportData: (data) => set((state) => ({ ...state, ...data })),

    updateSubcontractor: (id, data) =>
        set((state) => ({
            mwbe_sdvob_subcontractors_report: state.mwbe_sdvob_subcontractors_report.map((sub) =>
                sub.id === id ? { ...sub, ...data } : sub
            ),
        })),

    updateWorkforce: (data) =>
        set((state) => ({
            workforce_tracking_ad_sheet: { ...state.workforce_tracking_ad_sheet, ...data }
        }))
}));
