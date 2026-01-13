"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    MapPin,
    Briefcase,
    CreditCard,
    ShieldCheck,
    CheckCircle2,
    LogOut,
    Building,
    Phone,
    Landmark,
    Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [employee, setEmployee] = useState<any>({
        nombre: "",
        email: "",
        puesto: "",
        telefono: "",
        direccion: "",
        departamento: "",
        salario_base: 0,
        salario_bruto_anual: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        async function fetchEmployee() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data } = await supabase
                    .from("empleados")
                    .select("*")
                    .eq("email", user.email)
                    .maybeSingle();

                if (data) {
                    setEmployee(data);
                } else {
                    // Si no existe, pre-cargamos el email y nombre de la sesión
                    setEmployee({
                        ...employee,
                        nombre: user.user_metadata?.full_name || "",
                        email: user.email,
                        puesto: "Nuevo Colaborador",
                        departamento: "Sin asignar"
                    });
                }
            }
            setLoading(false);
        }
        fetchEmployee();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa");

            // Creamos o actualizamos el registro (Upsert)
            // Usamos el email como clave para decidir si insertar o actualizar
            const { data, error } = await supabase
                .from("empleados")
                .upsert({
                    ...employee,
                    email: user.email, // El email no cambia
                    fecha_alta: employee.fecha_alta || new Date().toISOString().split('T')[0]
                }, { onConflict: 'email' })
                .select()
                .single();

            if (error) throw error;

            setEmployee(data);
            setMessage({ type: 'success', text: "¡Perfil guardado correctamente!" });

            // Si el nombre cambió, podemos forzar un refresco suave de otros componentes si fuera necesario
            // window.location.reload(); 
        } catch (error: any) {
            setMessage({ type: 'error', text: "Error al guardar: " + error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    if (loading) return <div className="p-8 animate-pulse italic">Cargando perfil...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12 pb-24">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Mi Identidad</p>
                    <h1 className="text-4xl font-display tracking-tight text-charcoal">Configuración de Perfil</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-white px-8 py-4 rounded-sm font-bold uppercase tracking-widest text-[10px] swiss-shadow hover:translate-y-[-2px] transition-transform flex items-center gap-3 disabled:opacity-50"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Guardar Cambios
                </button>
            </header>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "p-4 border-premium font-bold text-xs uppercase tracking-widest",
                        message.type === 'success' ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"
                    )}
                >
                    {message.text}
                </motion.div>
            )}

            {!employee.id && (
                <div className="p-6 bg-[#704A38]/5 border-[1.5px] border-[#704A38]/10 text-[#704A38] italic text-sm">
                    Nota: Completa y guarda tus datos para activar tu perfil en el directorio de la empresa.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-white border-premium swiss-shadow p-8 flex flex-col items-center text-center space-y-6">
                        <div className="w-32 h-32 rounded-full border-premium bg-[#F1F1EF] flex items-center justify-center overflow-hidden">
                            {employee.foto_url ? (
                                <img src={employee.foto_url} alt={employee.nombre} className="w-full h-full object-cover" />
                            ) : (
                                <User size={64} className="text-charcoal/20" />
                            )}
                        </div>
                        <div className="w-full space-y-4">
                            <input
                                type="text"
                                value={employee.nombre}
                                onChange={(e) => setEmployee({ ...employee, nombre: e.target.value })}
                                placeholder="Tu nombre completo"
                                className="w-full bg-[#F1F1EF] border-premium rounded-sm py-3 px-4 text-sm font-bold text-center focus:outline-none focus:border-primary"
                            />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1 italic">
                                {employee.puesto || "Define tu puesto..."}
                            </p>
                        </div>
                        <div className="w-full pt-6 border-t-premium flex flex-col gap-3">
                            <button className="w-full py-4 text-xs font-bold uppercase tracking-widest border-premium hover:bg-[#F1F1EF] transition-colors rounded-sm shadow-sm">
                                Cambiar Foto
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 text-xs font-bold uppercase tracking-widest bg-charcoal text-white rounded-sm hover:translate-y-[-2px] transition-transform"
                            >
                                <LogOut className="inline mr-2" size={14} /> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-8">
                    <section className="bg-white border-premium swiss-shadow p-8 space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/40 flex items-center gap-2">
                            <ShieldCheck size={14} /> Información Personal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">Correo Corporativo</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal opacity-60">
                                    <Mail size={16} className="text-primary" />
                                    <span>{employee.email}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">Teléfono</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal focus-within:text-primary">
                                    <Phone size={16} className="text-primary" />
                                    <input
                                        type="text"
                                        value={employee.telefono}
                                        onChange={(e) => setEmployee({ ...employee, telefono: e.target.value })}
                                        placeholder="+34 000 000 000"
                                        className="bg-transparent border-none p-0 focus:outline-none w-full"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">Dirección</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal focus-within:text-primary">
                                    <MapPin size={16} className="text-primary" />
                                    <input
                                        type="text"
                                        value={employee.direccion}
                                        onChange={(e) => setEmployee({ ...employee, direccion: e.target.value })}
                                        placeholder="Calle Ejemplo 1, 28001 Madrid"
                                        className="bg-transparent border-none p-0 focus:outline-none w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white border-premium swiss-shadow p-8 space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal/40 flex items-center gap-2">
                            <Briefcase size={14} /> Datos Laborales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">Puesto / Cargo</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal focus-within:text-primary">
                                    <Landmark size={16} className="text-primary" />
                                    <input
                                        type="text"
                                        value={employee.puesto}
                                        onChange={(e) => setEmployee({ ...employee, puesto: e.target.value })}
                                        placeholder="Ej. Senior Developer"
                                        className="bg-transparent border-none p-0 focus:outline-none w-full"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">Departamento</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal focus-within:text-primary">
                                    <Building size={16} className="text-primary" />
                                    <input
                                        type="text"
                                        value={employee.departamento}
                                        onChange={(e) => setEmployee({ ...employee, departamento: e.target.value })}
                                        placeholder="Ej. Tecnología"
                                        className="bg-transparent border-none p-0 focus:outline-none w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
