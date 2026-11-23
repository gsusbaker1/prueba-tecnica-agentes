'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Database,
  RefreshCw,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  createItem,
  deleteItem,
  fetchItems,
  updateItem,
  updateItemStatus,
} from '@/lib/items-service';
import {
  computeItemCounts,
  filterItems,
  sortItemsByNewest,
} from '@/lib/item-utils';
import type {
  CreateItemInput,
  Item,
  ItemStatus,
  PriorityFilter,
  StatusFilter,
  UpdateItemInput,
} from '@/types/item';
import { TaskForm } from '@/components/TaskForm';
import { StatusFilterBar } from '@/components/StatusFilterBar';
import { TaskCard } from '@/components/TaskCard';

export function TaskBoard() {
  const configured = isSupabaseConfigured();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(configured);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const showFeedback = useCallback((message: string) => {
    setFeedbackMessage(message);
    window.setTimeout(() => {
      setFeedbackMessage((current) => (current === message ? null : current));
    }, 3000);
  }, []);

  const loadItems = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchItems();
      setItems(sortItemsByNewest(data));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con la tabla items de Supabase.',
      );
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const counts = useMemo(() => computeItemCounts(items), [items]);

  const visibleItems = useMemo(
    () => filterItems(items, statusFilter, priorityFilter, searchQuery),
    [items, statusFilter, priorityFilter, searchQuery],
  );

  async function handleCreate(input: CreateItemInput) {
    setErrorMessage(null);
    const created = await createItem(input);
    setItems((prev) => sortItemsByNewest([created, ...prev]));
    showFeedback('Tarea creada correctamente en Supabase.');
  }

  async function handleStatusChange(id: string, nextStatus: ItemStatus) {
    setErrorMessage(null);
    try {
      const updated = await updateItemStatus(id, nextStatus);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
      showFeedback('Estado actualizado.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado.',
      );
    }
  }

  async function handleUpdate(id: string, updates: UpdateItemInput) {
    setErrorMessage(null);
    const updated = await updateItem(id, updates);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
    showFeedback('Cambios guardados.');
  }

  async function handleDelete(id: string) {
    setErrorMessage(null);
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      showFeedback('Tarea eliminada.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la tarea.',
      );
    }
  }

  return (
    <div className="space-y-6">
      {!configured && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-amber-950 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <Database
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold">
                Conecta tu proyecto de Supabase para activar la persistencia
              </p>
              <p className="text-amber-900/90">
                Crea el archivo{' '}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
                  .env.local
                </code>{' '}
                a partir de{' '}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
                  .env.example
                </code>{' '}
                con{' '}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{' '}
                y{' '}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{' '}
                y reinicia el servidor de desarrollo.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadItems()}
            className="shrink-0 rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-200"
          >
            Reintentar
          </button>
        </div>
      )}

      {feedbackMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <aside className="lg:sticky lg:top-6 lg:col-span-4">
          <TaskForm onCreate={handleCreate} disabled={!configured} />
        </aside>

        <section
          aria-label="Listado de tareas"
          className="space-y-4 lg:col-span-8"
        >
          <StatusFilterBar
            counts={counts}
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium text-slate-500">
              Mostrando <strong className="text-slate-800">{visibleItems.length}</strong>{' '}
              de <strong className="text-slate-800">{counts.todos}</strong>{' '}
              {counts.todos === 1 ? 'tarea' : 'tareas'}
            </p>
            <button
              type="button"
              onClick={() => void loadItems()}
              disabled={!configured || loading}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Cargando tareas">
              {[1, 2, 3].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-36 animate-pulse rounded-2xl border border-slate-200/70 bg-white p-5"
                >
                  <div className="mb-3 flex gap-2">
                    <div className="h-5 w-20 rounded-full bg-slate-200" />
                    <div className="h-5 w-24 rounded-full bg-slate-200" />
                  </div>
                  <div className="mb-2 h-5 w-2/3 rounded bg-slate-200" />
                  <div className="h-4 w-5/6 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                {counts.todos === 0
                  ? 'Aún no hay tareas registradas'
                  : 'No hay resultados con los filtros aplicados'}
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                {counts.todos === 0
                  ? 'Crea tu primera tarea o incidencia desde el formulario para empezar a organizar tu tablero.'
                  : 'Prueba a cambiar el estado seleccionado, la prioridad o limpiar el campo de búsqueda.'}
              </p>
              {counts.todos > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('todos');
                    setPriorityFilter('todas');
                    setSearchQuery('');
                  }}
                  className="mt-4 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <TaskCard
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
