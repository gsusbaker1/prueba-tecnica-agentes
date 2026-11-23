'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import {
  ITEM_PRIORITIES,
  type ItemCounts,
  type PriorityFilter,
  type StatusFilter,
} from '@/types/item';
import { PRIORITY_METADATA } from '@/lib/item-utils';

interface StatusFilterBarProps {
  counts: ItemCounts;
  activeStatus: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  onPriorityChange: (priority: PriorityFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FILTER_OPTIONS: Array<{
  key: StatusFilter;
  label: string;
  accent: string;
}> = [
  { key: 'todos', label: 'Todas', accent: 'bg-slate-900 text-white' },
  { key: 'pendiente', label: 'Pendiente', accent: 'bg-amber-600 text-white' },
  { key: 'en_proceso', label: 'En proceso', accent: 'bg-blue-600 text-white' },
  { key: 'completado', label: 'Completado', accent: 'bg-emerald-600 text-white' },
];

export function StatusFilterBar({
  counts,
  activeStatus,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  searchQuery,
  onSearchChange,
}: StatusFilterBarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div
        role="tablist"
        aria-label="Filtrar tareas por estado"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeStatus === option.key;
          const count = counts[option.key];

          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onStatusChange(option.key)}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                isActive
                  ? `${option.accent} shadow-sm`
                  : 'border border-slate-200/80 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{option.label}</span>
              <span
                className={`ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por título o descripción..."
            aria-label="Buscar tareas"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="relative sm:w-48">
          <SlidersHorizontal
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as PriorityFilter)}
            aria-label="Filtrar por prioridad"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3 text-sm text-slate-700 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="todas">Todas las prioridades</option>
            {ITEM_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                Prioridad {PRIORITY_METADATA[priority].label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
