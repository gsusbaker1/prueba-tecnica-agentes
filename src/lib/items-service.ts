import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import {
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  type CreateItemInput,
  type Item,
  type ItemPriority,
  type ItemStatus,
  type UpdateItemInput,
} from '@/types/item';

const ITEMS_TABLE = 'items';
const ITEMS_COLUMNS = 'id, title, description, priority, status, created_at';

interface RawItemRow {
  id: unknown;
  title: unknown;
  description: unknown;
  priority: unknown;
  status: unknown;
  created_at: unknown;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase no está configurado. Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.',
    );
    this.name = 'SupabaseNotConfiguredError';
  }
}

function isItemStatus(value: unknown): value is ItemStatus {
  return (
    typeof value === 'string' &&
    (ITEM_STATUSES as readonly string[]).includes(value)
  );
}

function isItemPriority(value: unknown): value is ItemPriority {
  return (
    typeof value === 'string' &&
    (ITEM_PRIORITIES as readonly string[]).includes(value)
  );
}

/**
 * Normaliza una fila proveniente de Supabase para garantizar invariantes de
 * dominio y evitar errores de renderizado ante datos legacy o nulos.
 */
export function normalizeItemRow(raw: RawItemRow): Item {
  return {
    id: typeof raw.id === 'string' ? raw.id : String(raw.id ?? ''),
    title: typeof raw.title === 'string' ? raw.title : 'Sin título',
    description:
      typeof raw.description === 'string' && raw.description.length > 0
        ? raw.description
        : null,
    priority: isItemPriority(raw.priority) ? raw.priority : 'media',
    status: isItemStatus(raw.status) ? raw.status : 'pendiente',
    created_at:
      typeof raw.created_at === 'string'
        ? raw.created_at
        : new Date().toISOString(),
  };
}

/**
 * Traduce errores técnicos de red o PostgREST/Supabase en mensajes claros y
 * amigables para el usuario final.
 */
export function formatSupabaseError(action: string, error: unknown): string {
  if (error instanceof SupabaseNotConfiguredError) {
    return error.message;
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : '';

  const rawCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';

  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('fetch failed') ||
    normalized.includes('load failed')
  ) {
    return `No se pudo ${action} por un problema de conexión con Supabase. Revisa tu conexión a internet e inténtalo de nuevo.`;
  }

  if (
    normalized.includes('row-level security') ||
    normalized.includes('permission denied') ||
    rawCode === '42501'
  ) {
    return `No se pudo ${action} por permisos de Supabase (RLS). Verifica las políticas públicas de la tabla items.`;
  }

  if (
    rawCode === 'PGRST116' ||
    normalized.includes('0 rows') ||
    normalized.includes('multiple (or no) rows')
  ) {
    return `No se pudo ${action} porque la tarea ya no existe o fue eliminada previamente.`;
  }

  if (
    normalized.includes('jwt') ||
    normalized.includes('invalid api key') ||
    normalized.includes('apikey')
  ) {
    return `No se pudo ${action}: las credenciales de Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY) no son válidas.`;
  }

  if (rawMessage.length > 0) {
    return `No se pudo ${action}: ${rawMessage}`;
  }

  return `No se pudo ${action}. Inténtalo de nuevo en unos segundos.`;
}

function resolveClient(client?: SupabaseClient | null): SupabaseClient {
  const activeClient = client !== undefined ? client : getSupabaseClient();
  if (!activeClient) {
    throw new SupabaseNotConfiguredError();
  }
  return activeClient;
}

export async function fetchItems(
  client?: SupabaseClient | null,
): Promise<Item[]> {
  const supabase = resolveClient(client);

  try {
    const { data, error } = await supabase
      .from(ITEMS_TABLE)
      .select(ITEMS_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(formatSupabaseError('cargar las tareas', error));
    }

    return ((data ?? []) as RawItemRow[]).map(normalizeItemRow);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No se pudo')) {
      throw error;
    }
    throw new Error(formatSupabaseError('cargar las tareas', error));
  }
}

export async function createItem(
  input: CreateItemInput,
  client?: SupabaseClient | null,
): Promise<Item> {
  const supabase = resolveClient(client);

  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() ? input.description.trim() : null,
    priority: input.priority,
    status: input.status,
  };

  try {
    const { data, error } = await supabase
      .from(ITEMS_TABLE)
      .insert(payload)
      .select(ITEMS_COLUMNS)
      .single();

    if (error || !data) {
      throw new Error(
        formatSupabaseError(
          'crear la tarea',
          error ?? new Error('Respuesta vacía de Supabase'),
        ),
      );
    }

    return normalizeItemRow(data as RawItemRow);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No se pudo')) {
      throw error;
    }
    throw new Error(formatSupabaseError('crear la tarea', error));
  }
}

export async function updateItem(
  id: string,
  updates: UpdateItemInput,
  client?: SupabaseClient | null,
): Promise<Item> {
  const supabase = resolveClient(client);

  const payload: UpdateItemInput = {};
  if (updates.title !== undefined) {
    payload.title = updates.title.trim();
  }
  if (updates.description !== undefined) {
    payload.description = updates.description?.trim()
      ? updates.description.trim()
      : null;
  }
  if (updates.priority !== undefined) {
    payload.priority = updates.priority;
  }
  if (updates.status !== undefined) {
    payload.status = updates.status;
  }

  try {
    const { data, error } = await supabase
      .from(ITEMS_TABLE)
      .update(payload)
      .eq('id', id)
      .select(ITEMS_COLUMNS)
      .single();

    if (error || !data) {
      throw new Error(
        formatSupabaseError(
          'actualizar la tarea',
          error ?? new Error('Registro no encontrado'),
        ),
      );
    }

    return normalizeItemRow(data as RawItemRow);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No se pudo')) {
      throw error;
    }
    throw new Error(formatSupabaseError('actualizar la tarea', error));
  }
}

export async function updateItemStatus(
  id: string,
  status: ItemStatus,
  client?: SupabaseClient | null,
): Promise<Item> {
  return updateItem(id, { status }, client);
}

export async function deleteItem(
  id: string,
  client?: SupabaseClient | null,
): Promise<void> {
  const supabase = resolveClient(client);

  try {
    const { error } = await supabase.from(ITEMS_TABLE).delete().eq('id', id);

    if (error) {
      throw new Error(formatSupabaseError('eliminar la tarea', error));
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No se pudo')) {
      throw error;
    }
    throw new Error(formatSupabaseError('eliminar la tarea', error));
  }
}
