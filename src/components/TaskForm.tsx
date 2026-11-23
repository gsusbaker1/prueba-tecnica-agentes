'use client';

import { useState, type FormEvent } from 'react';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import {
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  type CreateItemInput,
  type ItemPriority,
  type ItemStatus,
} from '@/types/item';
import {
  PRIORITY_METADATA,
  STATUS_METADATA,
  validateItemInput,
} from '@/lib/item-utils';

interface TaskFormProps {
  onCreate: (input: CreateItemInput) => Promise<void>;
  disabled?: boolean;
}

export function TaskForm({ onCreate, disabled = false }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ItemPriority>('media');
  const [status, setStatus] = useState<ItemStatus>('pendiente');
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateItemInput, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const payload: CreateItemInput = {
      title,
      description,
      priority,
      status,
    };

    const validation = validateItemInput(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await onCreate(payload);
      setTitle('');
      setDescription('');
      setPriority('media');
      setStatus('pendiente');
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Error inesperado al crear la tarea.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isFormDisabled = disabled || submitting;

  return (
    <section
      aria-labelledby="nueva-tarea-heading"
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <PlusCircle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="nueva-tarea-heading"
            className="text-base font-semibold text-slate-900"
          >
            Nueva tarea o incidencia
          </h2>
          <p className="text-xs text-slate-500">
            Registra un nuevo elemento directamente en Supabase
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="task-title"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Título <span className="text-rose-500">*</span>
          </label>
          <input
            id="task-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="Ej. Corregir error en pasarela de pagos"
            maxLength={140}
            disabled={isFormDisabled}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'task-title-error' : undefined}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {errors.title && (
            <p
              id="task-title-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-rose-600"
            >
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="task-description"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Descripción
          </label>
          <textarea
            id="task-description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            placeholder="Detalles técnicos, pasos para reproducir o criterios de aceptación..."
            maxLength={1000}
            disabled={isFormDisabled}
            aria-invalid={Boolean(errors.description)}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {errors.description && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
              {errors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="task-priority"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Prioridad
            </label>
            <select
              id="task-priority"
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ItemPriority)}
              disabled={isFormDisabled}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ITEM_PRIORITIES.map((itemPriority) => (
                <option key={itemPriority} value={itemPriority}>
                  {PRIORITY_METADATA[itemPriority].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="task-status"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Estado inicial
            </label>
            <select
              id="task-status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ItemStatus)}
              disabled={isFormDisabled}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ITEM_STATUSES.map((itemStatus) => (
                <option key={itemStatus} value={itemStatus}>
                  {STATUS_METADATA[itemStatus].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isFormDisabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Guardando tarea...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Añadir tarea
            </>
          )}
        </button>
      </form>
    </section>
  );
}
