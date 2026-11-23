import { describe, expect, it } from 'vitest';
import {
  computeItemCounts,
  filterItems,
  getNextStatus,
  sortItemsByNewest,
  validateItemInput,
} from '@/lib/item-utils';
import type { Item } from '@/types/item';

const SAMPLE_ITEMS: Item[] = [
  {
    id: '1',
    title: 'Configurar despliegue en Vercel',
    description: 'Añadir variables públicas de Supabase en el panel.',
    priority: 'alta',
    status: 'pendiente',
    created_at: '2026-06-01T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'Diseñar filtros del tablero',
    description: 'Añadir contadores dinámicos por estado.',
    priority: 'media',
    status: 'en_proceso',
    created_at: '2026-06-02T12:00:00.000Z',
  },
  {
    id: '3',
    title: 'Crear tabla items en Supabase',
    description: null,
    priority: 'baja',
    status: 'completado',
    created_at: '2026-06-03T15:30:00.000Z',
  },
];

describe('item-utils', () => {
  describe('getNextStatus', () => {
    it('cicla correctamente pendiente -> en_proceso -> completado -> pendiente', () => {
      expect(getNextStatus('pendiente')).toBe('en_proceso');
      expect(getNextStatus('en_proceso')).toBe('completado');
      expect(getNextStatus('completado')).toBe('pendiente');
    });
  });

  describe('computeItemCounts', () => {
    it('calcula correctamente el total y los contadores por estado', () => {
      const counts = computeItemCounts(SAMPLE_ITEMS);
      expect(counts).toEqual({
        todos: 3,
        pendiente: 1,
        en_proceso: 1,
        completado: 1,
      });
    });

    it('devuelve ceros cuando no hay tareas', () => {
      expect(computeItemCounts([])).toEqual({
        todos: 0,
        pendiente: 0,
        en_proceso: 0,
        completado: 0,
      });
    });
  });

  describe('filterItems', () => {
    it('filtra por estado específico', () => {
      const result = filterItems(SAMPLE_ITEMS, 'en_proceso');
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('2');
    });

    it('filtra combinando estado, prioridad y texto de búsqueda', () => {
      const byPriority = filterItems(SAMPLE_ITEMS, 'todos', 'alta');
      expect(byPriority.map((i) => i.id)).toEqual(['1']);

      const byQueryInDescription = filterItems(
        SAMPLE_ITEMS,
        'todos',
        'todas',
        'contadores',
      );
      expect(byQueryInDescription.map((i) => i.id)).toEqual(['2']);
    });
  });

  describe('sortItemsByNewest', () => {
    it('ordena las tareas de la más reciente a la más antigua sin mutar el original', () => {
      const sorted = sortItemsByNewest(SAMPLE_ITEMS);
      expect(sorted.map((item) => item.id)).toEqual(['3', '2', '1']);
      expect(SAMPLE_ITEMS.map((item) => item.id)).toEqual(['1', '2', '3']);
    });
  });

  describe('validateItemInput', () => {
    it('rechaza títulos vacíos o demasiado cortos', () => {
      expect(
        validateItemInput({
          title: '   ',
          description: '',
          priority: 'media',
          status: 'pendiente',
        }).valid,
      ).toBe(false);

      expect(
        validateItemInput({
          title: 'ab',
          description: '',
          priority: 'media',
          status: 'pendiente',
        }).errors.title,
      ).toBeDefined();
    });

    it('acepta una tarea válida completa', () => {
      const result = validateItemInput({
        title: 'Auditar compilación de producción',
        description: 'Ejecutar npm run build y vitest.',
        priority: 'alta',
        status: 'pendiente',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });
});
