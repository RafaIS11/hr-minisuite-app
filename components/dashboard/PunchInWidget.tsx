"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Pause, Coffee, UserRound, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

import { supabase } from "@/lib/supabase";

type PunchStatus = "idle" | "active" | "paused";

export function PunchInWidget() {
    const [status, setStatus] = useState<PunchStatus>("idle");
    const [time, setTime] = useState(0);
    const [pauseReason, setPauseReason] = useState<string | null>(null);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [employeeId, setEmployeeId] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        async function init() {
            // 1. Fetch first employee to act as "Current User"
            const { data: empData } = await supabase.from("empleados").select("id").limit(1).single();
            if (empData) {
                setEmployeeId(empData.id);

                // 2. Check for open shift (tipo_dia is irrelevant, we look for record where 'salida' is null)
                const { data: lastFichaje } = await supabase
                    .from("fichajes")
                    .select("*")
                    .eq("empleado_id", empData.id)
                    .is("salida", null)
                    .order("entrada", { ascending: false })
                    .limit(1)
                    .single();

                if (lastFichaje) {
                    setStatus("active");
                    const start = new Date(lastFichaje.entrada).getTime();
                    setTime(Date.now() - start);
                }
            }
        }
        init();
    }, []);

    useEffect(() => {
        if (status === "active") {
            timerRef.current = setInterval(() => {
                setTime((prev) => prev + 10);
            }, 10);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status]);

    const formatTime = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    };

    const handlePunchIn = async () => {
        if (!employeeId) return;

        const now = new Date().toISOString();
        const { error } = await supabase.from("fichajes").insert([
            {
                empleado_id: employeeId,
                entrada: now,
                fecha: now.split('T')[0],
                tipo_dia: 'presencial'
            }
        ]);

        if (!error) {
            setStatus("active");
            setTime(0);
        }
    };

    const handlePunchOut = async () => {
        if (!employeeId) return;

        // Find the active record to update
        const { data: activeShift } = await supabase
            .from("fichajes")
            .select("id")
            .eq("empleado_id", employeeId)
            .is("salida", null)
            .single();

        if (activeShift) {
            const { error } = await supabase
                .from("fichajes")
                .update({ salida: new Date().toISOString() })
                .eq("id", activeShift.id);

            if (!error) {
                setStatus("idle");
                setTime(0);
                setPauseReason(null);
            }
        }
    };

    const handlePause = (reason: string) => {
        setStatus("paused");
        setPauseReason(reason);
        setShowPauseMenu(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#F1F1EF] rounded border-premium p-6">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Cronómetro de Turno</p>
                <h2 className="text-4xl font-display font-bold tabular-nums text-charcoal mb-1">
                    {formatTime(time)}
                </h2>
                {pauseReason && (
                    <motion.span
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 border border-warning/20 rounded font-bold uppercase tracking-tight"
                    >
                        En Pausa: {pauseReason}
                    </motion.span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {status === "idle" ? (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePunchIn}
                        className="col-span-2 bg-primary text-white py-4 rounded font-bold flex items-center justify-center gap-2 border-premium shadow-[4px_4px_0px_0px_rgba(113,74,56,0.2)]"
                    >
                        <Play size={20} fill="currentColor" />
                        Fichar Entrada
                    </motion.button>
                ) : (
                    <>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={status === "active" ? () => setShowPauseMenu(true) : handlePunchIn}
                            className={cn(
                                "py-3 rounded font-bold flex items-center justify-center gap-2 border-premium",
                                status === "active" ? "bg-surface text-charcoal" : "bg-warning text-white"
                            )}
                        >
                            {status === "active" ? <Pause size={18} /> : <Play size={18} />}
                            {status === "active" ? "Pausar" : "Reanudar"}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePunchOut}
                            className="bg-error text-white py-3 rounded font-bold flex items-center justify-center gap-2 border-premium"
                        >
                            <Square size={16} fill="currentColor" />
                            Cerrar Turno
                        </motion.button>
                    </>
                )}
            </div>

            <AnimatePresence>
                {showPauseMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-6 bottom-24 bg-surface border-premium swiss-shadow p-4 z-10"
                    >
                        <p className="text-xs font-bold text-charcoal/40 uppercase mb-3">Motivo de la pausa:</p>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { label: "Pausa Comida", icon: Coffee },
                                { label: "Descanso", icon: UserRound },
                                { label: "Médico / Salud", icon: Stethoscope },
                            ].map((reason) => (
                                <button
                                    key={reason.label}
                                    onClick={() => handlePause(reason.label)}
                                    className="flex items-center gap-3 p-2 hover:bg-[#F1F1EF] transition-colors rounded text-sm font-medium text-charcoal"
                                >
                                    <reason.icon size={16} />
                                    {reason.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
