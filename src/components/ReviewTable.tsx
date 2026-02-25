"use client";

import { flexRender, getCoreRowModel, useReactTable, ColumnDef } from '@tanstack/react-table';
import { Subcontractor, Project2Utilization } from '@/store/reportStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface ReviewTableProps {
    data: any[];
    isProject2: boolean;
    onUpdate: (newData: any[]) => void;
}

export default function ReviewTable({ data, isProject2, onUpdate }: ReviewTableProps) {
    const handleUpdate = (id: string, field: string, value: any) => {
        const newData = data.map(item => item.id === id ? { ...item, [field]: value } : item);
        onUpdate(newData);
    };

    const columns: ColumnDef<any>[] = isProject2 ? [
        { accessorKey: 'company', header: 'Company' },
        {
            accessorKey: 'value',
            header: 'Contract Value',
            cell: ({ row }) => (
                <Input
                    type="number"
                    value={row.original.value}
                    onChange={(e) => handleUpdate(row.original.id, 'value', Number(e.target.value))}
                    className="w-28"
                />
            )
        },
        {
            accessorKey: 'towards_goal',
            header: 'Towards Goal',
            cell: ({ row }) => (
                <Input
                    type="number"
                    value={row.original.towards_goal}
                    onChange={(e) => handleUpdate(row.original.id, 'towards_goal', Number(e.target.value))}
                    className="w-28"
                />
            )
        },
        {
            accessorKey: 'paid_to_date',
            header: 'Paid to Date',
            cell: ({ row }) => (
                <Input
                    type="number"
                    value={row.original.paid_to_date}
                    onChange={(e) => handleUpdate(row.original.id, 'paid_to_date', Number(e.target.value))}
                    className="w-28"
                />
            )
        }
    ] : [
        { accessorKey: 'name', header: 'Subcontractor Name' },
        { accessorKey: 'code', header: 'Code' },
        {
            accessorKey: 'cert_received',
            header: 'Cert Rec\'d',
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.original.cert_received}
                    onChange={(e) => handleUpdate(row.original.id, 'cert_received', e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                />
            )
        },
        {
            accessorKey: 'total_contract',
            header: 'Total Contract',
            cell: ({ row }) => (
                <Input
                    type="number"
                    value={row.original.total_contract}
                    onChange={(e) => handleUpdate(row.original.id, 'total_contract', Number(e.target.value))}
                    className="w-28"
                />
            )
        },
        {
            accessorKey: 'towards_goal',
            header: 'Towards Goal',
            cell: ({ row }) => (
                <Input
                    type="number"
                    value={row.original.towards_goal}
                    onChange={(e) => handleUpdate(row.original.id, 'towards_goal', Number(e.target.value))}
                    className="w-28"
                />
            )
        },
        {
            accessorKey: 'total_paid_to_date',
            header: 'Paid to Date',
            cell: ({ row }) => (
                <Input
                    type="number"
                    value={row.original.total_paid_to_date}
                    onChange={(e) => handleUpdate(row.original.id, 'total_paid_to_date', Number(e.target.value))}
                    className="w-28"
                />
            )
        }
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (!data.length) return <p className="text-center p-8 text-muted-foreground">No data available for review.</p>;

    return (
        <div className="rounded-md border bg-card overflow-x-auto">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((group) => (
                        <TableRow key={group.id}>
                            {group.headers.map((header) => (
                                <TableHead key={header.id} className="whitespace-nowrap">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="p-2">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
