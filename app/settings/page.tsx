"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    MapPin,
    Briefcase,
    ShieldCheck,
    LogOut,
    Building,
    Phone,
    Landmark,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const DEPARTAMENTOS = [
    "Dirección General",
    "Recursos Humanos",
    "Tecnología",
    "Marketing",
    "Ventas",
    "Operaciones",
    "Finanzas",
    "Legal",
    "Atención al Cliente"
];

const PUESTOS = [
    "CEO / Fundador",
    "Director de RRHH",
    "HR Manager",
    "CTO / Director Técnico",
    "Software Engineer",
    "Marketing Lead",
    "Sales Manager",
    "Administrativo",
    "Contable",
    "Product Manager"
];

export default function SettingsPage() {
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        nombre: "",
        puesto: "",
        telefono: "",
        direccion: "",
        departamento: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("empleados")
                .select("*")
                .eq("email", user.email)
                .maybeSingle();

            if (data) {
                setProfile(data);
                setFormData({
                    nombre: data.nombre || "",
                    puesto: data.puesto || "",
                    telefono: data.telefono || "",
                    direccion: data.direccion || "",
                    departamento: data.departamento || ""
                });
            } else {
                // Pre-fill from session metadata
                setFormData({
                    nombre: user.user_metadata?.full_name || "",
                    puesto: "Nuevo Colaborador",
                    telefono: "",
                    direccion: "",
                    departamento: "Sin asignar"
                });
            }
        } catch (err) {
            console.error("Error loading profile:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa");

            const payload = {
                ...formData,
                email: user.email,
                fecha_alta: profile?.fecha_alta || new Date().toISOString().split('T')[0],
                salario_base: profile?.salario_base || 0,
                salario_bruto_anual: profile?.salario_bruto_anual || 0
            };

            let result;
            if (profile?.id) {
                // Update
                result = await supabase
                    .from("empleados")
                    .update(payload)
                    .eq("email", user.email)
                    .select()
                    .single();
            } else {
                // Insert
                result = await supabase
                    .from("empleados")
                    .insert([payload])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            setProfile(result.data);
            setMessage({ type: 'success', text: "¡Perfil guardado con éxito! Ya puedes chatear." });
        } catch (error: any) {
            console.error("Error saving:", error);
            setMessage({ type: 'error', text: "No se pudo guardar: " + error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="animate-spin text-primary" size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest text-charcoal/40">Sincronizando identidad...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 lg:space-y-12 pb-24">
            <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <p className="text-[10px] lg:text-sm font-medium text-primary uppercase tracking-widest mb-1">Mi Identidad</p>
                    <h1 className="text-2xl lg:text-4xl font-display tracking-tight text-charcoal">Configuración de Perfil</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full lg:w-auto bg-charcoal text-white px-8 py-4 rounded-sm font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    Guardar Cambios
                </button>
            </header>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-6 border-[1.5px] flex items-center gap-4 font-bold text-xs uppercase tracking-widest",
                        message.type === 'success' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    )}
                >
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </motion.div>
            )}

            {!profile && (
                <div className="p-6 bg-primary/5 border-[1.5px] border-primary/10 text-primary flex items-start gap-4">
                    <AlertCircle className="shrink-0" size={20} />
                    <div className="space-y-1">
                        <p className="font-bold text-xs uppercase tracking-widest">Perfil no activado</p>
                        <p className="text-sm italic opacity-80">Rellena tus datos y pulsa "Guardar" para aparecer en el directorio de la empresa y activar el chat.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-8">
                    <div className="bg-white border-premium swiss-shadow p-8 flex flex-col items-center text-center space-y-6">
                        <div className="w-32 h-32 rounded-full border-premium bg-[#F1F1EF] flex items-center justify-center overflow-hidden">
                            {profile?.foto_url ? (
                                <img src={profile.foto_url} alt={formData.nombre} className="w-full h-full object-cover" />
                            ) : (
                                <User size={64} className="text-charcoal/20" />
                            )}
                        </div>
                        <div className="w-full space-y-4">
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Tu nombre..."
                                className="w-full bg-[#f8f8f7] border-premium rounded-sm py-4 px-4 text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all border-[#2C2C2A]/10"
                            />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary italic">
                                {formData.puesto || "Define tu cargo"}
                            </p>
                        </div>
                        <div className="w-full pt-6 border-t-premium flex flex-col gap-3">
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 text-xs font-bold uppercase tracking-widest border-premium text-charcoal/60 hover:text-charcoal transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut size={14} /> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-8">
                    <section className="bg-white border-premium swiss-shadow p-8 space-y-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/40 flex items-center gap-2">
                            <ShieldCheck size={14} /> Información de Contacto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Email (Sólo lectura)</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal/50 bg-[#F1F1EF] p-4 rounded-sm border-premium">
                                    <Mail size={16} />
                                    <span>{profile?.email || 'vincular@email.com'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Número de Teléfono</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal focus-within:ring-1 focus-within:ring-primary/20 border-premium bg-[#f8f8f7] p-4 rounded-sm">
                                    <Phone size={16} className="text-primary" />
                                    <input
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        placeholder="+34 000 000 000"
                                        className="bg-transparent border-none p-0 focus:outline-none w-full"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Dirección Física</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal focus-within:ring-1 focus-within:ring-primary/20 border-premium bg-[#f8f8f7] p-4 rounded-sm">
                                    <MapPin size={16} className="text-primary" />
                                    <input
                                        type="text"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        placeholder="Tu dirección completa..."
                                        className="bg-transparent border-none p-0 focus:outline-none w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white border-premium swiss-shadow p-8 space-y-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/40 flex items-center gap-2">
                            <Briefcase size={14} /> Rol en la Empresa
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Puesto de trabajo</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal focus-within:ring-1 focus-within:ring-primary/20 border-premium bg-[#f8f8f7] p-4 rounded-sm">
                                    <Landmark size={16} className="text-primary" />
                                    <select
                                        value={formData.puesto}
                                        onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                        className="bg-transparent border-none p-0 focus:outline-none w-full appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Selecciona un puesto...</option>
                                        {PUESTOS.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">Departamento</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal focus-within:ring-1 focus-within:ring-primary/20 border-premium bg-[#f8f8f7] p-4 rounded-sm">
                                    <Building size={16} className="text-primary" />
                                    <select
                                        value={formData.departamento}
                                        onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                                        className="bg-transparent border-none p-0 focus:outline-none w-full appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Selecciona un departamento...</option>
                                        {DEPARTAMENTOS.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
