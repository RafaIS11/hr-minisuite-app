"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    FileText,
    Search,
    Upload,
    Download,
    Trash2,
    Filter as FilterIcon,
    File as FileIcon,
    Table as ExcelIcon,
    FileEdit as WordIcon,
    X,
    Loader2,
    Plus,
    MoreHorizontal,
    ChevronDown,
    Calendar,
    Tag,
    User,
    AlignLeft,
    ArrowUp,
    ArrowDown,
    Maximize2,
    Check,
    ChevronRight,
    SearchX,
    Layers,
    Clock,
    Circle,
    CheckCircle2,
    Archive,
    Type
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    obtenerDocumentos,
    subirDocumento,
    eliminarDocumento,
    descargarDocumento,
    actualizarDocumento,
    Documento
} from "@/lib/documentos";

// --- Configuration ---
const TIPOS = [
    { id: 'Nómina', label: 'Nómina', color: 'bg-[#E1F2E8] text-[#1D5E3F]' },
    { id: 'Contrato Laboral', label: 'Contrato Laboral', color: 'bg-[#DDEBFA] text-[#1E4D8C]' },
    { id: 'Modelo 145', label: 'Modelo 145', color: 'bg-[#F2EDFF] text-[#5B3EBD]' },
    { id: 'Certificado de Empresa', label: 'Certificado de Empresa', color: 'bg-[#FFF2E5] text-[#A66112]' },
    { id: 'Justificante Médico', label: 'Justificante Médico', color: 'bg-[#FFE9E9] text-[#9E2A2B]' },
    { id: 'Gasto/Ticket', label: 'Gasto/Ticket', color: 'bg-[#FEF7D1] text-[#715D1C]' },
];

const ESTADOS = [
    { id: 'Final', label: 'Finalizado', icon: CheckCircle2, color: 'bg-[#E1F2E8] text-[#1D5E3F]' },
    { id: 'Borrador', label: 'Borrador', icon: Circle, color: 'bg-[#FFF2E5] text-[#A66112]' },
    { id: 'Archivado', label: 'Archivado', icon: Archive, color: 'bg-[#F1F1EF] text-[#37352f]/40' },
];

export default function DocumentsPage() {
    // --- Data State ---
    const [docs, setDocs] = useState<Documento[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedTipo, setSelectedTipo] = useState<string>("todos");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    // --- UI Logic State ---
    const [sortConfig, setSortConfig] = useState<{ key: keyof Documento; direction: 'asc' | 'desc' } | null>({ key: 'fecha_subida', direction: 'desc' });
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // --- Side-Peek Editor State ---
    const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
    const [editValues, setEditValues] = useState<Partial<Documento>>({});
    const [isSaving, setIsSaving] = useState(false);

    // --- References ---
    const filterRef = useRef<HTMLDivElement>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    // --- Persistence Effects ---
    useEffect(() => { loadData(); }, [search, selectedTipo, fechaDesde, fechaHasta]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setIsFilterPopoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Business Logic ---
    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: emp } = await supabase.from("empleados").select("id").eq("email", user.email).maybeSingle();

            const data = await obtenerDocumentos({
                tipo: selectedTipo === "todos" ? undefined : selectedTipo,
                search: search,
                persona_id: emp?.id,
                fecha_desde: fechaDesde || undefined,
                fecha_hasta: fechaHasta || undefined
            });

            let sortedData = [...data];
            if (sortConfig) {
                sortedData.sort((a, b) => {
                    const valA = a[sortConfig.key]?.toString().toLowerCase() || "";
                    const valB = b[sortConfig.key]?.toString().toLowerCase() || "";
                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            setDocs(sortedData);
        } catch (err) {
            console.error("Load Data Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof Documento) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleOpenDoc = (doc: Documento) => {
        setSelectedDoc(doc);
        setEditValues({
            nombre_archivo: doc.nombre_archivo,
            tipo: doc.tipo,
            estado: doc.estado || 'Borrador',
            descripcion: doc.descripcion || ""
        });
    };

    const handleUpdateDoc = async () => {
        if (!selectedDoc) return;
        setIsSaving(true);
        try {
            await actualizarDocumento(selectedDoc.id, editValues);
            // Update local list
            setDocs(docs.map(d => d.id === selectedDoc.id ? { ...d, ...editValues } : d));
            setSelectedDoc({ ...selectedDoc, ...editValues });
            // Show toast or feedback? For now just silent success
        } catch (err) {
            alert("Error al actualizar el documento");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este documento definitivamente?")) return;
        try {
            await eliminarDocumento(id);
            setDocs(docs.filter(d => d.id !== id));
            if (selectedDoc?.id === id) setSelectedDoc(null);
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    // --- Helpers ---
    const getFileIcon = (formato: string) => {
        switch (formato) {
            case 'pdf': return <FileIcon className="text-[#EB5757]" size={16} />;
            case 'xlsx': return <ExcelIcon className="text-[#217346]" size={16} />;
            case 'docx': return <WordIcon className="text-[#2B579A]" size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const hasActiveFilters = selectedTipo !== "todos" || fechaDesde || fechaHasta || search;

    return (
        <div className="min-h-screen bg-[#FAFAF8] text-[#37352f] font-sans selection:bg-[#714A38]/10 overflow-x-hidden">
            {/* --- NOTION STYLE HEADER --- */}
            <div className="max-w-full mx-auto px-6 lg:px-12 pt-12 lg:pt-16">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#714A38] rounded-[3px] flex items-center justify-center border-[1.5px] border-[#2C2C2A] shadow-sm">
                            <span className="text-white font-black text-xl lg:text-2xl">H</span>
                        </div>
                        <div>
                            <h1 className="text-xl lg:text-3xl font-black text-[#2C2C2A] flex items-center gap-3">
                                <FileText className="opacity-10 hidden sm:block" /> Documentos
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase text-[#714A38] tracking-[0.3em]">Protocol 5 Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Control Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 lg:py-2 border-b-[1.5px] border-[#2C2C2A]/10 mb-4 lg:mb-2 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#714A38] text-white rounded-[3px] text-[12px] font-bold border-[1.5px] border-[#2C2C2A] shadow-sm cursor-default">
                            <ExcelIcon size={14} /> Base de Datos
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium opacity-40 hover:opacity-100 cursor-pointer transition-opacity border-[1.5px] border-transparent hover:border-[#2C2C2A]/10 rounded-[3px]">
                            <Plus size={14} /> Nueva vista
                        </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
                        <div className="relative group flex-1 lg:flex-initial lg:mr-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#37352f]/30 group-focus-within:text-[#714A38]" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-transparent border-none text-[13px] outline-none w-full lg:w-48 lg:focus:w-80 transition-all placeholder:opacity-30"
                            />
                        </div>

                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-[3px] text-[13px] font-medium transition-all border-[1.5px]",
                                    hasActiveFilters ? "bg-[#714A38]/5 border-[#714A38] text-[#714A38]" : "border-transparent hover:bg-[#F1F1EF] text-[#37352f]/60"
                                )}
                            >
                                <FilterIcon size={14} /> Filtrar
                            </button>

                            <AnimatePresence>
                                {isFilterPopoverOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                        className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-[340px] bg-white border-[1.5px] border-[#2C2C2A] shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[3px] z-[200] p-4 sm:p-6"
                                    >
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b pb-4 border-[#2C2C2A]/10">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#2C2C2A]/40">Reglas Activas</span>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={() => { setSelectedTipo('todos'); setFechaDesde(''); setFechaHasta(''); setSearch(''); }}
                                                        className="text-[10px] font-black uppercase text-red-500 hover:underline"
                                                    >
                                                        Resetear
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid gap-2">
                                                    <label className="text-[11px] font-bold text-[#37352f]/50 flex items-center gap-2 uppercase tracking-tight">
                                                        <Tag size={12} /> Categoría
                                                    </label>
                                                    <select
                                                        value={selectedTipo}
                                                        onChange={(e) => setSelectedTipo(e.target.value)}
                                                        className="w-full bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A]/10 p-2 text-[12px] font-medium outline-none focus:border-[#714A38] rounded-sm"
                                                    >
                                                        <option value="todos">Cualquiera</option>
                                                        {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                    </select>
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-[11px] font-bold text-[#37352f]/50 flex items-center gap-2 uppercase tracking-tight">
                                                        <Calendar size={12} /> Rango de Fecha
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="date"
                                                            value={fechaDesde}
                                                            onChange={(e) => setFechaDesde(e.target.value)}
                                                            className="bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A]/10 p-2 text-[11px] font-medium outline-none rounded-sm"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={fechaHasta}
                                                            onChange={(e) => setFechaHasta(e.target.value)}
                                                            className="bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A]/10 p-2 text-[11px] font-medium outline-none rounded-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center ml-auto lg:ml-2 group/new shrink-0">
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="bg-[#714A38] hover:bg-[#5a3b2d] text-white text-[12px] lg:text-[13px] font-bold px-3 lg:px-4 py-1.5 rounded-l-[3px] transition-all border-[1.5px] border-[#2C2C2A] border-r-0 shadow-[4px_4px_0px_0px_rgba(113,74,56,0.2)] whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Nuevo Documento</span>
                                <span className="sm:hidden">Nuevo</span>
                            </button>
                            <div className="w-[1.5px] h-[32px] bg-[#2C2C2A]/30 self-stretch" />
                            <button className="bg-[#714A38] hover:bg-[#5a3b2d] text-white px-2 py-1.5 rounded-r-[3px] transition-all border-[1.5px] border-[#2C2C2A] border-l-0 shadow-[4px_4px_0px_0px_rgba(113,74,56,0.2)]">
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 mb-6 min-h-[32px]">
                    <AnimatePresence>
                        {selectedTipo !== "todos" && (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-2 px-2 py-1 bg-[#F1F1EF] border border-[#2C2C2A]/10 rounded-[3px] text-[11px] font-bold">
                                <span className="opacity-40 uppercase">Tipo:</span> {selectedTipo}
                                <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setSelectedTipo('todos')} />
                            </motion.div>
                        )}
                        {(fechaDesde || fechaHasta) && (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-2 px-2 py-1 bg-[#F1F1EF] border border-[#2C2C2A]/10 rounded-[3px] text-[11px] font-bold">
                                <span className="opacity-40 uppercase">Fecha:</span> {fechaDesde || '...'} | {fechaHasta || '...'}
                                <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => { setFechaDesde(''); setFechaHasta(''); }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- DATA GRID --- */}
            <div className="max-w-full mx-auto px-6 lg:px-12 pb-24">
                <div className="border-[1.5px] border-[#2C2C2A] bg-white shadow-[12px_12px_0px_0px_rgba(44,44,42,0.05)] overflow-x-auto rounded-[3px]">
                    <div className="min-w-[1000px]">
                        {/* Header */}
                        <div className="grid grid-cols-[38px_2fr_1fr_1fr_0.8fr_1.5fr_1fr] bg-transparent border-b-[1.5px] border-[#2C2C2A]/10">
                            <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-2 flex items-center justify-center">
                                <div className="w-3.5 h-3.5 border border-[#2C2C2A]/20 rounded-sm" />
                            </div>
                            <div
                                onClick={() => handleSort('nombre_archivo')}
                                className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 text-[11px] font-black text-[#2C2C2A]/40 uppercase tracking-widest flex items-center gap-2 hover:bg-[#F1F1EF] cursor-pointer transition-colors"
                            >
                                <Type size={14} className="opacity-40" /> NOMBRE
                                {sortConfig?.key === 'nombre_archivo' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                            </div>
                            <div
                                onClick={() => handleSort('tipo')}
                                className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 text-[11px] font-black text-[#2C2C2A]/40 uppercase tracking-widest flex items-center gap-2 hover:bg-[#F1F1EF] cursor-pointer transition-colors"
                            >
                                <Tag size={14} className="opacity-40" /> CATEGORÍA
                                {sortConfig?.key === 'tipo' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                            </div>
                            <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 text-[11px] font-black text-[#2C2C2A]/40 uppercase tracking-widest flex items-center gap-2">
                                <Layers size={14} className="opacity-40" /> ESTADO
                            </div>
                            <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 text-[11px] font-black text-[#2C2C2A]/40 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} className="opacity-40" /> PROPIETARIO
                            </div>
                            <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 text-[11px] font-black text-[#2C2C2A]/40 uppercase tracking-widest flex items-center gap-2">
                                <AlignLeft size={14} className="opacity-40" /> DESCRIPCIÓN
                            </div>
                            <div
                                onClick={() => handleSort('fecha_subida')}
                                className="p-3 text-[11px] font-black text-[#2C2C2A]/40 uppercase tracking-widest flex items-center gap-2 hover:bg-[#F1F1EF] cursor-pointer transition-colors"
                            >
                                <Clock size={14} className="opacity-40" /> CREADO
                                {sortConfig?.key === 'fecha_subida' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="divide-y-[1.5px] divide-[#2C2C2A]/10">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center p-24 gap-4">
                                    <Loader2 className="animate-spin text-[#714A38]" size={40} />
                                    <p className="text-[12px] font-black uppercase tracking-[0.4em] opacity-30 animate-pulse">Establishing Connection...</p>
                                </div>
                            ) : docs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-32 gap-6 bg-[#FAFAF8]/50">
                                    <SearchX size={40} className="opacity-10" />
                                    <div className="text-center">
                                        <p className="text-[16px] font-black uppercase tracking-tight">VISTA VACÍA</p>
                                        <p className="text-[12px] opacity-40 mt-1 font-medium italic">No hay documentos con estos criterios.</p>
                                    </div>
                                </div>
                            ) : docs.map((doc) => (
                                <motion.div
                                    layout
                                    key={doc.id}
                                    className="grid grid-cols-[38px_2fr_1fr_1fr_0.8fr_1.5fr_1fr] bg-transparent group/row hover:bg-[#F1F1EF]/30 transition-all cursor-default select-none group/item"
                                >
                                    <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-2 flex items-center justify-center">
                                        <div className="w-3.5 h-3.5 border border-[#2C2C2A]/20 rounded-sm opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Prop: Name */}
                                    <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 relative flex items-center gap-3 overflow-hidden">
                                        {getFileIcon(doc.formato)}
                                        <span
                                            className="text-[13px] font-bold text-[#2C2C2A] truncate hover:underline underline-offset-4 cursor-pointer"
                                            onClick={() => handleOpenDoc(doc)}
                                        >
                                            {doc.nombre_archivo}
                                        </span>

                                        <div
                                            onClick={() => handleOpenDoc(doc)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 bg-white border-[1.5px] border-[#2C2C2A] rounded-[3px] px-2 py-1 flex items-center gap-2 text-[10px] font-black uppercase cursor-pointer hover:bg-[#714A38] hover:text-white transition-all shadow-sm"
                                        >
                                            <Maximize2 size={12} /> OPEN
                                        </div>
                                    </div>

                                    {/* Prop: Type */}
                                    <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center" onClick={() => handleOpenDoc(doc)}>
                                        <div className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-black uppercase tracking-tight",
                                            TIPOS.find(t => t.id === doc.tipo)?.color || 'bg-gray-100 text-gray-700'
                                        )}>
                                            {doc.tipo}
                                        </div>
                                    </div>

                                    {/* Prop: Status */}
                                    <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center" onClick={() => handleOpenDoc(doc)}>
                                        {doc.estado ? (
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-[3px] border border-transparent transition-colors",
                                                ESTADOS.find(e => e.id === doc.estado)?.color
                                            )}>
                                                {React.createElement(ESTADOS.find(e => e.id === doc.estado)?.icon || Circle, { size: 12 })}
                                                <span className="text-[12px] font-bold">{ESTADOS.find(e => e.id === doc.estado)?.label}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[12px] opacity-20 italic">No definido</span>
                                        )}
                                    </div>

                                    {/* Prop: Owner */}
                                    <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center" onClick={() => handleOpenDoc(doc)}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-[#714A38] text-white rounded-full flex items-center justify-center text-[10px] font-black border border-[#2C2C2A]">R</div>
                                            <span className="text-[12px] font-bold opacity-60">Rafael I.</span>
                                        </div>
                                    </div>

                                    {/* Prop: Description */}
                                    <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center" onClick={() => handleOpenDoc(doc)}>
                                        <span className="text-[12px] text-[#2C2C2A]/40 truncate">
                                            {doc.descripcion || ""}
                                        </span>
                                    </div>

                                    {/* Prop: Date */}
                                    <div className="p-3 flex items-center justify-between group/cell" onClick={() => handleOpenDoc(doc)}>
                                        <span className="text-[12px] font-bold tabular-nums opacity-60">
                                            {new Date(doc.fecha_subida).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                            className="opacity-0 group-hover/row:opacity-100 p-1 hover:bg-red-50 text-red-500 transition-all rounded-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            <div
                                onClick={() => setIsUploadOpen(true)}
                                className="grid grid-cols-[38px_1fr] hover:bg-[#F1F1EF] cursor-pointer transition-colors text-[#37352f]/20 group"
                            >
                                <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center justify-center">
                                    <Plus size={18} />
                                </div>
                                <div className="p-3 text-[14px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100">Nueva línea de datos...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SIDE-PEEK (Interactive Notion Editor) --- */}
            <AnimatePresence>
                {selectedDoc && (
                    <div className="fixed inset-0 z-[500] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedDoc(null)}
                            className="absolute inset-0 bg-[#2C2C2A]/30 backdrop-blur-[2px]"
                        />

                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="relative w-full lg:max-w-2xl bg-white h-screen border-l-[1.5px] border-[#2C2C2A] shadow-[-30px_0_60px_rgba(44,44,42,0.15)] flex flex-col"
                        >
                            {/* Header Toolbar */}
                            <div className="px-6 py-4 border-b-[1.5px] border-[#2C2C2A]/10 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-[#F1F1EF] rounded-[4px] transition-colors">
                                        <ChevronRight size={22} className="scale-x-[-1]" />
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-1 text-[11px] font-black uppercase opacity-20 hover:opacity-100 transition-opacity">
                                        <Maximize2 size={16} /> full page
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleUpdateDoc}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-6 py-2 bg-[#714A38] text-white text-[11px] font-black uppercase tracking-widest border-[1.5px] border-[#2C2C2A] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                                        ACTUALIZAR PROPIEDADES
                                    </button>
                                    <button className="p-2 hover:bg-[#F1F1EF] rounded-[4px] transition-colors text-[#2C2C2A]/20">
                                        <MoreHorizontal size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Editor Body */}
                            <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-16 py-8 lg:py-14 scroll-smooth">
                                {/* Title Area */}
                                <div className="mb-14">
                                    <div className="flex items-start gap-6 mb-8">
                                        <div className="p-5 bg-white rounded-[5px] border-[2px] border-[#2C2C2A] text-[#714A38] shadow-[4px_4px_0px_0px_rgba(44,44,42,0.05)]">
                                            {getFileIcon(selectedDoc.formato)}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={editValues.nombre_archivo}
                                                onChange={(e) => setEditValues({ ...editValues, nombre_archivo: e.target.value })}
                                                className="w-full text-2xl lg:text-4xl font-black text-[#2C2C2A] leading-tight focus:outline-none bg-transparent border-none p-0"
                                                placeholder="Sin título"
                                            />
                                            <div className="flex items-center gap-2 mt-2 opacity-30 text-[10px] font-bold uppercase tracking-widest">
                                                ID: {selectedDoc.id.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </div>

                                    {/* Properties Interface (Interactive Inputs) */}
                                    <div className="space-y-[1px] border-t border-b border-[#2C2C2A]/10 py-8 mb-12">
                                        {/* Property: Category */}
                                        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center py-4 sm:py-2 px-3 hover:bg-[#F1F1EF] transition-colors rounded-[3px] group gap-2 sm:gap-0">
                                            <div className="text-[12px] text-[#2C2C2A]/40 font-bold flex items-center gap-3 uppercase tracking-tighter cursor-default">
                                                <Tag size={14} /> CATEGORÍA
                                            </div>
                                            <select
                                                value={editValues.tipo}
                                                onChange={(e) => setEditValues({ ...editValues, tipo: e.target.value as any })}
                                                className="bg-[#FAFAF8] sm:bg-transparent border-none text-[13px] font-black uppercase text-[#714A38] outline-none cursor-pointer hover:bg-white rounded px-2 py-1 sm:py-0 w-full sm:w-auto"
                                            >
                                                {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                            </select>
                                        </div>

                                        {/* Property: Status */}
                                        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center py-4 sm:py-2 px-3 hover:bg-[#F1F1EF] transition-colors rounded-[3px] group gap-2 sm:gap-0">
                                            <div className="text-[12px] text-[#2C2C2A]/40 font-bold flex items-center gap-3 uppercase tracking-tighter cursor-default">
                                                <Layers size={14} /> ESTADO
                                            </div>
                                            <select
                                                value={editValues.estado}
                                                onChange={(e) => setEditValues({ ...editValues, estado: e.target.value as any })}
                                                className="bg-[#FAFAF8] sm:bg-transparent border-none text-[13px] font-black uppercase text-green-700 outline-none cursor-pointer hover:bg-white rounded px-2 py-1 sm:py-0 w-full sm:w-auto"
                                            >
                                                {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                                            </select>
                                        </div>

                                        {/* Property: User (Relation) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start sm:items-center py-4 sm:py-2 px-3 hover:bg-[#F1F1EF] transition-colors rounded-[3px] group gap-2 sm:gap-0">
                                            <div className="text-[12px] text-[#2C2C2A]/40 font-bold flex items-center gap-3 uppercase tracking-tighter cursor-default">
                                                <User size={14} /> DUEÑO
                                            </div>
                                            <div className="flex items-center gap-2 px-2 py-1 bg-white border border-[#2C2C2A]/10 rounded shadow-sm cursor-pointer hover:border-[#714A38]/30 transition-all w-fit">
                                                <div className="w-5 h-5 bg-[#714A38] text-white rounded-full flex items-center justify-center text-[10px] font-black border border-[#2C2C2A]">R</div>
                                                <span className="text-[13px] font-bold">Rafael Ibarra</span>
                                            </div>
                                        </div>

                                        {/* Property: Date (Read Only in this view) */}
                                        <div className="grid grid-cols-[160px_1fr] items-center py-2 px-3 opacity-60">
                                            <div className="text-[12px] text-[#2C2C2A]/40 font-bold flex items-center gap-3 uppercase tracking-tighter">
                                                <Clock size={14} /> FICHADO EN
                                            </div>
                                            <div className="text-[12px] font-bold px-2">
                                                {new Date(selectedDoc.fecha_subida).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => descargarDocumento(selectedDoc.url_storage)}
                                        className="w-full py-5 bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A] text-[13px] lg:text-[15px] font-black uppercase tracking-[0.2em] shadow-[10px_10px_0px_0px_rgba(44,44,42,0.1)] hover:bg-[#2C2C2A] hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-4 group"
                                    >
                                        <Download size={20} className="group-hover:animate-bounce" /> DESCARGAR ACTIVO
                                    </button>
                                </div>

                                {/* Content Area */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 text-[11px] font-black uppercase text-[#2C2C2A]/40 tracking-[0.3em] pl-1">
                                        <AlignLeft size={16} /> ASSET CONTENT PROPERTY
                                    </div>
                                    <textarea
                                        value={editValues.descripcion}
                                        onChange={(e) => setEditValues({ ...editValues, descripcion: e.target.value })}
                                        placeholder="Escribe notas detalladas o comentarios sobre este registro..."
                                        className="w-full min-h-[400px] bg-transparent border-none outline-none text-[20px] leading-relaxed text-[#2C2C2A] placeholder:text-[#2C2C2A]/10 resize-none font-medium px-1"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- UPLOAD MODAL --- */}
            <AnimatePresence>
                {isUploadOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUploadOpen(false)} className="absolute inset-0 bg-[#2C2C2A]/85 backdrop-blur-md" />
                        <motion.div
                            initial={{ translateY: 40, opacity: 0 }} animate={{ translateY: 0, opacity: 1 }} exit={{ translateY: 40, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white border-[2px] border-[#2C2C2A] shadow-[25px_25px_0px_0px_rgba(44,44,42,0.15)] rounded-[4px] overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const formData = new FormData(form);
                                const fileInput = uploadInputRef.current;

                                if (!fileInput?.files?.[0]) return;

                                const tip = formData.get('tipo') as any;
                                const desc = formData.get('descripcion') as string;

                                setLoading(true);
                                try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    const { data: emp } = await supabase.from("empleados").select("id").eq("email", user?.email).maybeSingle();

                                    await subirDocumento(fileInput.files[0], {
                                        tipo: tip,
                                        descripcion: desc,
                                        persona_id: emp?.id
                                    });
                                    setIsUploadOpen(false);
                                    await loadData();
                                } catch (err: any) {
                                    alert(err.message);
                                } finally {
                                    setLoading(false);
                                }
                            }}>
                                <div className="p-6 border-b-[2px] border-[#2C2C2A]/10 flex items-center justify-between bg-[#FAFAF8]">
                                    <div className="flex items-center gap-3">
                                        <Upload size={20} className="text-[#714A38]" />
                                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#2C2C2A]">INGRESAR NUEVO ACTIVO</h3>
                                    </div>
                                    <button type="button" onClick={() => setIsUploadOpen(false)} className="p-1 hover:bg-[#2C2C2A]/5 text-[#2C2C2A]/30">
                                        <X size={26} />
                                    </button>
                                </div>

                                <div className="p-6 lg:p-10 space-y-6 lg:space-y-10">
                                    <div
                                        onClick={() => uploadInputRef.current?.click()}
                                        className="border-[2px] border-dashed border-[#2C2C2A]/20 p-8 lg:p-16 text-center cursor-pointer hover:border-[#714A38] hover:bg-[#714A38]/5 group transition-all rounded-[4px] bg-[#FAFAF8]/50"
                                    >
                                        <input type="file" ref={uploadInputRef} className="hidden" required />
                                        <Upload className="text-[#714A38]/30 group-hover:text-[#714A38] mx-auto mb-4" size={32} />
                                        <p className="text-[14px] lg:text-[16px] font-black text-[#2C2C2A]">Selecciona el archivo</p>
                                        <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest opacity-30 mt-2 italic">PDF, XLSX, DOCX</p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-[#2C2C2A]/40">Categoría</label>
                                            <select name="tipo" className="w-full bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A]/10 p-3 text-[13px] font-black uppercase outline-none focus:border-[#714A38] rounded-[3px]">
                                                {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-[#2C2C2A]/40">Propiedad Extra</label>
                                            <div className="p-3 bg-white border-[1.5px] border-[#2C2C2A]/5 text-[12px] opacity-30 italic rounded-[3px]">Asignado automáticamente...</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase text-[#2C2C2A]/40">Descripción Inicial</label>
                                        <textarea name="descripcion" className="w-full min-h-[100px] bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A]/10 p-4 text-[14px] font-medium outline-none focus:border-[#714A38] rounded-[3px] resize-none" placeholder="..." />
                                    </div>

                                    <div className="pt-6 flex flex-col sm:flex-row justify-end items-center gap-6 sm:gap-12 border-t-[1.5px] border-[#2C2C2A]/5">
                                        <button type="button" onClick={() => setIsUploadOpen(false)} className="text-[12px] font-black uppercase tracking-widest text-[#2C2C2A]/30 hover:text-red-500">ABORTAR</button>
                                        <button
                                            disabled={loading}
                                            className="w-full sm:w-auto px-16 py-4 bg-[#714A38] text-white text-[13px] font-black uppercase tracking-widest border-[1.5px] border-[#2C2C2A] shadow-[10px_10px_0px_0px_rgba(44,44,42,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-30"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={18} /> : "IMPORTAR"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
