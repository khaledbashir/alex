"use client";

import { useDropzone } from 'react-dropzone';
import { useReportStore } from '@/store/reportStore';
import { parseMWBEExcel } from '@/lib/excelParser';
import { UploadCloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function FileUpload() {
    const setReportData = useReportStore((state) => state.setReportData);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        onDrop: async (acceptedFiles) => {
            try {
                if (acceptedFiles.length === 0) return;

                let accumulatedData: any = {};

                // Process all dropped files concurrently or sequentially
                for (const file of acceptedFiles) {
                    const data = await parseMWBEExcel(file);
                    accumulatedData = { ...accumulatedData, ...data };
                }

                setReportData(accumulatedData);

                const numRecords = (accumulatedData.mwbe_sdvob_subcontractors_report?.length || 0) +
                    (accumulatedData.project2_utilization?.length || 0) +
                    (accumulatedData.project2_eeo_data?.length || 0);

                toast.success(`Successfully processed ${acceptedFiles.length} file(s)`, {
                    description: `Loaded ${numRecords} total records.`
                });
            } catch (err: any) {
                toast.error('Failed to parse file', {
                    description: err.message
                });
            }
        }
    });

    return (
        <Card className="p-8 border-dashed border-2 bg-muted/50 transition-colors hover:bg-muted duration-300">
            <div {...getRootProps()} className="flex flex-col items-center justify-center cursor-pointer space-y-4">
                <input {...getInputProps()} />
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <UploadCloud className="w-8 h-8" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">
                        {isDragActive ? "Drop the files here" : "Click or drag your raw Excel file(s) here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Supports .xlsx and .xls formats
                    </p>
                </div>
            </div>
        </Card>
    );
}
