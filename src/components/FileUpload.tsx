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
                const file = acceptedFiles[0];
                const data = await parseMWBEExcel(file);
                setReportData(data);
                toast.success('Excel file imported successfully!', {
                    description: `Loaded ${data.mwbe_sdvob_subcontractors_report.length} records.`
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
                        {isDragActive ? "Drop the file here" : "Click or drag your raw Excel dump here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Supports .xlsx and .xls formats
                    </p>
                </div>
            </div>
        </Card>
    );
}
