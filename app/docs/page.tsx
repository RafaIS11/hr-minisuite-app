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
    CheckCircle2,
    ArrowUpDown,
    Zap,
    Maximize2,
    Settings2,
    User,
    AlignLeft,
    Hash,
    MoreVertical,
    GripVertical
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
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Upload Form
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState<'nomina' | 'contrato' | 'cliente' | 'proveedor' | 'certificado'>('nomina');
    const [client, setClient] = useState("");

    useEffect(() => {
        loadData();
    }, [search, selectedCategory]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: emp } = await supabase.from("empleados").select("id").eq("email", user.email).maybeSingle();
            const data = await obtenerDocumentos({
                categoria: selectedCategory,
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
            case 'pdf': return <FileIcon className="text-red-500" size={16} />;
            case 'xlsx': return <ExcelIcon className="text-green-600" size={16} />;
            case 'docx': return <WordIcon className="text-blue-500" size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="min-h-screen bg-white text-[#37352f] font-sans selection:bg-[#2eaaaf]/20">
            {/* Notion Style Header Container */}
            <div className="max-w-[1400px] mx-auto px-12 pt-16">

                {/* Title & Top Toolbar */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 group cursor-default">
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={14} className="text-[#37352f]/30" />
                            <GripVertical size={14} className="text-[#37352f]/30 mr-1" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-[#F1F1EF] rounded-sm text-[#37352f]/60 transition-colors">
                            <Filter size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-[#F1F1EF] rounded-sm text-[#37352f]/60 transition-colors">
                            <ArrowUpDown size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-[#F1F1EF] rounded-sm text-[#37352f]/60 transition-colors">
                            <Zap size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-[#F1F1EF] rounded-sm text-[#37352f]/60 transition-colors">
                            <Search size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-[#F1F1EF] rounded-sm text-[#37352f]/60 transition-colors">
                            <Maximize2 size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-[#F1F1EF] rounded-sm text-[#37352f]/60 transition-colors">
                            <MoreHorizontal size={16} />
                        </button>

                        {/* Notion Split Button 'New' */}
                        <div className="flex items-center ml-2">
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="bg-[#2383e2] hover:bg-[#0b66c2] text-white text-[13px] font-bold px-3 py-[5px] rounded-l-sm transition-colors"
                            >
                                New
                            </button>
                            <div className="w-[1px] h-[28px] bg-white/20" />
                            <button className="bg-[#2383e2] hover:bg-[#0b66c2] text-white px-1.5 py-[5px] rounded-r-sm transition-colors">
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Inline Database View */}
                <div className="mt-4 border-t border-[#37352f]/10">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="group">
                                    <th className="w-10 border-b border-r border-[#37352f]/10 p-2">
                                        <input type="checkbox" className="w-3.5 h-3.5 accent-[#2383e2] opacity-30 group-hover:opacity-100 cursor-pointer" />
                                    </th>
                                    <th className="w-[35%] border-b border-r border-[#37352f]/10 p-2.5 text-[12px] font-medium text-[#37352f]/50 bg-white">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] scale-90 opacity-60 font-bold tracking-tight">Aa</span>
                                            <span>Name</span>
                                        </div>
                                    </th>
                                    <th className="w-[15%] border-b border-r border-[#37352f]/10 p-2.5 text-[12px] font-medium text-[#37352f]/50 bg-white">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 rounded-full border border-[#37352f]/30 flex items-center justify-center">
                                                <ChevronDown size={8} />
                                            </div>
                                            <span>Select</span>
                                        </div>
                                    </th>
                                    <th className="w-[15%] border-b border-r border-[#37352f]/10 p-2.5 text-[12px] font-medium text-[#37352f]/50 bg-white">
                                        <div className="flex items-center gap-1.5">
                                            <User size={13} className="opacity-60" />
                                            <span>Person</span>
                                        </div>
                                    </th>
                                    <th className="w-[15%] border-b border-r border-[#37352f]/10 p-2.5 text-[12px] font-medium text-[#37352f]/50 bg-white">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={13} className="opacity-60" />
                                            <span>Date</span>
                                        </div>
                                    </th>
                                    <th className="w-[15%] border-b border-r border-[#37352f]/10 p-2.5 text-[12px] font-medium text-[#37352f]/50 bg-white text-right pr-4">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <AlignLeft size={13} className="opacity-60" />
                                            <span>Text</span>
                                        </div>
                                    </th>
                                    <th className="w-16 border-b border-[#37352f]/10 p-2.5 text-[12px] font-medium text-[#37352f]/50 bg-white">
                                        <div className="flex items-center gap-1.5">
                                            <Hash size={13} className="opacity-60" />
                                            <span>ID</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#37352f]/5">
                                {/* '+ New page' placeholder row */}
                                <tr
                                    onClick={() => setIsUploadOpen(true)}
                                    className="group hover:bg-[#F1F1EF] cursor-pointer transition-colors"
                                >
                                    <td className="border-r border-[#37352f]/10 p-2">
                                        <div className="w-3.5 h-3.5 opacity-0 group-hover:opacity-20" />
                                    </td>
                                    <td className="border-r border-[#37352f]/10 p-2.5 text-[13px] text-[#37352f]/30 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Plus size={14} className="opacity-60" />
                                            New page
                                        </div>
                                    </td>
                                    <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                    <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                    <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                    <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                    <td className="p-2.5"></td>
                                </tr>

                                {/* Real Document Rows */}
                                {docs.map((doc) => {
                                    const catStyle = CATEGORIES.find(c => c.id === doc.categoria)?.color || 'bg-gray-100 text-gray-700';
                                    return (
                                        <tr key={doc.id} className="group hover:bg-[#F1F1EF] transition-colors">
                                            <td className="border-r border-[#37352f]/10 p-2">
                                                <input type="checkbox" className="w-3.5 h-3.5 accent-[#2383e2] opacity-0 group-hover:opacity-100 cursor-pointer" />
                                            </td>
                                            <td className="border-r border-[#37352f]/10 p-2.5 group/cell">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="min-w-[16px]">
                                                        {getFileIcon(doc.formato)}
                                                    </div>
                                                    <span
                                                        className="text-[13px] font-semibold truncate hover:text-[#2383e2] cursor-pointer"
                                                        onClick={() => descargarDocumento(doc.url_storage)}
                                                    >
                                                        {doc.nombre_archivo}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                                        className="ml-auto opacity-0 group-hover/cell:opacity-100 p-0.5 hover:bg-[#37352f]/5 rounded"
                                                    >
                                                        <Trash2 size={12} className="text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="border-r border-[#37352f]/10 p-2.5">
                                                <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap", catStyle)}>
                                                    {doc.categoria}
                                                </span>
                                            </td>
                                            <td className="border-r border-[#37352f]/10 p-2.5">
                                                <div className="flex items-center gap-1.5 text-[13px] text-[#37352f]/60 italic">
                                                    {doc.cliente_asociado || '--'}
                                                </div>
                                            </td>
                                            <td className="border-r border-[#37352f]/10 p-2.5 text-[13px] text-[#37352f]/50">
                                                {new Date(doc.fecha_subida).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="border-r border-[#37352f]/10 p-2.5 text-right text-[12px] text-[#37352f]/40 font-medium">
                                                <span className="opacity-60 truncate block">{doc.id.split('-')[0]}</span>
                                            </td>
                                            <td className="p-2.5 text-[12px] text-[#37352f]/40">
                                                {doc.formato.toUpperCase()}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Remaining Empty Rows to fill the view */}
                                {Array.from({ length: Math.max(0, 8 - docs.length) }).map((_, i) => (
                                    <tr key={`empty-${i}`} className="h-[40px] pointer-events-none">
                                        <td className="border-r border-[#37352f]/10 p-2"></td>
                                        <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                        <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                        <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                        <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                        <td className="border-r border-[#37352f]/10 p-2.5"></td>
                                        <td className="p-2.5"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Statistics - Notion Summary Style */}
                <div className="mt-8 border-t border-[#37352f]/10 pt-6 pb-20">
                    <div className="flex items-center gap-10">
                        <div className="group cursor-default">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/30 mb-1 flex items-center gap-1.5">
                                <FileText size={10} /> Count
                            </p>
                            <p className="text-xl font-bold">{stats.total}</p>
                        </div>
                        <div className="w-[1px] h-8 bg-[#37352f]/5" />
                        <div className="group cursor-default">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/30 mb-1 flex items-center gap-1.5 text-red-400">
                                <CheckCircle2 size={10} /> PDF
                            </p>
                            <p className="text-xl font-bold">{stats.pdfs}</p>
                        </div>
                        <div className="group cursor-default">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/30 mb-1 flex items-center gap-1.5 text-green-500">
                                <ExcelIcon size={10} /> XLSX
                            </p>
                            <p className="text-xl font-bold">{stats.excels}</p>
                        </div>
                        <div className="group cursor-default">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/30 mb-1 flex items-center gap-1.5 text-blue-400">
                                <WordIcon size={10} /> DOCX
                            </p>
                            <p className="text-xl font-bold">{stats.words}</p>
                        </div>
                    </div>
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
                            className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"
                        />
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: 10 }}
                            className="bg-white w-full max-w-xl relative z-10 shadow-[0_30px_60px_rgba(0,0,0,0.12)] rounded-lg border border-[#37352f]/10 overflow-hidden"
                        >
                            <form onSubmit={handleUpload}>
                                <div className="p-5 flex items-center justify-between border-b border-[#37352f]/5">
                                    <div className="flex items-center gap-2">
                                        <Share2 size={16} className="text-[#37352f]/40" />
                                        <span className="text-[13px] font-bold">Import Document</span>
                                    </div>
                                    <button type="button" onClick={() => setIsUploadOpen(false)} className="text-[#37352f]/40 hover:text-[#37352f] p-1 rounded-sm hover:bg-[#F1F1EF] transition-colors"><X size={18} /></button>
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="relative border-2 border-dashed border-[#F1F1EF] rounded-lg p-10 flex flex-col items-center justify-center hover:border-[#2383e2]/30 hover:bg-[#F1F1EF]/30 transition-all cursor-pointer group">
                                        <input
                                            required
                                            type="file"
                                            accept=".pdf,.xlsx,.docx"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        {file ? (
                                            <div className="text-center">
                                                <div className="w-14 h-14 bg-[#F1F1EF] rounded-lg flex items-center justify-center mx-auto mb-3">
                                                    {getFileIcon(file.name.split('.').pop() || '')}
                                                </div>
                                                <p className="text-[13px] font-bold text-[#37352f]">{file.name}</p>
                                                <p className="text-[10px] font-medium text-[#37352f]/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-14 h-14 bg-[#F1F1EF] rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                                    <Plus size={20} className="text-[#37352f]/20" />
                                                </div>
                                                <p className="text-[13px] font-bold opacity-60 text-[#37352f]">Choose a file</p>
                                                <p className="text-[10px] font-medium opacity-30 mt-1 uppercase tracking-widest text-[#37352f]">PDF, XLSX, DOCX</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-24 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-widest flex items-center gap-2">
                                                <Tag size={12} /> Select
                                            </div>
                                            <select
                                                required
                                                value={category}
                                                onChange={e => setCategory(e.target.value as any)}
                                                className="flex-1 bg-transparent border-none rounded-md p-1.5 text-[13px] font-bold outline-none hover:bg-[#F1F1EF] transition-colors appearance-none cursor-pointer"
                                            >
                                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 text-[11px] font-semibold text-[#37352f]/40 uppercase tracking-widest flex items-center gap-2">
                                                <Database size={12} /> Entity
                                            </div>
                                            <input
                                                type="text"
                                                value={client}
                                                onChange={e => setClient(e.target.value)}
                                                className="flex-1 bg-transparent border-none rounded-md p-1.5 text-[13px] font-medium outline-none hover:bg-[#F1F1EF] focus:bg-[#F1F1EF] transition-all"
                                                placeholder="Enter entity name..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsUploadOpen(false)}
                                            className="px-4 py-1.5 hover:bg-[#F1F1EF] rounded-md text-[13px] font-medium transition-all text-[#37352f]/40"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={uploading || !file}
                                            type="submit"
                                            className="px-5 py-1.5 bg-[#2383e2] hover:bg-[#0b66c2] text-white text-[13px] font-bold rounded-md shadow-sm transition-all flex items-center gap-2 disabled:opacity-30"
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                'Create page'
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
                    background: #E8E8E4;
                    border-radius: 10px;
                    border: 2px solid white;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D8D8D4;
                }
                table th, table td {
                    border-color: rgba(55, 53, 47, 0.08) !important;
                }
            `}</style>
        </div>
    );
}
