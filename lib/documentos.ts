import { supabase } from './supabase';

export interface Documento {
    id: string;
    persona_id?: string;
    nombre_archivo: string;
    url_storage: string;
    formato: 'pdf' | 'xlsx' | 'docx';
    tipo: 'Nómina' | 'Contrato Laboral' | 'Modelo 145' | 'Certificado de Empresa' | 'Justificante Médico' | 'Gasto/Ticket';
    descripcion?: string;
    fecha_subida: string;
    estado?: 'Final' | 'Borrador' | 'Archivado';
}

export async function subirDocumento(
    file: File,
    metadata: {
        tipo: 'Nómina' | 'Contrato Laboral' | 'Modelo 145' | 'Certificado de Empresa' | 'Justificante Médico' | 'Gasto/Ticket';
        persona_id?: string;
        descripcion?: string;
    }
): Promise<Documento | null> {
    const allowedExtensions = ['pdf', 'xlsx', 'docx'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
        throw new Error('Formato no soportado. Usa PDF, XLSX o DOCX.');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo supera los 10MB.');
    }

    const timestamp = Date.now();
    const personaId = metadata.persona_id || 'anonymous';
    const filePath = `${personaId}/${metadata.tipo}/${timestamp}_${file.name}`;

    const { data: storageData, error: storageError } = await supabase.storage
        .from('hr-documents')
        .upload(filePath, file);

    if (storageError) {
        console.error('Error Storage:', storageError);
        throw storageError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('hr-documents')
        .getPublicUrl(filePath);

    const { data: doc, error: dbError } = await supabase
        .from('documentos')
        .insert([{
            persona_id: metadata.persona_id,
            nombre_archivo: file.name,
            url_storage: publicUrl,
            formato: extension as any,
            tipo: metadata.tipo,
            descripcion: metadata.descripcion,
            estado: 'Borrador'
        }])
        .select()
        .single();

    if (dbError) {
        console.error('Error DB:', dbError);
        throw dbError;
    }

    return doc;
}

export async function obtenerDocumentos(filtros?: {
    tipo?: string;
    search?: string;
    persona_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: string;
}): Promise<Documento[]> {
    let query = supabase.from('documentos').select('*').order('fecha_subida', { ascending: false });

    if (filtros?.persona_id) {
        query = query.eq('persona_id', filtros.persona_id);
    }

    if (filtros?.tipo && filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo);
    }

    if (filtros?.estado && filtros.estado !== 'todos') {
        query = query.eq('estado', filtros.estado);
    }

    if (filtros?.search) {
        query = query.ilike('nombre_archivo', `%${filtros.search}%`);
    }

    if (filtros?.fecha_desde) {
        query = query.gte('fecha_subida', filtros.fecha_desde);
    }

    if (filtros?.fecha_hasta) {
        query = query.lte('fecha_subida', filtros.fecha_hasta);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error obteniendo documentos:', error);
        return [];
    }
    return data || [];
}

export async function eliminarDocumento(id: string): Promise<void> {
    const { data: doc } = await supabase
        .from('documentos')
        .select('url_storage')
        .eq('id', id)
        .single();

    if (doc) {
        const path = doc.url_storage.split('/public/hr-documents/')[1];
        if (path) {
            await supabase.storage.from('hr-documents').remove([path]);
        }
    }

    await supabase.from('documentos').delete().eq('id', id);
}

export function descargarDocumento(url: string) {
    window.open(url, '_blank');
}

export async function actualizarDocumento(id: string, updates: Partial<Documento>): Promise<void> {
    const { error } = await supabase
        .from('documentos')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('Error actualizando documento:', error);
        throw error;
    }
}

export async function actualizarDescripcion(id: string, descripcion: string): Promise<void> {
    return actualizarDocumento(id, { descripcion });
}

export async function obtenerEstadisticas(persona_id?: string) {
    let query = supabase.from('documentos').select('formato');
    if (persona_id) {
        query = query.eq('persona_id', persona_id);
    }

    const { data } = await query;
    const stats = {
        total: data?.length || 0,
        pdfs: data?.filter(d => d.formato === 'pdf').length || 0,
        excels: data?.filter(d => d.formato === 'xlsx').length || 0,
        words: data?.filter(d => d.formato === 'docx').length || 0
    };
    return stats;
}
