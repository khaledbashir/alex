"use client";

import { useReportStore } from '@/store/reportStore';
import { exportMWBEExcel } from '@/lib/excelExporter';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportSection() {
    const data = useReportStore();
    const hasData = data.mwbe_sdvob_subcontractors_report.length > 0;

    const handleExport = async () => {
        try {
            const buffer = await exportMWBEExcel(data);
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `MWBE_Report_${data.project_details.project_no || 'Export'}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Report Downloaded', { description: 'The formatted Excel report has been generated successfully.' });
        } catch (error: any) {
            toast.error('Export Failed', { description: error.message });
        }
    };

    if (!hasData) return null;

    return (
        <div className="flex justify-end p-4 border-t border-muted/50 bg-card rounded-b-xl shadow-lg mt-8">
            <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
                <Download className="mr-2 h-4 w-4" />
                Export Formatted Report
            </Button>
        </div>
    );
}
