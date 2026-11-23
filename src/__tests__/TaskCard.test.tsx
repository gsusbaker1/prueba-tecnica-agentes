import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/TaskCard';
import type { Item } from '@/types/item';

const LONG_UNBROKEN_TITLE = 'W'.repeat(120);
const LONG_UNBROKEN_DESC = 'X'.repeat(500);

const LONG_ITEM: Item = {
  id: 'overflow-1',
  title: LONG_UNBROKEN_TITLE,
  description: LONG_UNBROKEN_DESC,
  priority: 'alta',
  status: 'pendiente',
  created_at: '2026-06-15T10:00:00.000Z',
};

describe('TaskCard overflow protection', () => {
  it('aplica clases de ajuste de texto y contención de overflow en cadenas largas sin espacios', () => {
    render(
      <TaskCard
        item={LONG_ITEM}
        onStatusChange={vi.fn().mockResolvedValue(undefined)}
        onUpdate={vi.fn().mockResolvedValue(undefined)}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const card = screen.getByRole('article');
    expect(card.className).toContain('min-w-0');
    expect(card.className).toContain('overflow-hidden');

    const titleHeading = screen.getByRole('heading', {
      name: LONG_UNBROKEN_TITLE,
    });
    expect(titleHeading.className).toContain('break-words');
    expect(titleHeading.className).toContain('[overflow-wrap:anywhere]');

    const descParagraph = screen.getByText(LONG_UNBROKEN_DESC);
    expect(descParagraph.className).toContain('break-words');
    expect(descParagraph.className).toContain('[overflow-wrap:anywhere]');
  });
});
