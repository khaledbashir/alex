"use client";

import { useReportStore } from '@/store/reportStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardCharts() {
    const subcontractors = useReportStore((state) => state.mwbe_sdvob_subcontractors_report);
    const goals = useReportStore((state) => state.diversity_goals);
    const workforce = useReportStore((state) => state.workforce_tracking_ad_sheet);

    if (subcontractors.length === 0) return null;

    // Calculate Aggregates
    const totalContract = subcontractors.reduce((acc, curr) => acc + curr.total_contract, 0);
    const totalPaid = subcontractors.reduce((acc, curr) => acc + curr.total_paid_to_date, 0);

    const mbePaid = subcontractors.filter(s => s.code === 'MBE').reduce((acc, curr) => acc + curr.total_paid_to_date, 0);
    const wbePaid = subcontractors.filter(s => s.code === 'WBE').reduce((acc, curr) => acc + curr.total_paid_to_date, 0);
    const sdvobPaid = subcontractors.filter(s => s.code === 'SDVOB').reduce((acc, curr) => acc + curr.total_paid_to_date, 0);

    const mbePct = totalPaid > 0 ? (mbePaid / totalPaid) : 0;
    const wbePct = totalPaid > 0 ? (wbePaid / totalPaid) : 0;
    const sdvobPct = totalPaid > 0 ? (sdvobPaid / totalPaid) : 0;

    const diversityData = [
        { name: 'MBE', current: mbePct * 100, goal: goals.MBE * 100 },
        { name: 'WBE', current: wbePct * 100, goal: goals.WBE * 100 },
        { name: 'SDVOB', current: sdvobPct * 100, goal: goals.SDVOB * 100 },
    ];

    const financialData = [
        { name: 'Total Contract', amount: totalContract },
        { name: 'Total Paid to Date', amount: totalPaid },
    ];

    const workforceData = [
        { name: 'African American', hours: workforce.african_american },
        { name: 'Hispanic', hours: workforce.hispanic },
        { name: 'Women', hours: workforce.women },
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Financials Overview */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-muted/50 bg-card">
                <CardHeader>
                    <CardTitle className="text-xl">Financial Overview</CardTitle>
                    <CardDescription>Contract value vs paid amount</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financialData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={(val) => `$${val / 1000}k`} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Diversity Goals Tracking */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-muted/50 bg-card">
                <CardHeader>
                    <CardTitle className="text-xl">Diversity Goals Tracking</CardTitle>
                    <CardDescription>Current % Paid vs Required Goals %</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={diversityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} cursor={{ fill: 'transparent' }} />
                            <Legend />
                            <Bar dataKey="current" name="Current %" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            <Bar dataKey="goal" name="Goal %" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={20} opacity={0.5} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Workforce Demographics */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-muted/50 bg-card md:col-span-2 xl:col-span-1">
                <CardHeader>
                    <CardTitle className="text-xl">Workforce Tracking</CardTitle>
                    <CardDescription>Total hours by demographic</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={workforceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="hours"
                            >
                                {workforceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `${value} Hrs`} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

        </div>
    );
}
