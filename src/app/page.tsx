"use client";

import FileUpload from '@/components/FileUpload';
import ReviewTable from '@/components/ReviewTable';
import DashboardCharts from '@/components/DashboardCharts';
import ExportSection from '@/components/ExportSection';
import { useReportStore } from '@/store/reportStore';
import { Briefcase } from 'lucide-react';

export default function Home() {
  const hasData = useReportStore((state) => state.mwbe_sdvob_subcontractors_report.length > 0);
  const projectInfo = useReportStore((state) => state.project_details);

  return (
    <div className="min-h-screen bg-background text-foreground tracking-tight selection:bg-primary/30">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">
              MWBE & Workforce Engine
            </span>
          </div>
          {hasData && (
            <div className="text-sm font-medium text-muted-foreground flex space-x-4">
              <span className="bg-muted px-3 py-1 rounded-full">{projectInfo.project_no}</span>
              <span className="bg-muted px-3 py-1 rounded-full hidden md:inline-block">{projectInfo.project_name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">

        {/* Intro / Upload Section */}
        <section className="max-w-3xl mx-auto space-y-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          {!hasData && (
            <>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Automate your <span className="text-primary">Financial Reporting.</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Upload your raw data dump to instantly parse subcontractor info, track diversity goals, and export the finalized client-ready report.
              </p>
            </>
          )}
          <FileUpload />
        </section>

        {/* Dashboard & Data Grid Section */}
        {hasData && (
          <section className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150 fill-mode-both">

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Dashboard Overview
              </h2>
              <DashboardCharts />
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Review & Override
              </h2>
              <p className="text-muted-foreground">Make any necessary manual adjustments before generating the final report.</p>
              <ReviewTable />
              <ExportSection />
            </div>

          </section>
        )}

      </main>
    </div>
  );
}
