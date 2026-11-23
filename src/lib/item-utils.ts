import {
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  type CreateItemInput,
  type Item,
  type ItemCounts,
  type ItemPriority,
  type ItemStatus,
  type PriorityFilter,
  type StatusFilter,
  type ValidationResult,
} from '@/types/item';

export const STATUS_METADATA: Record<
  ItemStatus,
  {
    label: string;
    shortLabel: string;
    nextActionLabel: string;
    badgeClasses: string;
    dotClasses: string;
  }
> = {
  pendiente: {
    label: 'Pendiente',
    shortLabel: 'Pendiente',
    nextActionLabel: 'Pasar a En proceso',
    badgeClasses: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20',
    dotClasses: 'bg-amber-500',
  },
  en_proceso: {
    label: 'En proceso',
    shortLabel: 'En proceso',
    nextActionLabel: 'Marcar completado',
    badgeClasses: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/15',
    dotClasses: 'bg-blue-500',
  },
  completado: {
    label: 'Completado',
    shortLabel: 'Completado',
    nextActionLabel: 'Reabrir tarea',
    badgeClasses: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    dotClasses: 'bg-emerald-500',
  },
};

export const PRIORITY_METADATA: Record<
  ItemPriority,
  {
    label: string;
    badgeClasses: string;
    weight: number;
  }
> = {
  alta: {
    label: 'Alta',
    badgeClasses: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
    weight: 3,
  },
  media: {
    label: 'Media',
    badgeClasses: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/15',
    weight: 2,
  },
  baja: {
    label: 'Baja',
    badgeClasses: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20',
    weight: 1,
  },
};

const NEXT_STATUS_MAP: Record<ItemStatus, ItemStatus> = {
  pendiente: 'en_proceso',
  en_proceso: 'completado',
  completado: 'pendiente',
};

/**
 * Avanza cíclicamente el estado de una tarea con un solo clic:
 * pendiente -> en_proceso -> completado -> pendiente
 */
export function getNextStatus(current: ItemStatus): ItemStatus {
  return NEXT_STATUS_MAP[current];
}

/**
 * Calcula los contadores totales y por cada estado.
 */
export function computeItemCounts(items: Item[]): ItemCounts {
  return items.reduce<ItemCounts>(
    (acc, item) => {
      acc.todos += 1;
      if (item.status === 'pendiente') acc.pendiente += 1;
      else if (item.status === 'en_proceso') acc.en_proceso += 1;
      else if (item.status === 'completado') acc.completado += 1;
      return acc;
    },
    { todos: 0, pendiente: 0, en_proceso: 0, completado: 0 },
  );
}

/**
 * Filtra tareas por estado, prioridad y texto libre (título o descripción).
 */
export function filterItems(
  items: Item[],
  statusFilter: StatusFilter,
  priorityFilter: PriorityFilter = 'todas',
  searchQuery = '',
): Item[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (statusFilter !== 'todos' && item.status !== statusFilter) {
      return false;
    }

    if (priorityFilter !== 'todas' && item.priority !== priorityFilter) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
      const descriptionMatch = (item.description ?? '')
        .toLowerCase()
        .includes(normalizedQuery);
      return titleMatch || descriptionMatch;
    }

    return true;
  });
}

/**
 * Ordena las tareas más recientes primero sin mutar el array original.
 */
export function sortItemsByNewest(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const timeA = Date.parse(a.created_at) || 0;
    const timeB = Date.parse(b.created_at) || 0;
    return timeB - timeA;
  });
}

/**
 * Valida la entrada antes de crear o editar una tarea.
 */
export function validateItemInput(input: CreateItemInput): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  const trimmedTitle = input.title.trim();

  if (trimmedTitle.length === 0) {
    errors.title = 'El título es obligatorio.';
  } else if (trimmedTitle.length < 3) {
    errors.title = 'El título debe tener al menos 3 caracteres.';
  } else if (trimmedTitle.length > 140) {
    errors.title = 'El título no puede superar los 140 caracteres.';
  }

  if (input.description && input.description.trim().length > 1000) {
    errors.description = 'La descripción no puede superar los 1000 caracteres.';
  }

  if (!ITEM_PRIORITIES.includes(input.priority)) {
    errors.priority = 'Selecciona una prioridad válida.';
  }

  if (!ITEM_STATUSES.includes(input.status)) {
    errors.status = 'Selecciona un estado válido.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatRelativeDate(isoDate: string): string {
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) {
    return 'Fecha desconocida';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(parsed));
}
