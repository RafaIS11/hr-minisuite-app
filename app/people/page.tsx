"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from "@tanstack/react-table";
import { MoreVertical, User, Download, Trash2, Mail, Eye, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { AddEmployeeDrawer } from "@/components/shared/AddEmployeeDrawer";

interface Employee {
    id: string;
    nombre: string;
    email: string;
    puesto: string;
    salario_base: number | null;
    fecha_alta: string;
}

const columnHelper = createColumnHelper<Employee>();

export default function PeoplePage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const fetchEmployees = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("empleados")
            .select("*")
            .order("nombre", { ascending: true });

        if (error) {
            console.error("Error fetching employees:", error);
        } else {
            setEmployees(data || []);
        }
        setLoading(false);
    };

    const handleAction = async (id: string, action: string) => {
        if (action === 'view' || action === 'edit') {
            const emp = employees.find(e => e.id === id);
            setSelectedEmployee(emp);
            setIsDrawerOpen(true);
        } else if (action === 'delete') {
            if (confirm("¿Estás seguro de eliminar este empleado?")) {
                const { error } = await supabase.from("empleados").delete().eq("id", id);
                if (error) alert(error.message);
                else fetchEmployees();
            }
        }
    };

    useEffect(() => {
        fetchEmployees();

        const peopleChannel = supabase
            .channel('people_directory_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'empleados' }, () => {
                fetchEmployees();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(peopleChannel);
        };
    }, []);

    const columns = [
        columnHelper.accessor("nombre", {
            header: "Empleado",
            cell: (info) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F1F1EF] border-premium flex items-center justify-center overflow-hidden">
                        <User size={16} className="text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-charcoal">{info.getValue()}</span>
                        <span className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Mail size={10} /> {info.row.original.email}
                        </span>
                    </div>
                </div>
            ),
        }),
        columnHelper.accessor("puesto", {
            header: "Puesto",
            cell: (info) => (
                <span className="px-2 py-1 rounded bg-[#F1F1EF] border-premium text-xs font-bold text-charcoal/60 uppercase">
                    {info.getValue() || "N/A"}
                </span>
            ),
        }),
        columnHelper.accessor("salario_base", {
            header: "Salario Base",
            cell: (info) => (
                <span className="font-display font-bold text-charcoal">
                    {info.getValue() ? `€${Number(info.getValue()).toLocaleString()}` : "—"}
                </span>
            ),
        }),
        columnHelper.accessor("fecha_alta", {
            header: "Fecha de Alta",
            cell: (info) => (
                <span className="text-xs text-charcoal/60 font-medium">
                    {new Date(info.getValue()).toLocaleDateString()}
                </span>
            ),
        }),
        columnHelper.display({
            id: "actions",
            cell: (info) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleAction(info.row.original.id, 'view')}
                        className="p-2 hover:bg-[#F1F1EF] rounded-sm transition-colors border-premium border-transparent hover:border-charcoal group"
                    >
                        <Eye size={16} className="text-charcoal/40 group-hover:text-primary" />
                    </button>
                    <button
                        onClick={() => handleAction(info.row.original.id, 'download')}
                        className="p-2 hover:bg-[#F1F1EF] rounded-sm transition-colors border-premium border-transparent hover:border-charcoal group"
                    >
                        <Download size={16} className="text-charcoal/40 group-hover:text-primary" />
                    </button>
                    <button
                        onClick={() => handleAction(info.row.original.id, 'delete')}
                        className="p-2 hover:bg-[#F1F1EF] rounded-sm transition-colors border-premium border-transparent hover:border-charcoal group"
                    >
                        <Trash2 size={16} className="text-charcoal/40 group-hover:text-error" />
                    </button>
                </div>
            ),
        }),
    ];

    const table = useReactTable({
        data: employees,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Gestión</p>
                    <h1 className="text-4xl font-display tracking-tight text-charcoal">Directorio de Personal</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchEmployees}
                        className="bg-surface text-charcoal p-3 rounded-sm font-bold border-premium hover:bg-[#F1F1EF] transition-colors flex items-center gap-2"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => {
                            setSelectedEmployee(undefined);
                            setIsDrawerOpen(true);
                        }}
                        className="bg-primary text-white px-6 py-3 rounded-sm font-bold border-premium swiss-shadow hover:translate-y-[-2px] transition-transform flex items-center gap-2"
                    >
                        <span>+</span> Añadir Empleado
                    </button>
                </div>
            </header>

            <AddEmployeeDrawer
                isOpen={isDrawerOpen}
                employee={selectedEmployee}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedEmployee(undefined);
                }}
                onSuccess={fetchEmployees}
            />

            <div className="bg-surface border-premium swiss-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#F1F1EF] border-b-premium z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="px-6 py-4 text-[10px] font-bold text-charcoal/40 uppercase tracking-widest border-r-premium last:border-r-0">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-charcoal/40 italic font-medium">
                                        Cargando directorio...
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-charcoal/40 italic font-medium">
                                        No se han encontrado empleados en la base de datos.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row, idx) => (
                                    <tr key={row.id} className={cn(
                                        "group transition-colors border-b-premium last:border-b-0",
                                        idx % 2 === 0 ? "bg-white" : "bg-[#FAFAF8]"
                                    )}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-6 py-4 border-r-premium last:border-r-0">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
