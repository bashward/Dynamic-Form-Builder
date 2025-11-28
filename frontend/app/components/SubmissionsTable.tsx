'use client';

import { useQuery } from '@tanstack/react-query';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
    SortingState,
    PaginationState,
} from '@tanstack/react-table';
import { Submission } from '../types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Loader2, ArrowUpDown, ChevronRight, Code, Search, Download, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const fetchSubmissions = async (page: number, limit: number, sortBy: string, sortOrder: string, search: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        search,
    });
    const res = await fetch(`https://dynamic-form-builder-backend.vercel.app/submissions?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
};

const deleteSubmission = async (id: string) => {
    const res = await fetch(`https://dynamic-form-builder-backend.vercel.app/submissions/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete submission');
    return res.json();
};

export default function SubmissionsTable() {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();
    const router = useRouter();
    const { toast } = useToast();

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useMemo(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['submissions', pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch],
        queryFn: () => fetchSubmissions(
            pagination.pageIndex + 1,
            pagination.pageSize,
            sorting[0]?.id || 'createdAt',
            sorting[0]?.desc ? 'desc' : 'asc',
            debouncedSearch
        ),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSubmission,
        onSuccess: () => {
            toast({
                title: "Deleted Successfully",
                description: "The submission has been deleted.",
            });
            queryClient.invalidateQueries({ queryKey: ['submissions'] });
        },
        onError: (err) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message,
            });
        }
    });

    const handleExportCSV = () => {
        if (!data?.data) return;

        const headers = ['ID', 'Created At', 'Data'];
        const rows = data.data.map((sub: Submission) => [
            sub.id,
            format(new Date(sub.createdAt), 'PP pp'),
            JSON.stringify(sub.data).replace(/"/g, '""')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'submissions.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = useMemo<ColumnDef<Submission>[]>(
        () => [
            {
                accessorKey: 'id',
                header: 'ID',
                cell: (info) => <span className="font-mono text-xs">{info.getValue() as string}</span>,
            },
            {
                accessorKey: 'createdAt',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Created At
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: (info) => format(new Date(info.getValue() as string), 'PP pp'),
            },
            {
                id: 'data',
                header: 'Data',
                cell: (info) => <DataCell data={info.row.original.data} />
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: (info) => (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/submission/${info.row.original.id}`)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the submission.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => deleteMutation.mutate(info.row.original.id)}
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )
            }
        ],
        []
    );

    const table = useReactTable({
        data: data?.data || [],
        columns,
        pageCount: data?.meta.totalPages || -1,
        state: {
            pagination,
            sorting,
        },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
    });

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <div className="text-red-500 p-10">Error loading submissions: {error.message}</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search submissions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
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

            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

function DataCell({ data }: { data: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="w-full max-w-md">
            <div
                className={cn(
                    "flex items-center gap-2 cursor-pointer group w-fit rounded-md px-2 py-1 transition-colors",
                    isExpanded ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={cn("transition-transform duration-200", isExpanded && "rotate-90")}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-2">
                    {!isExpanded && <Code className="h-3 w-3" />}
                    {isExpanded ? "Hide Data" : "View JSON"}
                </span>
            </div>
            <div
                className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
            >
                <div className="overflow-hidden">
                    <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 text-xs text-slate-50 overflow-x-auto border border-slate-800">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
