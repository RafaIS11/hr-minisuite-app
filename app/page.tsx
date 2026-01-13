"use client";

import { KPICard } from "@/components/dashboard/KPICard";
import { HandCoins, CheckCircle2, Target, TrendingUp, RefreshCw, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    ingresosHoy: 0,
    tareasPendientes: 0,
    objetivosCompletados: 0,
    proximaNomina: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  const fetchUserData = async () => {
    setLoading(true);

    // 1. Obtener el primer empleado como usuario de prueba
    const { data: emp } = await supabase.from("empleados").select("*").limit(1).single();

    if (emp) {
      // 2. Obtener tareas desde calendario_eventos
      const { data: tasks } = await supabase
        .from("calendario_eventos")
        .select("*")
        .eq("tipo_evento", "tarea")
        .eq("estado", "pendiente")
        .order("fecha_inicio", { ascending: true })
        .limit(5);

      // 3. Obtener nómina/horas si existen
      const { data: salaryData } = await supabase
        .from("horas_trabajadas")
        .select("*")
        .eq("empleado_id", emp.id)
        .order("anio", { ascending: false })
        .order("mes", { ascending: false })
        .limit(1)
        .single();

      const monthlyGross = (Number(emp.salario_bruto_anual) || 0) / 12;
      const dailyGross = monthlyGross / 22;

      setUserStats({
        ingresosHoy: dailyGross,
        tareasPendientes: tasks?.length || 0,
        objetivosCompletados: 0, // Placeholder
        proximaNomina: monthlyGross
      });
      setRecentTasks(tasks || []);
    }

    setLoading(false);
  };

  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    fetchUserData();
    setDateStr(new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#FAFAF8] min-h-screen">
      <header className="flex items-end justify-between border-b-[1.5px] border-[#2C2C2A]/10 pb-8">
        <div>
          <p className="text-[10px] font-bold text-[#704A38] uppercase tracking-[0.3em] mb-2 font-display">Resumen Ejecutivo</p>
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-display tracking-tighter text-[#2C2C2A] uppercase">Panel de Control</h1>
            <button
              onClick={fetchUserData}
              className="p-3 bg-white hover:bg-[#F1F1EF] rounded-sm transition-colors border-[1.5px] border-[#2C2C2A]/10 shadow-sm"
              title="Refrescar Datos"
            >
              <RefreshCw size={16} className={cn(loading && "animate-spin text-[#704A38]")} />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-[#2C2C2A]/40 uppercase tracking-widest">{dateStr}</p>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard
          title="Bruto Mensual"
          value={`€${userStats.proximaNomina.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          trend={0}
          icon={HandCoins}
        />
        <KPICard
          title="Tareas Críticas"
          value={userStats.tareasPendientes.toString()}
          trend={0}
          icon={CheckCircle2}
        />
        <KPICard
          title="Previsión Diaria"
          value={`€${userStats.ingresosHoy.toFixed(2)}`}
          trend={0}
          icon={TrendingUp}
        />
        <KPICard
          title="Salud de Proyecto"
          value={`${userStats.objetivosCompletados}%`}
          trend={0}
          icon={Target}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-10 border-[1.5px] border-[#2C2C2A]/10 shadow-[16px_16px_0px_0px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-display uppercase tracking-tight">Vigilancia de Tareas</h3>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-[#704A38] text-white px-3 py-1">Prioridad Alta</span>
            </div>
            <div className="divide-y-[1.5px] divide-[#2C2C2A]/5">
              {loading ? (
                <div className="p-12 text-center text-[10px] font-bold uppercase tracking-widest animate-pulse">Sincronizando...</div>
              ) : recentTasks.length === 0 ? (
                <div className="p-16 text-center text-[#2C2C2A]/20 italic flex flex-col items-center">
                  <CheckCircle2 size={32} className="mb-4 opacity-50" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No hay tareas pendientes en el radar</p>
                </div>
              ) : recentTasks.map((task, i) => (
                <div key={i} className="py-6 flex items-center justify-between group cursor-pointer hover:bg-[#FAFAF8] px-4 -mx-4 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-10 h-10 border-[1.5px] flex items-center justify-center",
                      task.prioridad === 'urgente' ? "border-error text-error bg-error/5" : "border-[#2C2C2A]/10 bg-white"
                    )}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#2C2C2A]">{task.titulo}</p>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2C2C2A]/40 mt-1">
                        {new Date(task.fecha_inicio).toLocaleDateString()} • {task.prioridad}
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[9px] font-bold uppercase tracking-widest text-[#704A38] border-b border-[#704A38]">Ver Detalle</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#2C2C2A] text-white p-10 border-[1.5px] border-[#2C2C2A] h-full flex flex-col shadow-[20px_20px_0px_0px_rgba(44,44,42,0.1)]">
            <div className="mb-10">
              <div className="w-12 h-12 bg-white/10 border border-white/20 flex items-center justify-center mb-8">
                <MessageSquare size={24} className="text-[#B8844D]" />
              </div>
              <h3 className="text-2xl font-display uppercase tracking-tight mb-4 leading-tight">Canal de Comunicación</h3>
              <p className="text-xs opacity-60 font-medium leading-relaxed">Acceso directo al asistente IA y mensajería corporativa de alta seguridad.</p>
            </div>

            <div className="mt-auto space-y-6">
              <button
                onClick={() => window.location.href = '/messages'}
                className="w-full bg-[#704A38] text-white py-5 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-black transition-all"
              >
                Abrir Inbox <RefreshCw size={14} />
              </button>
              <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20 text-center">Protocolo HR-S2-2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
