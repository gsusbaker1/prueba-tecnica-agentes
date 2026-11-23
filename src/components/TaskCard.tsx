'use client';

import { useState, type FormEvent } from 'react';
import {
  ArrowRightCircle,
  Check,
  Clock,
  Loader2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  type Item,
  type ItemPriority,
  type ItemStatus,
  type UpdateItemInput,
} from '@/types/item';
import {
  PRIORITY_METADATA,
  STATUS_METADATA,
  formatRelativeDate,
  getNextStatus,
  validateItemInput,
} from '@/lib/item-utils';

interface TaskCardProps {
  item: Item;
  onStatusChange: (id: string, nextStatus: ItemStatus) => Promise<void>;
  onUpdate: (id: string, updates: UpdateItemInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskCard({
  item,
  onStatusChange,
  onUpdate,
  onDelete,
}: TaskCardProps) {
  const [busyAction, setBusyAction] = useState<'status' | 'delete' | 'edit' | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description ?? '');
  const [editPriority, setEditPriority] = useState<ItemPriority>(item.priority);
  const [editStatus, setEditStatus] = useState<ItemStatus>(item.status);
  const [editError, setEditError] = useState<string | null>(null);

  const statusMeta = STATUS_METADATA[item.status];
  const priorityMeta = PRIORITY_METADATA[item.priority];
  const nextStatus = getNextStatus(item.status);

  async function handleQuickStatusChange(targetStatus: ItemStatus) {
    if (targetStatus === item.status || busyAction) return;
    setBusyAction('status');
    try {
      await onStatusChange(item.id, targetStatus);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    if (busyAction) return;
    setBusyAction('delete');
    try {
      await onDelete(item.id);
    } finally {
      setBusyAction(null);
    }
  }

  function startEditing() {
    setEditTitle(item.title);
    setEditDescription(item.description ?? '');
    setEditPriority(item.priority);
    setEditStatus(item.status);
    setEditError(null);
    setIsEditing(true);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateItemInput({
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      status: editStatus,
    });

    if (!validation.valid) {
      setEditError(
        validation.errors.title ??
          validation.errors.description ??
          'Revisa los datos introducidos.',
      );
      return;
    }

    setBusyAction('edit');
    setEditError(null);
    try {
      await onUpdate(item.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        status: editStatus,
      });
      setIsEditing(false);
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setBusyAction(null);
    }
  }

  if (isEditing) {
    return (
      <article className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm ring-2 ring-indigo-500/10">
        <form onSubmit={handleSaveEdit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Editando tarea
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cancelar edición"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            aria-label="Editar título"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <textarea
            rows={2}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            aria-label="Editar descripción"
            placeholder="Añade una descripción..."
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as ItemPriority)}
              aria-label="Editar prioridad"
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              {ITEM_PRIORITIES.map((priorityOption) => (
                <option key={priorityOption} value={priorityOption}>
                  Prioridad: {PRIORITY_METADATA[priorityOption].label}
                </option>
              ))}
            </select>

            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as ItemStatus)}
              aria-label="Editar estado"
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              {ITEM_STATUSES.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  Estado: {STATUS_METADATA[statusOption].label}
                </option>
              ))}
            </select>
          </div>

          {editError && (
            <p role="alert" className="text-xs font-medium text-rose-600">
              {editError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busyAction === 'edit'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {busyAction === 'edit' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Guardar
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.badgeClasses}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClasses}`}
                aria-hidden="true"
              />
              {statusMeta.label}
            </span>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityMeta.badgeClasses}`}
            >
              Prioridad {priorityMeta.label}
            </span>

            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatRelativeDate(item.created_at)}
            </span>
          </div>

          <h3
            className={`text-base font-semibold tracking-tight ${
              item.status === 'completado'
                ? 'text-slate-400 line-through'
                : 'text-slate-900'
            }`}
          >
            {item.title}
          </h3>

          {item.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-start">
          <button
            type="button"
            onClick={startEditing}
            disabled={busyAction !== null}
            aria-label={`Editar tarea ${item.title}`}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
            title="Editar tarea"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={busyAction !== null}
            aria-label={`Eliminar tarea ${item.title}`}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            title="Eliminar tarea"
          >
            {busyAction === 'delete' ? (
              <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
        <div
          className="flex flex-wrap items-center gap-1.5"
          aria-label="Selector rápido de estado"
        >
          {ITEM_STATUSES.map((statusOption) => {
            const isCurrent = item.status === statusOption;
            return (
              <button
                key={statusOption}
                type="button"
                disabled={isCurrent || busyAction !== null}
                onClick={() => handleQuickStatusChange(statusOption)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  isCurrent
                    ? 'cursor-default bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50'
                }`}
              >
                {STATUS_METADATA[statusOption].shortLabel}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleQuickStatusChange(nextStatus)}
          disabled={busyAction !== null}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
        >
          {busyAction === 'status' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowRightCircle className="h-3.5 w-3.5" />
          )}
          {statusMeta.nextActionLabel}
        </button>
      </div>
    </article>
  );
}
