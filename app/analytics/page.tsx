"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Clock, AlertCircle, BarChart3, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function AnalyticsPage() {
    const [stats, setStats] = useState({
        totalPayroll: 0,
        employees: 0,
        avgSalary: 0,
        absenteeism: 0
    });
    const [chartData, setChartData] = useState<{ month: string; cost: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);

            // 1. Basic Stats
            const { data: emps } = await supabase.from("empleados").select("salario_base");
            const totalEmps = emps?.length || 0;
            const totalBase = emps?.reduce((acc, e) => acc + Number(e.salario_base), 0) || 0;
            const avgBase = totalEmps > 0 ? totalBase / totalEmps : 0;

            // 2. Absenteeism (conceptually: Libre/Vacaciones vs total turnos)
            const { data: turnos } = await supabase.from("turnos").select("tipo_turno");
            const vacacent = turnos?.filter(t => t.tipo_turno === 'Vacaciones' || t.tipo_turno === 'Libre').length || 0;
            const totalTurnos = turnos?.length || 1;
            const absRate = (vacacent / totalTurnos) * 100;

            setStats({
                totalPayroll: totalBase / 12,
                employees: totalEmps,
                avgSalary: avgBase,
                absenteeism: absRate
            });

            // 3. Simulated/Conceptual Chart Data for last 3 months
            setChartData([
                { month: "Oct", cost: (totalBase / 12) * 0.95 },
                { month: "Nov", cost: (totalBase / 12) * 1.05 },
                { month: "Dic", cost: totalBase / 12 }
            ]);

            setLoading(false);
        }
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-8 animate-pulse text-charcoal/40 font-bold">Calculando métricas corporativas...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Business Intelligence</p>
                <h1 className="text-4xl font-display tracking-tight text-charcoal">Análisis de Datos</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Masa Salarial (Mes)" value={`€${stats.totalPayroll.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<CreditCard size={18} />} />
                <StatCard label="Plantilla Total" value={stats.employees.toString()} icon={<Users size={18} />} />
                <StatCard label="Salario Medio (Anual)" value={`€${stats.avgSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<TrendingUp size={18} />} />
                <StatCard label="Tasa de Absentismo" value={`${stats.absenteeism.toFixed(1)}%`} icon={<AlertCircle size={18} />} color="text-error" />
            </div>

            <section className="bg-surface border-premium swiss-shadow p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-display">Evolución de Coste Laboral</h2>
                        <p className="text-xs text-charcoal/40 uppercase font-bold tracking-widest mt-1">Último Trimestre</p>
                    </div>
                    <BarChart3 className="text-primary/20" size={32} />
                </div>

                <div className="h-64 flex items-end gap-12 px-8">
                    {chartData.map((data, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-4">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(data.cost / Math.max(stats.totalPayroll, 1)) * 100}%` }}
                                className="w-full bg-primary border-premium relative group"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-charcoal text-white text-[10px] px-2 py-1 rounded-sm">
                                    €{data.cost.toLocaleString()}
                                </div>
                            </motion.div>
                            <span className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">{data.month}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function StatCard({ label, value, icon, color = "text-charcoal" }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
    return (
        <div className="bg-surface p-6 border-premium swiss-shadow space-y-4">
            <div className="flex items-center justify-between text-charcoal/30">
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <p className={cn("text-3xl font-display font-bold", color)}>{value}</p>
        </div>
    );
}
