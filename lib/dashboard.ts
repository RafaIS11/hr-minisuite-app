import { supabase } from './supabase';

export interface DashboardStats {
    proximaNomina: number;
    tareasPendientes: number;
    mensajesNuevos: number;
    totalDocumentos: number;
}

export interface UpcomingEvent {
    id: string;
    titulo: string;
    fecha_inicio: string;
    tipo: string;
}

export interface RecentDocument {
    id: string;
    nombre_archivo: string;
    tipo: string;
    fecha_subida: string;
    formato: string;
}

export interface LatestPayroll {
    id: string;
    mes: string;
    anio: number;
    neto_pagar: number;
    fecha_emision: string;
}

export async function fetchDashboardStats(email: string): Promise<DashboardStats> {
    try {
        const { data: emp, error: empErr } = await supabase
            .from("empleados")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (empErr || !emp) throw empErr || new Error("Empleado no encontrado");

        const { data: contrato } = await supabase
            .from("contratos")
            .select("salario_base_mensual")
            .eq("empleado_id", emp.id)
            .order('fecha_inicio', { ascending: false })
            .limit(1)
            .maybeSingle();

        const { count: countTareas } = await supabase
            .from("tareas")
            .select("*", { count: 'exact', head: true })
            .eq("assigned_to", emp.id)
            .eq("status", "pendiente");

        const { count: countMensajes } = await supabase
            .from("mensajes")
            .select("*", { count: 'exact', head: true })
            .eq("receiver_id", emp.id);

        const { count: countDocs } = await supabase
            .from("documentos")
            .select("*", { count: 'exact', head: true })
            .eq("persona_id", emp.id);

        return {
            proximaNomina: contrato?.salario_base_mensual || 0,
            tareasPendientes: countTareas || 0,
            mensajesNuevos: countMensajes || 0,
            totalDocumentos: countDocs || 0
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            proximaNomina: 0,
            tareasPendientes: 0,
            mensajesNuevos: 0,
            totalDocumentos: 0
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

export async function fetchRecentDocuments(email: string): Promise<RecentDocument[]> {
    try {
        const { data: emp } = await supabase
            .from("empleados")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (!emp) return [];

        const { data: docs } = await supabase
            .from("documentos")
            .select("id, nombre_archivo, tipo, fecha_subida, formato")
            .eq("persona_id", emp.id)
            .order('fecha_subida', { ascending: false })
            .limit(3);

        return docs || [];
    } catch (error) {
        console.error("Error fetching recent documents:", error);
        return [];
    }
}

export async function fetchLatestPayroll(email: string): Promise<LatestPayroll | null> {
    try {
        const { data: emp } = await supabase
            .from("empleados")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (!emp) return null;

        const { data: payroll } = await supabase
            .from("nominas")
            .select("id, mes, anio, neto_pagar, fecha_emision")
            .eq("empleado_id", emp.id)
            .order('fecha_emision', { ascending: false })
            .limit(1)
            .maybeSingle();

        return payroll;
    } catch (error) {
        console.error("Error fetching latest payroll:", error);
        return null;
    }
}
