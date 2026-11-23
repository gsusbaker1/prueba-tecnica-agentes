export const ITEM_STATUSES = ['pendiente', 'en_proceso', 'completado'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_PRIORITIES = ['baja', 'media', 'alta'] as const;
export type ItemPriority = (typeof ITEM_PRIORITIES)[number];

export type StatusFilter = 'todos' | ItemStatus;
export type PriorityFilter = 'todas' | ItemPriority;

export interface Item {
  id: string;
  title: string;
  description: string | null;
  priority: ItemPriority;
  status: ItemStatus;
  created_at: string;
}

export interface CreateItemInput {
  title: string;
  description?: string;
  priority: ItemPriority;
  status: ItemStatus;
}

export interface UpdateItemInput {
  title?: string;
  description?: string | null;
  priority?: ItemPriority;
  status?: ItemStatus;
}

export interface ItemCounts {
  todos: number;
  pendiente: number;
  en_proceso: number;
  completado: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CreateItemInput, string>>;
}
