"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Briefcase, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AddEmployeeDrawerProps {
    employee?: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddEmployeeDrawer({ isOpen, onClose, onSuccess, employee }: AddEmployeeDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        puesto: "",
        salario_base: "",
    });

    React.useEffect(() => {
        if (employee) {
            setFormData({
                nombre: employee.nombre,
                email: employee.email,
                puesto: employee.puesto,
                salario_base: employee.salario_base?.toString() || "",
            });
        } else {
            setFormData({ nombre: "", email: "", puesto: "", salario_base: "" });
        }
    }, [employee, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            nombre: formData.nombre,
            email: formData.email,
            puesto: formData.puesto,
            salario_base: parseFloat(formData.salario_base) || 0,
        };

        let error;
        if (employee) {
            const { error: updateError } = await supabase
                .from("empleados")
                .update(payload)
                .eq("id", employee.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from("empleados")
                .insert([{ ...payload, fecha_alta: new Date().toISOString() }]);
            error = insertError;
        }

        setLoading(false);
        if (error) {
            alert("Error saving employee: " + error.message);
        } else {
            if (!employee) {
                // Automated welcome email only for NEW employees
                try {
                    await fetch("/api/n8n", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            event: "new_employee",
                            data: formData
                        })
                    });
                } catch (err) {
                    console.error("n8n Webhook failed:", err);
                }
            }

            onSuccess();
            onClose();
            setFormData({ nombre: "", email: "", puesto: "", salario_base: "" });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed right-0 top-0 h-screen w-full max-w-md bg-surface border-l-premium z-[101] shadow-2xl p-8 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{employee ? "Editar Ficha" : "Nueva Entrada"}</p>
                                <h2 className="text-2xl font-display text-charcoal">{employee ? "Actualizar Empleado" : "Añadir Empleado"}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[#F1F1EF] rounded-full transition-colors border-premium"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest flex items-center gap-2">
                                    <User size={12} /> Nombre Completo
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="ej. Elena Rossi"
                                    className="w-full p-3 bg-[#F1F1EF] border-premium rounded-sm focus:outline-none focus:border-primary transition-colors text-sm font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest flex items-center gap-2">
                                    <Mail size={12} /> Correo Electrónico
                                </label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="elena@empresa.com"
                                    className="w-full p-3 bg-[#F1F1EF] border-premium rounded-sm focus:outline-none focus:border-primary transition-colors text-sm font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase size={12} /> Puesto / Cargo
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.puesto}
                                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                    placeholder="ej. Diseñadora Senior"
                                    className="w-full p-3 bg-[#F1F1EF] border-premium rounded-sm focus:outline-none focus:border-primary transition-colors text-sm font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={12} /> Salario Base (€)
                                </label>
                                <input
                                    required
                                    type="number"
                                    value={formData.salario_base}
                                    onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                                    placeholder="45000"
                                    className="w-full p-3 bg-[#F1F1EF] border-premium rounded-sm focus:outline-none focus:border-primary transition-colors text-sm font-medium"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-primary text-white py-4 rounded-sm font-bold border-premium swiss-shadow hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {loading ? "Procesando..." : (employee ? "Guardar Cambios" : "Registrar Empleado")}
                                </button>
                                <p className="text-center text-[10px] text-charcoal/30 mt-4 uppercase font-bold tracking-widest">
                                    Confidencial • Solo Acceso RRHH
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
