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
    Database
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

export default function DocumentsPage() {
    const [docs, setDocs] = useState<Documento[]>([]);
    const [stats, setStats] = useState({ total: 0, pdfs: 0, excels: 0, words: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("todos");
    const [selectedEntity, setSelectedEntity] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data: emp } = await supabase.from("empleados").select("id").eq("email", user.email).maybeSingle();
        const empleado_id = emp?.id || "anonymous";

        const data = await obtenerDocumentos({
            categoria: selectedCategory,
            cliente: selectedEntity,
            search: search,
            empleado_id: empleado_id
        });
        setDocs(data);

        const s = await obtenerEstadisticas(empleado_id);
        setStats(s);
        setLoading(false);
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
            case 'pdf': return <FileIcon className="text-error" size={20} />;
            case 'xlsx': return <ExcelIcon className="text-success" size={20} />;
            case 'docx': return <WordIcon className="text-primary" size={20} />;
            default: return <FileText size={20} />;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#FAFAF8]">
            {/* Header */}
            <header className="p-8 border-b-[1.5px] border-[#2C2C2A]/10 bg-white flex flex-col lg:flex-row items-center justify-between gap-6">
                <div>
                    <p className="text-[10px] font-bold text-[#704A38] uppercase tracking-[0.3em] mb-2">Gestión Documental</p>
                    <h1 className="text-3xl font-display tracking-tighter text-[#2C2C2A] uppercase">Archivo Centralizado</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C2C2A]/20" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar en el archivo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 pl-12 pr-6 py-4 text-xs font-bold outline-none focus:border-[#704A38] transition-all w-80"
                        />
                    </div>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="bg-[#704A38] text-white px-8 py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:translate-y-[-2px] transition-all shadow-[8px_8px_0px_0px_rgba(112,74,56,0.1)]"
                    >
                        <Upload size={14} /> Subir Archivo
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden p-8 flex gap-8">
                {/* Sidebar Filters */}
                <aside className="w-80 hidden xl:flex flex-col gap-8">
                    <div className="bg-[#2C2C2A] text-white p-8 border-[1.5px] border-[#2C2C2A] space-y-8 shadow-[12px_12px_0px_0px_rgba(44,44,42,0.1)]">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Estadísticas</h3>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { label: 'TOTAL', val: stats.total },
                                { label: 'PDFS', val: stats.pdfs },
                                { label: 'EXCELS', val: stats.excels },
                                { label: 'WORDS', val: stats.words }
                            ].map(s => (
                                <div key={s.label}>
                                    <p className="text-[8px] font-bold opacity-40 mb-1">{s.label}</p>
                                    <p className="text-2xl font-display">{s.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border-[1.5px] border-[#2C2C2A]/10 p-8 flex-1 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40 flex items-center gap-3">
                                <Filter size={12} /> Categorías
                            </h4>
                            <div className="space-y-2">
                                {['todos', 'nomina', 'contrato', 'cliente', 'proveedor', 'certificado'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-[1.5px]",
                                            selectedCategory === cat ? "bg-[#704A38] text-white border-[#704A38]" : "text-[#2C2C2A]/60 border-transparent hover:bg-[#F1F1EF]"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40 flex items-center gap-3">
                                <Database size={12} /> Entidad Asociada
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {['AMAZON', 'GOOGLE', 'DELOITTE', 'LOCAL'].map(e => (
                                    <button
                                        key={e}
                                        onClick={() => setSelectedEntity(selectedEntity === e ? "" : e)}
                                        className={cn(
                                            "px-4 py-2 text-[9px] font-bold uppercase tracking-widest transition-all border-[1.5px]",
                                            selectedEntity === e ? "bg-[#2C2C2A] text-white border-[#2C2C2A]" : "text-[#2C2C2A]/40 border-[#2C2C2A]/10 hover:border-[#2C2C2A]/40"
                                        )}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-white border-[1.5px] border-[#2C2C2A]/10 overflow-hidden flex flex-col relative shadow-[16px_16px_0px_0px_rgba(0,0,0,0.02)]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
                            <Loader2 className="w-8 h-8 text-[#704A38] animate-spin mb-4" />
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em]">Accediendo al servidor...</p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#F1F1EF] z-[5]">
                                <tr>
                                    <th className="p-6 text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40 border-b-[1.5px] border-[#2C2C2A]/10">Archivo</th>
                                    <th className="p-6 text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40 border-b-[1.5px] border-[#2C2C2A]/10">Categoría</th>
                                    <th className="p-6 text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40 border-b-[1.5px] border-[#2C2C2A]/10">Entidad</th>
                                    <th className="p-6 text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40 border-b-[1.5px] border-[#2C2C2A]/10">Fecha</th>
                                    <th className="p-6 text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40 border-b-[1.5px] border-[#2C2C2A]/10 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center opacity-20">
                                                <FileIcon size={48} className="mb-4" />
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">No se han encontrado documentos</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {docs.map((doc) => (
                                    <tr key={doc.id} className="group hover:bg-[#FAFAF8] transition-colors">
                                        <td className="p-6 border-b border-[#2C2C2A]/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white border border-[#2C2C2A]/10 flex items-center justify-center shadow-sm">
                                                    {getFileIcon(doc.formato)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-[#2C2C2A]">{doc.nombre_archivo}</p>
                                                    <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">{doc.formato}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 border-b border-[#2C2C2A]/5">
                                            <span className="px-3 py-1 bg-[#F1F1EF] text-[9px] font-bold uppercase tracking-widest border border-[#2C2C2A]/10">
                                                {doc.categoria}
                                            </span>
                                        </td>
                                        <td className="p-6 border-b border-[#2C2C2A]/5">
                                            <p className="text-[10px] font-bold text-[#2C2C2A]/60">{doc.cliente_asociado || '---'}</p>
                                        </td>
                                        <td className="p-6 border-b border-[#2C2C2A]/5">
                                            <p className="text-[10px] font-medium text-[#2C2C2A]/40">
                                                {new Date(doc.fecha_subida).toLocaleDateString('es-ES')}
                                            </p>
                                        </td>
                                        <td className="p-6 border-b border-[#2C2C2A]/5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => descargarDocumento(doc.url_storage)}
                                                    className="p-3 border border-[#2C2C2A]/10 hover:bg-[#2C2C2A] hover:text-white transition-all text-[#2C2C2A]/40"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-3 border border-[#2C2C2A]/10 hover:bg-error hover:text-white transition-all text-[#2C2C2A]/40 hover:border-error"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUploadOpen(false)}
                            className="absolute inset-0 bg-[#2C2C2A]/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border-[1.5px] border-[#2C2C2A] w-full max-w-lg relative z-10 shadow-[24px_24px_0px_0px_rgba(44,44,42,0.15)]"
                        >
                            <form onSubmit={handleUpload}>
                                <div className="p-8 border-b-[1.5px] border-[#2C2C2A] bg-[#2C2C2A] text-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center">
                                            <Upload size={20} />
                                        </div>
                                        <h3 className="text-xl font-display uppercase tracking-tight">Nueva Subida</h3>
                                    </div>
                                    <button type="button" onClick={() => setIsUploadOpen(false)} className="hover:rotate-90 transition-transform"><X size={20} /></button>
                                </div>

                                <div className="p-10 space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Archivo (PDF, XLSX, DOCX)</label>
                                        <div className="relative border-[1.5px] border-dashed border-[#2C2C2A]/20 p-10 flex flex-col items-center justify-center bg-[#F1F1EF] hover:bg-[#F1F1EF]/50 transition-colors group cursor-pointer">
                                            <input
                                                required
                                                type="file"
                                                accept=".pdf,.xlsx,.docx"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            {file ? (
                                                <div className="flex flex-col items-center">
                                                    <FileText className="text-[#704A38] mb-2" size={32} />
                                                    <p className="text-xs font-bold text-[#2C2C2A]">{file.name}</p>
                                                    <p className="text-[9px] font-bold opacity-40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="text-[#2C2C2A]/20 mb-4 group-hover:scale-110 transition-transform" size={32} />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#2C2C2A]/40">Arrastra o haz click para seleccionar</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Categoría *</label>
                                            <select
                                                required
                                                value={category}
                                                onChange={e => setCategory(e.target.value as any)}
                                                className="w-full bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 p-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-[#704A38] transition-colors appearance-none"
                                            >
                                                <option value="nomina">Nómina</option>
                                                <option value="contrato">Contrato</option>
                                                <option value="cliente">Cliente</option>
                                                <option value="proveedor">Proveedor</option>
                                                <option value="certificado">Certificado</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#2C2C2A]/40">Entidad (Opcional)</label>
                                            <input
                                                type="text"
                                                value={client}
                                                onChange={e => setClient(e.target.value)}
                                                className="w-full bg-[#F1F1EF] border-[1.5px] border-[#2C2C2A]/10 p-4 text-[10px] font-bold outline-none focus:border-[#704A38] transition-colors"
                                                placeholder="Ej: Amazon"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t-[1.5px] border-[#2C2C2A]/10">
                                        <button
                                            disabled={uploading || !file}
                                            type="submit"
                                            className="w-full bg-[#704A38] text-white py-5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                        >
                                            {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                            {uploading ? 'Subiendo archivo...' : 'Sincronizar con Storage'}
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
