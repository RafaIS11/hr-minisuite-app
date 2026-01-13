import { supabase } from './supabase';

export interface Evento {
    id: string;
    titulo: string;
    descripcion?: string;
    ubicacion?: string;
    fecha_inicio: string;
    fecha_fin: string;
    todo_el_dia: boolean;
    tipo_evento: 'evento' | 'tarea' | 'recordatorio' | 'turno' | 'festivo';
    empleado_id?: string;
    prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
    estado: 'pendiente' | 'completado' | 'cancelado';
    color_hex: string;
    creado_por?: string;
    fecha_creacion: string;
}

export const getColorPorTipo = (tipo: string): string => {
    switch (tipo) {
        case 'evento': return '#704A38';
        case 'tarea': return '#2C2C2A';
        case 'recordatorio': return '#B8844D';
        case 'festivo': return '#A13D3D';
        case 'turno': return '#704A38';
        default: return '#704A38';
    }
};

export async function crearEvento(data: Partial<Evento>): Promise<Evento | null> {
    const { data: evento, error } = await supabase
        .from('calendario_eventos')
        .insert([{
            ...data,
            color_hex: data.color_hex || getColorPorTipo(data.tipo_evento || 'evento')
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al crear evento:', error);
        return null;
    }
    return evento;
}

export async function obtenerEventos(mes: number, anio: number, empleado_id?: string): Promise<Evento[]> {
    // Calcular inicio y fin de mes
    const inicioMes = new Date(anio, mes - 1, 1).toISOString();
    const finMes = new Date(anio, mes, 0, 23, 59, 59).toISOString();

    let query = supabase
        .from('calendario_eventos')
        .select('*')
        .gte('fecha_inicio', inicioMes)
        .lte('fecha_inicio', finMes);

    if (empleado_id) {
        query = query.eq('empleado_id', empleado_id);
    }

    const { data: eventos, error } = await query.order('fecha_inicio', { ascending: true });

    if (error) {
        console.error('Error al obtener eventos:', error);
        return [];
    }
    return eventos || [];
}

export async function actualizarEvento(id: string, cambios: Partial<Evento>): Promise<Evento | null> {
    const { data: evento, error } = await supabase
        .from('calendario_eventos')
        .update(cambios)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error al actualizar evento:', error);
        return null;
    }
    return evento;
}

export async function eliminarEvento(id: string): Promise<void> {
    const { error } = await supabase
        .from('calendario_eventos')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar evento:', error);
    }
}

export async function obtenerEventosPorTipo(tipo: string, empleado_id?: string): Promise<Evento[]> {
    let query = supabase
        .from('calendario_eventos')
        .select('*')
        .eq('tipo_evento', tipo);

    if (empleado_id) {
        query = query.eq('empleado_id', empleado_id);
    }

    const { data: eventos, error } = await query;

    if (error) {
        console.error('Error al obtener eventos por tipo:', error);
        return [];
    }
    return eventos || [];
}
