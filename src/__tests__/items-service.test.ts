import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  SupabaseNotConfiguredError,
  createItem,
  deleteItem,
  fetchItems,
  formatSupabaseError,
  normalizeItemRow,
  updateItemStatus,
} from '@/lib/items-service';
import type { Item } from '@/types/item';

const MOCK_ITEM: Item = {
  id: 'uuid-123',
  title: 'Revisar políticas RLS',
  description: 'Confirmar acceso público en la tabla items',
  priority: 'alta',
  status: 'pendiente',
  created_at: '2026-06-10T09:00:00.000Z',
};

describe('items-service', () => {
  it('lanza SupabaseNotConfiguredError cuando el cliente es null', async () => {
    await expect(fetchItems(null)).rejects.toBeInstanceOf(
      SupabaseNotConfiguredError,
    );
  });

  it('fetchItems obtiene y devuelve las tareas ordenadas', async () => {
    const order = vi.fn().mockResolvedValue({ data: [MOCK_ITEM], error: null });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    const mockClient = { from } as unknown as SupabaseClient;

    const items = await fetchItems(mockClient);

    expect(from).toHaveBeenCalledWith('items');
    expect(select).toHaveBeenCalledWith(
      'id, title, description, priority, status, created_at',
    );
    expect(items).toEqual([MOCK_ITEM]);
  });

  it('createItem limpia espacios y crea una nueva tarea en Supabase con columnas en inglés', async () => {
    const single = vi.fn().mockResolvedValue({ data: MOCK_ITEM, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const mockClient = { from } as unknown as SupabaseClient;

    const created = await createItem(
      {
        title: '  Revisar políticas RLS  ',
        description: '  Confirmar acceso público en la tabla items  ',
        priority: 'alta',
        status: 'pendiente',
      },
      mockClient,
    );

    expect(insert).toHaveBeenCalledWith({
      title: 'Revisar políticas RLS',
      description: 'Confirmar acceso público en la tabla items',
      priority: 'alta',
      status: 'pendiente',
    });
    expect(created).toEqual(MOCK_ITEM);
  });

  it('updateItemStatus actualiza la columna status del registro', async () => {
    const updatedItem: Item = { ...MOCK_ITEM, status: 'completado' };
    const single = vi
      .fn()
      .mockResolvedValue({ data: updatedItem, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const mockClient = { from } as unknown as SupabaseClient;

    const result = await updateItemStatus('uuid-123', 'completado', mockClient);

    expect(update).toHaveBeenCalledWith({ status: 'completado' });
    expect(eq).toHaveBeenCalledWith('id', 'uuid-123');
    expect(result.status).toBe('completado');
  });

  it('deleteItem elimina la tarea por id y propaga errores si Supabase falla', async () => {
    const eqOk = vi.fn().mockResolvedValue({ error: null });
    const delOk = vi.fn().mockReturnValue({ eq: eqOk });
    const clientOk = {
      from: vi.fn().mockReturnValue({ delete: delOk }),
    } as unknown as SupabaseClient;

    await expect(deleteItem('uuid-123', clientOk)).resolves.toBeUndefined();
    expect(eqOk).toHaveBeenCalledWith('id', 'uuid-123');

    const eqFail = vi
      .fn()
      .mockResolvedValue({ error: { message: 'RLS denied' } });
    const delFail = vi.fn().mockReturnValue({ eq: eqFail });
    const clientFail = {
      from: vi.fn().mockReturnValue({ delete: delFail }),
    } as unknown as SupabaseClient;

    await expect(deleteItem('uuid-123', clientFail)).rejects.toThrow(
      'RLS denied',
    );
  });

  it('traduce fallos de red y errores RLS a mensajes amigables en español', async () => {
    const orderFail = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const select = vi.fn().mockReturnValue({ order: orderFail });
    const mockClient = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as SupabaseClient;

    await expect(fetchItems(mockClient)).rejects.toThrow(
      /problema de conexión con Supabase/i,
    );

    expect(
      formatSupabaseError('crear la tarea', {
        message: 'new row violates row-level security policy',
        code: '42501',
      }),
    ).toMatch(/permisos de Supabase \(RLS\)/i);
  });

  it('normaliza filas con valores inesperados o nulos sin romper el tipado', () => {
    const normalized = normalizeItemRow({
      id: 'legacy-1',
      title: 'Tarea legacy',
      description: '',
      priority: 'DESCONOCIDA',
      status: null,
      created_at: '2026-06-10T09:00:00.000Z',
    });

    expect(normalized).toEqual({
      id: 'legacy-1',
      title: 'Tarea legacy',
      description: null,
      priority: 'media',
      status: 'pendiente',
      created_at: '2026-06-10T09:00:00.000Z',
    });
  });
});
