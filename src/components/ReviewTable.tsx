"use client";

import { useReportStore } from '@/store/reportStore';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
} from '@tanstack/react-table';
import { Subcontractor } from '@/store/reportStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

export default function ReviewTable() {
    const subcontractors = useReportStore((state) => state.mwbe_sdvob_subcontractors_report);
    const updateSubcontractor = useReportStore((state) => state.updateSubcontractor);

    const columns: ColumnDef<Subcontractor>[] = [
        {
            accessorKey: 'name',
            header: 'Subcontractor Name',
        },
        {
            accessorKey: 'code',
            header: 'Code (MBE/WBE)',
        },
        {
            accessorKey: 'total_contract',
            header: 'Total Contract',
            cell: ({ row, getValue }) => {
                const value = getValue() as number;
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateSubcontractor(row.original.id, { total_contract: Number(e.target.value) })}
                        className="w-32 bg-background border-muted"
                    />
                );
            }
        },
        {
            accessorKey: 'total_paid_to_date',
            header: 'Paid to Date',
            cell: ({ row, getValue }) => {
                const value = getValue() as number;
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateSubcontractor(row.original.id, { total_paid_to_date: Number(e.target.value) })}
                        className="w-32 bg-background border-muted"
                    />
                );
            }
        },
        {
            accessorKey: 'total_paid_this_quarter',
            header: 'Paid This Qtr',
            cell: ({ row, getValue }) => {
                const value = getValue() as number;
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateSubcontractor(row.original.id, { total_paid_this_quarter: Number(e.target.value) })}
                        className="w-32 bg-background border-muted"
                    />
                );
            }
        },
        {
            accessorKey: 'balance',
            header: 'Balance',
            cell: ({ row, getValue }) => {
                const value = getValue() as number;
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateSubcontractor(row.original.id, { balance: Number(e.target.value) })}
                        className="w-32 bg-background border-muted"
                    />
                );
            }
        }
    ];

    const table = useReactTable({
        data: subcontractors,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (subcontractors.length === 0) return null;

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
