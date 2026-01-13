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
    Archive
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    obtenerDocumentos,
    subirDocumento,
    eliminarDocumento,
    descargarDocumento,
    actualizarDescripcion,
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

const STATUS_OPTS = [
    { id: 'Final', label: 'Final', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { id: 'Borrador', label: 'Borrador', icon: Circle, color: 'text-blue-500 bg-blue-50' },
    { id: 'Archivado', label: 'Archivado', icon: Archive, color: 'text-gray-400 bg-gray-50' },
];

const DEPTS = [
    { id: 'HR', label: 'Human Resources', color: 'bg-[#FDE2E2] text-[#9B2C2C]' },
    { id: 'FIN', label: 'Finance', color: 'bg-[#E0F2FE] text-[#0369A1]' },
    { id: 'ENG', label: 'Engineering', color: 'bg-[#F3E8FF] text-[#6B21A8]' },
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
    const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
    const [editingDesc, setEditingDesc] = useState("");
    const [isSavingDesc, setIsSavingDesc] = useState(false);

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

    const handleSaveDescription = async () => {
        if (!selectedDoc) return;
        setIsSavingDesc(true);
        try {
            await actualizarDescripcion(selectedDoc.id, editingDesc);
            setDocs(docs.map(d => d.id === selectedDoc.id ? { ...d, descripcion: editingDesc } : d));
            setSelectedDoc({ ...selectedDoc, descripcion: editingDesc });
        } catch (err) {
            alert("Error al guardar descripción");
        } finally {
            setIsSavingDesc(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este documento?")) return;
        try {
            await eliminarDocumento(id);
            setDocs(docs.filter(d => d.id !== id));
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
            <div className="max-w-full mx-auto px-12 pt-16">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#714A38] rounded-[3px] flex items-center justify-center border-[1.5px] border-[#2C2C2A] shadow-sm">
                            <span className="text-white font-black text-2xl">H</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-[#2C2C2A] flex items-center gap-3">
                                <FileText className="opacity-10" /> Documentos de Empresa
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase text-[#714A38] tracking-[0.3em]">Protocol 5 Sovereign DB</span>
                                <div className="w-1 h-1 bg-[#2C2C2A]/20 rounded-full" />
                                <span className="text-[10px] font-bold opacity-30">v3.0 Production Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notion Control Toolbar */}
                <div className="flex items-center justify-between py-2 border-b-[1.5px] border-[#2C2C2A]/10 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#714A38] text-white rounded-[3px] text-[12px] font-bold border-[1.5px] border-[#2C2C2A] shadow-sm cursor-default">
                            <ExcelIcon size={14} /> Vista de Propiedades
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium opacity-40 hover:opacity-100 cursor-pointer transition-opacity border-[1.5px] border-transparent hover:border-[#2C2C2A]/10 rounded-[3px]">
                            <Plus size={14} /> Nueva vista
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Dynamic Search Bar */}
                        <div className="relative group mr-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#37352f]/30 group-focus-within:text-[#714A38]" size={14} />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-transparent border-none text-[13px] outline-none w-48 focus:w-80 transition-all placeholder:opacity-30"
                            />
                        </div>

                        {/* Filter Interface (Popover) */}
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-[3px] text-[13px] font-medium transition-all border-[1.5px]",
                                    hasActiveFilters ? "bg-[#714A38]/5 border-[#714A38] text-[#714A38]" : "border-transparent hover:bg-[#F1F1EF] text-[#37352f]/60"
                                )}
                            >
                                <FilterIcon size={14} /> Filter
                            </button>

                            <AnimatePresence>
                                {isFilterPopoverOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                        className="absolute right-0 top-full mt-2 w-[340px] bg-white border-[1.5px] border-[#2C2C2A] shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[3px] z-[200] p-6"
                                    >
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b pb-4 border-[#2C2C2A]/10">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#2C2C2A]/40">Reglas de Propiedad</span>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={() => { setSelectedTipo('todos'); setFechaDesde(''); setFechaHasta(''); setSearch(''); }}
                                                        className="text-[10px] font-black uppercase text-red-500 hover:underline"
                                                    >
                                                        Reseteo Total
                                                    </button>
                                                )}
                                            </div>

                                            {/* Property Rules */}
                                            <div className="space-y-4">
                                                <div className="grid gap-2">
                                                    <label className="text-[11px] font-bold text-[#37352f]/50 flex items-center gap-2 uppercase tracking-tight">
                                                        <Tag size={12} /> Categoría es...
                                                    </label>
                                                    <select
                                                        value={selectedTipo}
                                                        onChange={(e) => setSelectedTipo(e.target.value)}
                                                        className="w-full bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A]/10 p-2 text-[12px] font-medium outline-none focus:border-[#714A38] rounded-sm"
                                                    >
                                                        <option value="todos">Cualquier categoría</option>
                                                        {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                    </select>
                                                </div>

                                                <div className="grid gap-2">
                                                    <label className="text-[11px] font-bold text-[#37352f]/50 flex items-center gap-2 uppercase tracking-tight">
                                                        <Calendar size={12} /> Rango de Fecha...
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

                        {/* Notion Split New Button */}
                        <div className="flex items-center ml-2 group/new">
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="bg-[#714A38] hover:bg-[#5a3b2d] text-white text-[13px] font-bold px-4 py-1.5 rounded-l-[3px] transition-all border-[1.5px] border-[#2C2C2A] border-r-0 shadow-[4px_4px_0px_0px_rgba(113,74,56,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1"
                            >
                                Nuevo Documento
                            </button>
                            <div className="w-[1.5px] h-[32px] bg-[#2C2C2A]/30 self-stretch" />
                            <button className="bg-[#714A38] hover:bg-[#5a3b2d] text-white px-2 py-1.5 rounded-r-[3px] transition-all border-[1.5px] border-[#2C2C2A] border-l-0 shadow-[4px_4px_0px_0px_rgba(113,74,56,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1">
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Pills Display */}
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

            {/* --- THE SOVEREIGN GRID SYSTEM --- */}
            <div className="max-w-full mx-auto px-12">
                <div className="border-[1.5px] border-[#2C2C2A] bg-white shadow-[12px_12px_0px_0px_rgba(44,44,42,0.05)] overflow-hidden rounded-[3px]">
                    {/* Grid Header */}
                    <div className="grid grid-cols-[38px_2fr_1fr_1fr_0.8fr_1fr_1fr] bg-transparent border-b-[1.5px] border-[#2C2C2A]/10">
                        <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-2 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 border border-[#2C2C2A]/20 rounded-sm" />
                        </div>
                        <div
                            onClick={() => handleSort('nombre_archivo')}
                            className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 text-[11px] font-black text-[#2C2C2A]/40 uppercase tracking-widest flex items-center gap-2 hover:bg-[#F1F1EF] cursor-pointer transition-colors"
                        >
                            <span className="scale-110 tracking-tighter opacity-60">Aa</span> DOCUMENTO
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
                            <AlignLeft size={14} className="opacity-40" /> COMENTARIO
                        </div>
                        <div
                            onClick={() => handleSort('fecha_subida')}
                            className="p-3 text-[11px] font-black text-[#2C2C2A]/40 uppercase tracking-widest flex items-center gap-2 hover:bg-[#F1F1EF] cursor-pointer transition-colors"
                        >
                            <Clock size={14} className="opacity-40" /> CREACIÓN
                            {sortConfig?.key === 'fecha_subida' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </div>
                    </div>

                    {/* Grid Body */}
                    <div className="divide-y-[1.5px] divide-[#2C2C2A]/10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-24 gap-4">
                                <Loader2 className="animate-spin text-[#714A38]" size={40} />
                                <p className="text-[12px] font-black uppercase tracking-[0.4em] opacity-30 animate-pulse">Establishing Connection...</p>
                            </div>
                        ) : docs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-32 gap-6 bg-[#FAFAF8]/50">
                                <div className="w-20 h-20 bg-[#2C2C2A]/5 rounded-full flex items-center justify-center border-[1.5px] border-dashed border-[#2C2C2A]/10">
                                    <SearchX size={40} className="opacity-10" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[16px] font-black uppercase tracking-tight">Database: No matches</p>
                                    <p className="text-[12px] opacity-40 mt-1 font-medium italic">All filters returned zero assets.</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedTipo('todos'); setFechaDesde(''); setFechaHasta(''); setSearch(''); }}
                                    className="px-8 py-2.5 border-[1.5px] border-[#2C2C2A] text-[11px] font-black uppercase tracking-widest hover:bg-[#2C2C2A] hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(44,44,42,0.1)] hover:shadow-none"
                                >
                                    Clear and Refresh
                                </button>
                            </div>
                        ) : docs.map((doc) => (
                            <motion.div
                                layout
                                key={doc.id}
                                className="grid grid-cols-[38px_2fr_1fr_1fr_0.8fr_1fr_1fr] bg-transparent group/row hover:bg-[#F1F1EF]/30 transition-all cursor-default select-none border-b-[1.5px] border-transparent hover:border-[#2C2C2A]/5"
                            >
                                <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-2 flex items-center justify-center">
                                    <div className="w-3.5 h-3.5 border border-[#2C2C2A]/20 rounded-sm opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                </div>

                                {/* Property: Name */}
                                <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 relative flex items-center gap-3 overflow-hidden">
                                    {getFileIcon(doc.formato)}
                                    <span
                                        className="text-[13px] font-bold text-[#2C2C2A] truncate hover:underline underline-offset-4 cursor-pointer"
                                        onClick={() => descargarDocumento(doc.url_storage)}
                                    >
                                        {doc.nombre_archivo}
                                    </span>

                                    {/* Hyper-Notion Hover ACTION */}
                                    <div
                                        onClick={() => { setSelectedDoc(doc); setEditingDesc(doc.descripcion || ""); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 bg-white border-[1.5px] border-[#2C2C2A] rounded-[3px] px-2 py-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#714A38] hover:text-white transition-all shadow-sm"
                                    >
                                        <Maximize2 size={12} /> Open Page
                                    </div>
                                </div>

                                {/* Property: Type */}
                                <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center" onClick={() => setSelectedDoc(doc)}>
                                    <div className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-black uppercase tracking-tight",
                                        TIPOS.find(t => t.id === doc.tipo)?.color || 'bg-gray-100 text-gray-700'
                                    )}>
                                        {doc.tipo}
                                    </div>
                                </div>

                                {/* Property: Status (Simulated relation) */}
                                <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center" onClick={() => setSelectedDoc(doc)}>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-[3px] bg-[#F1F1EF]/50 hover:bg-[#F1F1EF] border border-[#2C2C2A]/5 transition-colors group/status">
                                        <CheckCircle2 size={12} className="text-green-600 opacity-60" />
                                        <span className="text-[12px] font-bold text-[#2C2C2A]/80">Finalizado</span>
                                    </div>
                                </div>

                                {/* Property: User/Owner */}
                                <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center" onClick={() => setSelectedDoc(doc)}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-[#714A38] text-white rounded-full flex items-center justify-center text-[10px] font-black border border-[#2C2C2A]">R</div>
                                        <span className="text-[12px] font-bold opacity-60">Rafael I.</span>
                                    </div>
                                </div>

                                {/* Property: Description (Preview) */}
                                <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center" onClick={() => { setSelectedDoc(doc); setEditingDesc(doc.descripcion || ""); }}>
                                    <span className="text-[12px] text-[#2C2C2A]/40 truncate italic">
                                        {doc.descripcion || "Empty property..."}
                                    </span>
                                </div>

                                {/* Property: Date (Formatted) */}
                                <div className="p-3 flex items-center justify-between group/cell" onClick={() => setSelectedDoc(doc)}>
                                    <span className="text-[12px] font-bold tabular-nums opacity-60">
                                        {new Date(doc.fecha_subida).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                        className="opacity-0 group-hover/row:opacity-100 p-1.5 hover:bg-red-50 text-red-500 rounded-sm transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {/* Inline Adding Trigger */}
                        <div
                            onClick={() => setIsUploadOpen(true)}
                            className="grid grid-cols-[38px_1fr] border-t-[1.5px] border-[#2C2C2A]/10 hover:bg-[#F1F1EF] cursor-pointer transition-colors text-[#37352f]/20 group"
                        >
                            <div className="border-r-[1.5px] border-[#2C2C2A]/10 p-3 flex items-center justify-center">
                                <Plus size={18} className="group-hover:scale-125 transition-transform" />
                            </div>
                            <div className="p-3 text-[14px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100">Click to add new page</div>
                        </div>
                    </div>
                </div>

                {/* Database Statistics */}
                <div className="mt-12 flex items-center justify-between text-[10px] font-black uppercase text-[#2C2C2A]/20 tracking-[0.3em] pb-12">
                    <div className="flex gap-10">
                        <span className="flex items-center gap-2 underline underline-offset-4 cursor-pointer hover:text-[#714A38]">Count: {docs.length} assets</span>
                        <span>Categorized: {docs.filter(d => d.tipo).length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Sync Status: SOVEREIGN PROTOCOL ACTIVE
                    </div>
                </div>
            </div>

            {/* --- SIDE-PEEK CONTENT EDITOR (Hyper High Fidelity) --- */}
            <AnimatePresence>
                {selectedDoc && (
                    <div className="fixed inset-0 z-[500] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDoc(null)}
                            className="absolute inset-0 bg-[#2C2C2A]/30 backdrop-blur-[2px]"
                        />

                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220, mass: 0.8 }}
                            className="relative w-full max-w-2xl bg-white h-screen border-l-[1.5px] border-[#2C2C2A] shadow-[-30px_0_60px_rgba(44,44,42,0.15)] flex flex-col"
                        >
                            {/* Editor Header Navigation */}
                            <div className="px-6 py-3 border-b-[1.5px] border-[#2C2C2A]/10 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-[#F1F1EF] rounded-[4px] transition-colors">
                                        <ChevronRight size={22} className="scale-x-[-1]" />
                                    </button>
                                    <div className="flex items-center gap-2 px-3 py-1 hover:bg-[#F1F1EF] cursor-pointer rounded-[4px] group transition-colors">
                                        <Maximize2 size={16} className="opacity-20 group-hover:opacity-100" />
                                        <span className="text-[11px] font-black uppercase tracking-widest opacity-30">Full Page</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSaveDescription}
                                        disabled={isSavingDesc}
                                        className="flex items-center gap-2 px-5 py-2 bg-[#714A38] text-white text-[11px] font-black uppercase tracking-[0.1em] border-[1.5px] border-[#2C2C2A] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50"
                                    >
                                        {isSavingDesc ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                                        Actualizar Propiedades
                                    </button>
                                    <button className="p-2 hover:bg-[#F1F1EF] rounded-[4px] transition-colors text-[#2C2C2A]/30">
                                        <MoreHorizontal size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Editor Body */}
                            <div className="flex-1 overflow-y-auto px-12 py-14 scroll-smooth">
                                <div className="mb-14">
                                    {/* Page Title & Icon */}
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className="p-5 bg-[#FAFAF8] rounded-[5px] border-[2px] border-[#2C2C2A] text-[#714A38] shadow-[4px_4px_0px_0px_rgba(44,44,42,0.05)]">
                                            {getFileIcon(selectedDoc.formato)}
                                        </div>
                                        <h2 className="text-4xl font-black text-[#2C2C2A] leading-tight focus:outline-none focus:ring-2 focus:ring-[#714A38]/10 p-1 rounded transition-all" contentEditable suppressContentEditableWarning>
                                            {selectedDoc.nombre_archivo}
                                        </h2>
                                    </div>

                                    {/* Properties Stack (THE HEART OF NOTION) */}
                                    <div className="space-y-[1px] border-t border-b border-[#2C2C2A]/10 py-6 mb-12">
                                        <div className="grid grid-cols-[160px_1fr] items-center py-2 px-3 hover:bg-[#F1F1EF] transition-colors rounded-[3px] group/p">
                                            <div className="text-[12px] text-[#2C2C2A]/40 font-bold flex items-center gap-2.5 uppercase tracking-tighter">
                                                <Tag size={13} /> Categoría
                                            </div>
                                            <div className={cn(
                                                "inline-flex w-fit px-2 py-0.5 rounded-[3px] text-[12px] font-black uppercase border border-transparent hover:border-[#2C2C2A]/20 cursor-pointer",
                                                TIPOS.find(t => t.id === selectedDoc.tipo)?.color
                                            )}>
                                                {selectedDoc.tipo}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[160px_1fr] items-center py-2 px-3 hover:bg-[#F1F1EF] transition-colors rounded-[3px] group/p">
                                            <div className="text-[12px] text-[#2C2C2A]/40 font-bold flex items-center gap-2.5 uppercase tracking-tighter">
                                                <Layers size={13} /> Estado
                                            </div>
                                            <div className="flex items-center gap-2 px-2 py-1 rounded-[3px] bg-green-50 text-green-700 text-[11px] font-black uppercase border border-green-100 cursor-pointer">
                                                <CheckCircle2 size={12} /> Finalizado
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[160px_1fr] items-center py-2 px-3 hover:bg-[#F1F1EF] transition-colors rounded-[3px] group/p">
                                            <div className="text-[12px] text-[#2C2C2A]/40 font-bold flex items-center gap-2.5 uppercase tracking-tighter">
                                                <User size={13} /> Dueño
                                            </div>
                                            <div className="flex items-center gap-2 hover:bg-white px-2 py-1 rounded-[3px] transition-colors cursor-pointer border border-transparent hover:border-[#2C2C2A]/10">
                                                <div className="w-5 h-5 bg-[#714A38] text-white rounded-full flex items-center justify-center text-[10px] font-black border border-[#2C2C2A]">R</div>
                                                <span className="text-[13px] font-bold">Rafael Ibarra (Admin)</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[160px_1fr] items-center py-2 px-3 hover:bg-[#F1F1EF] transition-colors rounded-[3px] group/p">
                                            <div className="text-[12px] text-[#2C2C2A]/40 font-bold flex items-center gap-2.5 uppercase tracking-tighter">
                                                <Clock size={13} /> Fichado en
                                            </div>
                                            <div className="text-[12px] font-bold opacity-60 px-2 underline decoration-dotted decoration-[#2C2C2A]/20">
                                                {new Date(selectedDoc.fecha_subida).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Large Dynamic Action */}
                                    <button
                                        onClick={() => descargarDocumento(selectedDoc.url_storage)}
                                        className="w-full py-5 bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A] text-[15px] font-black uppercase tracking-[0.2em] shadow-[10px_10px_0px_0px_rgba(44,44,42,0.1)] hover:bg-[#714A38] hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-4 group"
                                    >
                                        <Download size={22} className="group-hover:animate-bounce" /> Descargar Asset Soberano
                                    </button>
                                </div>

                                {/* Detailed Content Editor */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 text-[11px] font-black uppercase text-[#2C2C2A]/40 tracking-[0.3em] pl-1">
                                        <AlignLeft size={16} /> Asset Content Property
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            value={editingDesc}
                                            onChange={(e) => setEditingDesc(e.target.value)}
                                            placeholder="Write detailed notes or comments for this database record..."
                                            className="w-full min-h-[350px] bg-transparent border-none outline-none text-[20px] leading-relaxed text-[#2C2C2A] placeholder:text-[#2C2C2A]/10 resize-none font-medium px-1"
                                        />
                                        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-20 pointer-events-none">
                                            <span className="text-[10px] font-bold uppercase">Auto-saving active</span>
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- IMPORT MODAL (Notion Inspired) --- */}
            <AnimatePresence>
                {isUploadOpen && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUploadOpen(false)} className="absolute inset-0 bg-[#2C2C2A]/85 backdrop-blur-md" />
                        <motion.div
                            initial={{ translateY: 40, opacity: 0, scale: 0.95 }}
                            animate={{ translateY: 0, opacity: 1, scale: 1 }}
                            exit={{ translateY: 40, opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-white border-[2px] border-[#2C2C2A] shadow-[30px_30px_0px_0px_rgba(44,44,42,0.1)] rounded-[4px] overflow-hidden"
                        >
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const fileInput = uploadInputRef.current;
                                if (!fileInput?.files?.[0]) return;

                                setLoading(true);
                                try {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    const { data: emp } = await supabase.from("empleados").select("id").eq("email", user?.email).maybeSingle();

                                    const tip = (e.currentTarget.tipo as HTMLSelectElement).value as any;
                                    const desc = (e.currentTarget.descripcion as HTMLTextAreaElement).value;

                                    await subirDocumento(fileInput.files[0], { tipo: tip, descripcion: desc, persona_id: emp?.id });
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
                                        <h3 className="text-[13px] font-black uppercase tracking-widest text-[#2C2C2A]">Ingresar Nuevo Activo</h3>
                                    </div>
                                    <button type="button" onClick={() => setIsUploadOpen(false)} className="p-1 hover:bg-[#2C2C2A]/5 rounded-sm transition-colors text-[#2C2C2A]/30">
                                        <X size={26} />
                                    </button>
                                </div>

                                <div className="p-12 space-y-12">
                                    {/* Custom Dropzone */}
                                    <div
                                        onClick={() => uploadInputRef.current?.click()}
                                        className="border-[2px] border-dashed border-[#2C2C2A]/20 p-16 text-center cursor-pointer hover:border-[#714A38] hover:bg-[#714A38]/5 group transition-all rounded-[4px] bg-[#FAFAF8]/50"
                                    >
                                        <input type="file" ref={uploadInputRef} className="hidden" required />
                                        <div className="w-20 h-20 bg-white border-[2px] border-[#2C2C2A]/5 rounded-[6px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:border-[#714A38]/20">
                                            <Upload className="text-[#714A38]/30 group-hover:text-[#714A38]" size={36} />
                                        </div>
                                        <p className="text-[16px] font-black text-[#2C2C2A] tracking-tight">Drop your electronic audit asset here</p>
                                        <p className="text-[11px] font-bold uppercase tracking-widest opacity-30 mt-3 italic">Max file size: 10MB (Audit Protocol v2.5)</p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="grid grid-cols-[140px_1fr] gap-10 items-center">
                                            <label className="text-[12px] font-black uppercase text-[#2C2C2A]/30 flex items-center gap-3">
                                                <Tag size={16} /> Propiedad TIPO
                                            </label>
                                            <select name="tipo" className="w-full bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A]/10 p-4 text-[13px] font-black uppercase tracking-widest outline-none focus:border-[#714A38] rounded-[3px] appearance-none cursor-pointer">
                                                {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-[140px_1fr] gap-10 items-start">
                                            <label className="text-[12px] font-black uppercase text-[#2C2C2A]/30 flex items-center gap-3 mt-3">
                                                <AlignLeft size={16} /> COMENTARIO
                                            </label>
                                            <textarea name="descripcion" className="w-full min-h-[140px] bg-[#FAFAF8] border-[1.5px] border-[#2C2C2A]/10 p-5 text-[14px] font-medium outline-none focus:border-[#714A38] rounded-[3px] resize-none placeholder:italic placeholder:opacity-20" placeholder="Añade contexto técnico sobre este archivo..." />
                                        </div>
                                    </div>

                                    <div className="pt-10 flex justify-end items-center gap-12 border-t-[1.5px] border-[#2C2C2A]/5">
                                        <button type="button" onClick={() => setIsUploadOpen(false)} className="text-[12px] font-black uppercase tracking-widest text-[#2C2C2A]/30 hover:text-red-500 transition-colors">Aborta Operación</button>
                                        <button
                                            disabled={loading}
                                            className="px-16 py-4 bg-[#714A38] text-white text-[13px] font-black uppercase tracking-widest border-[1.5px] border-[#2C2C2A] shadow-[10px_10px_0px_0px_rgba(44,44,42,0.1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-30 flex items-center gap-4"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Sellar e Importar <Check size={20} /></>}
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
