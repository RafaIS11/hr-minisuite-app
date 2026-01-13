import { supabase } from './supabase';

export interface Evento {
    id: string;
    titulo: string;
    descripcion?: string;
    ubicacion?: string;
    fecha_inicio: string;
    fecha_fin: string;
    todo_el_dia: boolean;
    tipo_evento: 'evento' | 'tarea' | 'recordatorio' | 'jornada' | 'cumpleaños' | 'festivo' | 'descanso';
    categoria: 'EVENTO' | 'HORARIOS' | 'PERSONAL';
    empleado_id?: string;
    prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
    estado: 'pendiente' | 'completado' | 'cancelado';
    color_hex: string;
    videoconferencia?: string;
    recordatorio_minutos?: number;
    creado_por?: string;
    fecha_creacion: string;
}

export const getColorPorTipo = (tipo: string): string => {
    switch (tipo) {
        case 'evento': return '#704A38';      // Brown (EVENTO)
        case 'jornada': return '#B8844D';     // Mustard (HORARIOS)
        case 'festivo': return '#A13D3D';     // Red
        case 'cumpleaños': return '#4A705B';  // Green (PERSONAL)
        case 'tarea': return '#2C2C2A';       // Dark
        case 'recordatorio': return '#E67E22';// Orange
        case 'descanso': return '#95A5A6';    // Gray
        default: return '#704A38';
    }
};

export const getCategoriaPorTipo = (tipo: string): 'EVENTO' | 'HORARIOS' | 'PERSONAL' => {
    switch (tipo) {
        case 'jornada':
        case 'descanso':
            return 'HORARIOS';
        case 'cumpleaños':
            return 'PERSONAL';
        default:
            return 'EVENTO';
    }
};

export async function crearEvento(data: Partial<Evento>): Promise<Evento | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: emp } = await supabase.from("empleados").select("id").eq("email", user.email).maybeSingle();

    const payload = {
        ...data,
        empleado_id: data.empleado_id || emp?.id,
        color_hex: data.color_hex || getColorPorTipo(data.tipo_evento || 'evento'),
        categoria: data.categoria || getCategoriaPorTipo(data.tipo_evento || 'evento')
    };

    const { data: evento, error } = await supabase
        .from('calendario_eventos')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error al crear evento:', error);
        return null;
    }
    return evento;
}

export async function obtenerEventos(mes: number, anio: number, empleado_id?: string): Promise<Evento[]> {
    // Note: This fetches everything for now, can be optimized
    let query = supabase
        .from('calendario_eventos')
        .select('*');

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
