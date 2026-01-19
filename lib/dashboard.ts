import { supabase } from './supabase';

export interface DashboardStats {
    proximaNomina: number;
    tareasPendientes: number;
    mensajesNuevos: number;
    ingresosHoy: number;
}

export interface UpcomingEvent {
    id: string;
    titulo: string;
    fecha_inicio: string;
    tipo: string;
}

export async function fetchDashboardStats(email: string): Promise<DashboardStats> {
    try {
        // 1. Obtener ID del empleado
        const { data: emp, error: empErr } = await supabase
            .from("empleados")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (empErr || !emp) throw empErr || new Error("Empleado no encontrado");

        // 2. Obtener salario del último contrato
        const { data: contrato } = await supabase
            .from("contratos")
            .select("salario_base_mensual")
            .eq("empleado_id", emp.id)
            .order('fecha_inicio', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 3. Contar tareas pendientes
        const { count: countTareas } = await supabase
            .from("tareas")
            .select("*", { count: 'exact', head: true })
            .eq("assigned_to", emp.id)
            .eq("status", "pendiente");

        // 4. Contar mensajes nuevos (recibidos por el usuario)
        const { count: countMensajes } = await supabase
            .from("mensajes")
            .select("*", { count: 'exact', head: true })
            .eq("receiver_id", emp.id);

        return {
            proximaNomina: contrato?.salario_base_mensual || 0,
            tareasPendientes: countTareas || 0,
            mensajesNuevos: countMensajes || 0,
            ingresosHoy: (contrato?.salario_base_mensual || 0) / 30 // Simulación diaria basada en mensual
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            proximaNomina: 0,
            tareasPendientes: 0,
            mensajesNuevos: 0,
            ingresosHoy: 0
        };
    }
}

export async function fetchUpcomingEvents(email: string): Promise<UpcomingEvent[]> {
    try {
        const { data: emp } = await supabase
            .from("empleados")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (!emp) return [];

        const { data: eventos } = await supabase
            .from("calendario_eventos")
            .select("id, titulo, fecha_inicio, categoria")
            .eq("empleado_id", emp.id)
            .gte('fecha_inicio', new Date().toISOString())
            .order('fecha_inicio', { ascending: true })
            .limit(2);

        return eventos?.map(e => ({
            id: e.id,
            titulo: e.titulo,
            fecha_inicio: e.fecha_inicio,
            tipo: e.categoria || "Evento"
        })) || [];
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return [];
    }
}
