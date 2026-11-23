import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import type {
  CreateItemInput,
  Item,
  ItemStatus,
  UpdateItemInput,
} from '@/types/item';

const ITEMS_TABLE = 'items';
const ITEMS_COLUMNS = 'id, title, description, priority, status, created_at';

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase no está configurado. Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.',
    );
    this.name = 'SupabaseNotConfiguredError';
  }
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

  const { data, error } = await supabase
    .from(ITEMS_TABLE)
    .select(ITEMS_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar las tareas: ${error.message}`);
  }

  return (data ?? []) as Item[];
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

  const { data, error } = await supabase
    .from(ITEMS_TABLE)
    .insert(payload)
    .select(ITEMS_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo crear la tarea: ${error?.message ?? 'Respuesta vacía de Supabase'}`,
    );
  }

  return data as Item;
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

  const { data, error } = await supabase
    .from(ITEMS_TABLE)
    .update(payload)
    .eq('id', id)
    .select(ITEMS_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo actualizar la tarea: ${error?.message ?? 'Registro no encontrado'}`,
    );
  }

  return data as Item;
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

  const { error } = await supabase.from(ITEMS_TABLE).delete().eq('id', id);

  if (error) {
    throw new Error(`No se pudo eliminar la tarea: ${error.message}`);
  }
}
