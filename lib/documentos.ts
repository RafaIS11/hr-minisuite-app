import { supabase } from './supabase';

export interface Documento {
    id: string;
    empleado_id?: string;
    nombre_archivo: string;
    url_storage: string;
    formato: 'pdf' | 'xlsx' | 'docx';
    categoria: 'nomina' | 'contrato' | 'cliente' | 'proveedor' | 'certificado';
    cliente_asociado?: string;
    fecha_subida: string;
}

export async function subirDocumento(
    file: File,
    metadata: {
        categoria: 'nomina' | 'contrato' | 'cliente' | 'proveedor' | 'certificado';
        empleado_id?: string;
        cliente_asociado?: string;
    }
): Promise<Documento | null> {
    // 1. Validar: formato y tamaño
    const allowedExtensions = ['pdf', 'xlsx', 'docx'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
        throw new Error('Formato no soportado. Usa PDF, XLSX o DOCX.');
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo supera los 10MB.');
    }

    // 2. Generar path
    const timestamp = Date.now();
    const userId = metadata.empleado_id || 'anonymous';
    const filePath = `${userId}/${metadata.categoria}/${timestamp}_${file.name}`;

    // 3. Subir a Storage
    const { data: storageData, error: storageError } = await supabase.storage
        .from('hr-documents')
        .upload(filePath, file);

    if (storageError) {
        console.error('Error Storage:', storageError);
        throw storageError;
    }

    // 4. Obtener URL
    const { data: { publicUrl } } = supabase.storage
        .from('hr-documents')
        .getPublicUrl(filePath);

    // 5. Insertar metadata
    const { data: doc, error: dbError } = await supabase
        .from('documentos')
        .insert([{
            empleado_id: metadata.empleado_id,
            nombre_archivo: file.name,
            url_storage: publicUrl,
            formato: extension as any,
            categoria: metadata.categoria,
            cliente_asociado: metadata.cliente_asociado
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
    categoria?: string;
    cliente?: string;
    search?: string;
    empleado_id?: string;
}): Promise<Documento[]> {
    let query = supabase.from('documentos').select('*').order('fecha_subida', { ascending: false });

    if (filtros?.empleado_id) {
        query = query.eq('empleado_id', filtros.empleado_id);
    }

    if (filtros?.categoria && filtros.categoria !== 'todos') {
        query = query.eq('categoria', filtros.categoria);
    }

    if (filtros?.cliente) {
        query = query.ilike('cliente_asociado', `%${filtros.cliente}%`);
    }

    if (filtros?.search) {
        query = query.ilike('nombre_archivo', `%${filtros.search}%`);
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

export async function obtenerEstadisticas(empleado_id?: string) {
    let query = supabase.from('documentos').select('formato');
    if (empleado_id) {
        query = query.eq('empleado_id', empleado_id);
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
