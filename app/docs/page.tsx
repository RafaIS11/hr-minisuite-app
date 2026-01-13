"use client";

import React, { useState, useEffect } from "react";
import {
    FileText,
    Search,
    Upload,
    Download,
    Trash2,
    Filter,
    File as FileIcon,
    Table as ExcelIcon,
    FileEdit as WordIcon,
    X,
    Loader2,
    Database,
    Plus,
    MoreHorizontal,
    ChevronDown,
    Calendar,
    Tag,
    Share2,
    CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    obtenerDocumentos,
    subirDocumento,
    eliminarDocumento,
    descargarDocumento,
    obtenerEstadisticas,
    Documento
} from "@/lib/documentos";

const CATEGORIES = [
    { id: 'nomina', label: 'Nómina', color: 'bg-emerald-100 text-emerald-800' },
    { id: 'contrato', label: 'Contrato', color: 'bg-blue-100 text-blue-800' },
    { id: 'cliente', label: 'Cliente', color: 'bg-purple-100 text-purple-800' },
    { id: 'proveedor', label: 'Proveedor', color: 'bg-orange-100 text-orange-800' },
    { id: 'certificado', label: 'Certificado', color: 'bg-amber-100 text-amber-800' },
];

export default function DocumentsPage() {
    const [docs, setDocs] = useState<Documento[]>([]);
    const [stats, setStats] = useState({ total: 0, pdfs: 0, excels: 0, words: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("todos");
    const [selectedEntity, setSelectedEntity] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    // Upload Form
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState<'nomina' | 'contrato' | 'cliente' | 'proveedor' | 'certificado'>('nomina');
    const [client, setClient] = useState("");

    useEffect(() => {
        loadData();
    }, [search, selectedCategory, selectedEntity]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: emp } = await supabase.from("empleados").select("id").eq("email", user.email).maybeSingle();
            const data = await obtenerDocumentos({
                categoria: selectedCategory,
                cliente: selectedEntity,
                search: search,
                empleado_id: emp?.id
            });
            setDocs(data);

            const s = await obtenerEstadisticas(emp?.id);
            setStats(s);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: emp } = await supabase.from("empleados").select("id").eq("email", user?.email).maybeSingle();

            await subirDocumento(file, {
                categoria: category,
                cliente_asociado: client,
                empleado_id: emp?.id
            });
            setIsUploadOpen(false);
            setFile(null);
            setClient("");
            loadData();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este documento permanentemente?')) {
            await eliminarDocumento(id);
            loadData();
        }
    };

    const getFileIcon = (formato: string) => {
        switch (formato) {
            case 'pdf': return <FileIcon className="text-red-500" size={18} />;
            case 'xlsx': return <ExcelIcon className="text-green-600" size={18} />;
            case 'docx': return <WordIcon className="text-blue-500" size={18} />;
            default: return <FileText size={18} />;
        }
    };

    return (
        <div className="min-h-screen bg-white text-[#37352f] font-sans selection:bg-[#2eaaaf]/20">
            {/* Notion Style Header */}
            <div className="max-w-7xl mx-auto px-12 pt-12">
                <div className="flex items-center gap-3 mb-4 group cursor-default">
                    <div className="w-12 h-12 bg-[#F1F1EF] rounded-lg flex items-center justify-center text-2xl shadow-sm group-hover:bg-[#E8E8E4] transition-colors">
                        📄
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Archivo Central</h1>
                        <p className="text-sm text-[#37352f]/40 font-medium">Gestiona documentos, contratos y nóminas de forma centralizada.</p>
                    </div>
                </div>

                {/* Properties Bar / Top Filters */}
                <div className="flex flex-wrap items-center gap-4 py-6 border-b border-[#37352f]/10 mb-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#F1F1EF] rounded-md transition-colors cursor-pointer group">
                        <Search size={14} className="text-[#37352f]/40 group-hover:text-[#37352f]" />
                        <input
                            type="text"
                            placeholder="Buscar archivo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium w-40 placeholder:text-[#37352f]/30"
                        />
                    </div>
                    <div className="h-4 w-[1px] bg-[#37352f]/10" />

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory("todos")}
                            className={cn(
                                "text-xs font-semibold px-3 py-1 rounded-full transition-all border",
                                selectedCategory === "todos" ? "bg-[#37352f] text-white border-[#37352f]" : "bg-white text-[#37352f]/60 border-[#37352f]/10 hover:border-[#37352f]/40"
                            )}
                        >
                            Todos
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "text-xs font-semibold px-3 py-1 rounded-full transition-all border whitespace-nowrap",
                                    selectedCategory === cat.id ? "bg-[#37352f] text-white border-[#37352f]" : "bg-white text-[#37352f]/60 border-[#37352f]/10 hover:border-[#37352f]/40"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="flex items-center gap-2 px-4 py-1.5 bg-[#2383e2] hover:bg-[#0b66c2] text-white text-sm font-bold rounded-md shadow-sm transition-all"
                        >
                            <Plus size={16} /> Nuevo
                        </button>
                        <button className="p-1.5 hover:bg-[#F1F1EF] rounded-md text-[#37352f]/40">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>

                {/* Inline Database View */}
                <div className="relative overflow-x-auto custom-scrollbar min-h-[500px]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex flex-col items-center justify-center">
                            <Loader2 className="w-6 h-6 text-[#2383e2] animate-spin mb-2" />
                            <p className="text-xs font-bold text-[#37352f]/40 uppercase tracking-widest">Sincronizando Notion...</p>
                        </div>
                    )}

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#37352f]/10">
                                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-wider w-[40%]">
                                    <div className="flex items-center gap-2">
                                        <FileText size={12} /> Nombre del Archivo
                                    </div>
                                </th>
                                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-wider w-[15%]">
                                    <div className="flex items-center gap-2">
                                        <Tag size={12} /> Categoría
                                    </div>
                                </th>
                                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-wider w-[15%]">
                                    <div className="flex items-center gap-2">
                                        <Database size={12} /> Entidad
                                    </div>
                                </th>
                                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-wider w-[15%]">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} /> Fecha
                                    </div>
                                </th>
                                <th className="py-2.5 px-3 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-wider text-right w-[15%]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#37352f]/5">
                            {docs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center opacity-30">
                                            <FileIcon size={40} className="mb-4 text-[#37352f]/20" />
                                            <p className="text-sm font-medium">No hay documentos en esta vista</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {docs.map((doc) => {
                                const catStyle = CATEGORIES.find(c => c.id === doc.categoria)?.color || 'bg-gray-100 text-gray-700';
                                return (
                                    <tr key={doc.id} className="group hover:bg-[#F1F1EF]/50 transition-colors">
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-3">
                                                <div className="min-w-[24px]">
                                                    {getFileIcon(doc.formato)}
                                                </div>
                                                <span className="text-sm font-semibold truncate hover:text-[#2383e2] cursor-pointer" onClick={() => descargarDocumento(doc.url_storage)}>
                                                    {doc.nombre_archivo}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-sm whitespace-nowrap", catStyle)}>
                                                {doc.categoria.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2 text-sm text-[#37352f]/60 italic font-medium">
                                                {doc.cliente_asociado || '--'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-sm text-[#37352f]/40 font-medium">
                                            {new Date(doc.fecha_subida).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => descargarDocumento(doc.url_storage)}
                                                    className="p-1.5 hover:bg-[#37352f]/5 rounded text-[#37352f]/60 hover:text-[#37352f]"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-1.5 hover:bg-red-50 rounded text-[#37352f]/60 hover:text-red-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* New Item Placeholder Row */}
                            <tr className="hover:bg-[#F1F1EF]/50 cursor-pointer group transition-colors" onClick={() => setIsUploadOpen(true)}>
                                <td colSpan={5} className="py-3 px-3 text-sm text-[#37352f]/30 font-medium flex items-center gap-2">
                                    <Plus size={14} className="opacity-50" />
                                    <span>Agregar un nuevo documento...</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Notion Statistics Summary */}
                <div className="mt-12 grid grid-cols-4 gap-6 border-t border-[#37352f]/10 pt-8 pb-20">
                    {[
                        { label: 'Archivos Totales', val: stats.total, icon: <FileText size={16} />, color: 'text-blue-500' },
                        { label: 'Documentos PDF', val: stats.pdfs, icon: <CheckCircle2 size={16} />, color: 'text-red-500' },
                        { label: 'Hojas Excel', val: stats.excels, icon: <ExcelIcon size={16} />, color: 'text-green-600' },
                        { label: 'Planillas Word', val: stats.words, icon: <WordIcon size={16} />, color: 'text-blue-600' }
                    ].map((s, i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#37352f]/40">
                                {s.icon} {s.label}
                            </div>
                            <div className="text-3xl font-bold tracking-tight">{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notion Style Upload Modal */}
            <AnimatePresence>
                {isUploadOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUploadOpen(false)}
                            className="absolute inset-0 bg-black/5 backdrop-blur-[2px]"
                        />
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 10 }}
                            className="bg-white w-full max-w-xl relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-lg border border-[#37352f]/10 overflow-hidden"
                        >
                            <form onSubmit={handleUpload}>
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Share2 size={18} className="text-[#37352f]/40" />
                                        <span className="text-sm font-bold">Subir a la Base de Datos</span>
                                    </div>
                                    <button type="button" onClick={() => setIsUploadOpen(false)} className="text-[#37352f]/40 hover:text-[#37352f]"><X size={20} /></button>
                                </div>

                                <div className="p-10 pt-4 space-y-10">
                                    <div className="space-y-4">
                                        <div className="relative border-2 border-dashed border-[#F1F1EF] rounded-lg p-12 flex flex-col items-center justify-center hover:border-[#2383e2]/30 hover:bg-[#F1F1EF]/30 transition-all cursor-pointer group">
                                            <input
                                                required
                                                type="file"
                                                accept=".pdf,.xlsx,.docx"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            {file ? (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-[#F1F1EF] rounded-lg flex items-center justify-center mx-auto mb-4">
                                                        {getFileIcon(file.name.split('.').pop() || '')}
                                                    </div>
                                                    <p className="text-sm font-bold text-[#37352f]">{file.name}</p>
                                                    <p className="text-[10px] font-medium text-[#37352f]/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 bg-[#F1F1EF] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <Plus size={24} className="text-[#37352f]/20" />
                                                    </div>
                                                    <p className="text-sm font-bold opacity-60">Selecciona un archivo</p>
                                                    <p className="text-[11px] font-medium opacity-30 mt-1 uppercase tracking-widest text-[#37352f]">PDF, Excel o Word</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline Property Editor Look */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-wider flex items-center gap-2">
                                                <Tag size={12} /> Categoría
                                            </div>
                                            <div className="flex-1">
                                                <select
                                                    required
                                                    value={category}
                                                    onChange={e => setCategory(e.target.value as any)}
                                                    className="w-full bg-[#F1F1EF] border-none rounded-md p-2.5 text-xs font-bold outline-none hover:bg-[#E8E8E4] transition-colors appearance-none cursor-pointer"
                                                >
                                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-wider flex items-center gap-2">
                                                <Database size={12} /> Entidad
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={client}
                                                    onChange={e => setClient(e.target.value)}
                                                    className="w-full bg-[#F1F1EF] border-none rounded-md p-2.5 text-xs font-bold outline-none focus:bg-[#E8E8E4] transition-all"
                                                    placeholder="Ej: Amazon"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsUploadOpen(false)}
                                            className="px-4 py-2 hover:bg-[#F1F1EF] rounded-md text-xs font-bold transition-all text-[#37352f]/60"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            disabled={uploading || !file}
                                            type="submit"
                                            className="px-6 py-2 bg-[#2383e2] hover:bg-[#0b66c2] text-white text-xs font-bold rounded-md shadow-sm transition-all flex items-center gap-2 disabled:opacity-40"
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Sincronizando...
                                                </>
                                            ) : (
                                                'Guardar registro'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #F1F1EF;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #E8E8E4;
                }
            `}</style>
        </div>
    );
}
