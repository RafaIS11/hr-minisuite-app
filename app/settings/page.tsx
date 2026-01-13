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
    Landmark
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEmployee() {
            setLoading(true);
            const { data } = await supabase.from("empleados").select("*").limit(1).single();
            if (data) setEmployee(data);
            setLoading(false);
        }
        fetchEmployee();
    }, []);

    if (loading) return <div className="p-8 animate-pulse italic">Cargando perfil...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12">
            <header>
                <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Mi Identidad</p>
                <h1 className="text-4xl font-display tracking-tight text-charcoal">Configuración de Perfil</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-white border-premium swiss-shadow p-8 flex flex-col items-center text-center space-y-6">
                        <div className="w-32 h-32 rounded-full border-premium bg-[#F1F1EF] flex items-center justify-center overflow-hidden">
                            <User size={64} className="text-charcoal/20" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display">{employee?.nombre}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">{employee?.puesto}</p>
                        </div>
                        <div className="w-full pt-6 border-t-premium flex flex-col gap-3">
                            <button className="w-full py-4 text-xs font-bold uppercase tracking-widest border-premium hover:bg-[#F1F1EF] transition-colors rounded-sm shadow-sm">
                                Cambiar Foto
                            </button>
                            <button className="w-full py-4 text-xs font-bold uppercase tracking-widest bg-charcoal text-white rounded-sm hover:translate-y-[-2px] transition-transform">
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
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal">
                                    <Mail size={16} className="text-primary" />
                                    <span>{employee?.email || 'rafa@empresa.com'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">Teléfono</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal">
                                    <Phone size={16} className="text-primary" />
                                    <span>+34 600 000 000</span>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">Dirección</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal">
                                    <MapPin size={16} className="text-primary" />
                                    <span>{employee?.direccion || 'Calle de la Empresa 1, 28001 Madrid'}</span>
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
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">ID Empleado</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal italic opacity-60">
                                    <Landmark size={16} className="text-primary" />
                                    <span>{employee?.id?.slice(0, 8)}...</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/20">Departamento</label>
                                <div className="flex items-center gap-3 text-sm font-medium text-charcoal">
                                    <Building size={16} className="text-primary" />
                                    <span>Operaciones Tech</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-primary text-white border-premium swiss-shadow p-8 space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                            <CreditCard size={14} /> Preferencias Fiscales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-6 rounded-full p-1 transition-colors",
                                    employee?.nocturnidad ? "bg-white" : "bg-white/20"
                                )}>
                                    <div className={cn("w-4 h-4 rounded-full transition-transform", employee?.nocturnidad ? "bg-primary translate-x-4" : "bg-white translate-x-0")} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest">Nocturnidad</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-6 rounded-full p-1 transition-colors",
                                    employee?.discapacidad ? "bg-white" : "bg-white/20"
                                )}>
                                    <div className={cn("w-4 h-4 rounded-full transition-transform", employee?.discapacidad ? "bg-primary translate-x-4" : "bg-white translate-x-0")} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest">Discapacidad 33%</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
