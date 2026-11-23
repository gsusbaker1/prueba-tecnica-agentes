import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { TaskBoard } from '@/components/TaskBoard';
import type { Item } from '@/types/item';

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn<() => boolean>(),
  fetchItems: vi.fn<() => Promise<Item[]>>(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  updateItemStatus: vi.fn(),
  deleteItem: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
}));

vi.mock('@/lib/items-service', () => ({
  fetchItems: mocks.fetchItems,
  createItem: mocks.createItem,
  updateItem: mocks.updateItem,
  updateItemStatus: mocks.updateItemStatus,
  deleteItem: mocks.deleteItem,
}));

const INITIAL_ITEMS: Item[] = [
  {
    id: 'task-1',
    title: 'Configurar CI/CD en Vercel',
    description: 'Verificar variables públicas',
    priority: 'alta',
    status: 'pendiente',
    created_at: '2026-06-10T09:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Revisar diseño responsive',
    description: 'Probar en móvil y escritorio',
    priority: 'media',
    status: 'completado',
    created_at: '2026-06-09T09:00:00.000Z',
  },
];

describe('TaskBoard integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.fetchItems.mockResolvedValue(INITIAL_ITEMS);
  });

  it('sincroniza contadores y listado al crear, cambiar estado y eliminar sin recargar', async () => {
    const newTask: Item = {
      id: 'task-3',
      title: 'Blindar manejo de errores',
      description: 'Mensajes claros ante fallos de red',
      priority: 'alta',
      status: 'pendiente',
      created_at: '2026-06-11T10:00:00.000Z',
    };

    mocks.createItem.mockResolvedValue(newTask);
    mocks.updateItemStatus.mockResolvedValue({
      ...newTask,
      status: 'en_proceso',
    });
    mocks.deleteItem.mockResolvedValue(undefined);

    render(<TaskBoard />);

    // 1. Carga inicial y contadores sincronizados
    expect(
      await screen.findByText('Configurar CI/CD en Vercel'),
    ).toBeInTheDocument();

    const tablist = screen.getByRole('tablist', {
      name: /filtrar tareas por estado/i,
    });
    expect(within(tablist).getByRole('tab', { name: /todas/i })).toHaveTextContent('2');
    expect(within(tablist).getByRole('tab', { name: /pendiente/i })).toHaveTextContent('1');
    expect(within(tablist).getByRole('tab', { name: /completado/i })).toHaveTextContent('1');

    // Cambiar al tab Completado y crear una tarea Pendiente -> debe volver visible la nueva tarea
    fireEvent.click(within(tablist).getByRole('tab', { name: /completado/i }));
    fireEvent.change(screen.getByLabelText(/título/i), {
      target: { value: 'Blindar manejo de errores' },
    });
    fireEvent.click(screen.getByRole('button', { name: /añadir tarea/i }));

    expect(
      await screen.findByText('Blindar manejo de errores'),
    ).toBeInTheDocument();
    expect(within(tablist).getByRole('tab', { name: /todas/i })).toHaveTextContent('3');
    expect(within(tablist).getByRole('tab', { name: /pendiente/i })).toHaveTextContent('2');

    // 2. Cambio de estado con un clic -> actualiza contadores al instante
    const cards = screen.getAllByRole('article');
    const newestCard = cards[0]!;
    fireEvent.click(
      within(newestCard).getByRole('button', { name: /pasar a en proceso/i }),
    );

    await waitFor(() => {
      expect(within(tablist).getByRole('tab', { name: /en proceso/i })).toHaveTextContent('1');
      expect(within(tablist).getByRole('tab', { name: /pendiente/i })).toHaveTextContent('1');
    });

    // 3. Eliminación -> desaparece del DOM y decrementa el total
    fireEvent.click(
      screen.getByRole('button', {
        name: /eliminar tarea blindar manejo de errores/i,
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Blindar manejo de errores'),
      ).not.toBeInTheDocument();
      expect(within(tablist).getByRole('tab', { name: /todas/i })).toHaveTextContent('2');
    });
  });

  it('muestra un mensaje de error amigable y cerrable cuando falla la carga de Supabase', async () => {
    mocks.fetchItems.mockRejectedValue(
      new Error(
        'No se pudo cargar las tareas por un problema de conexión con Supabase.',
      ),
    );

    render(<TaskBoard />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/problema de conexión con Supabase/i);

    fireEvent.click(
      screen.getByRole('button', { name: /cerrar mensaje de error/i }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
