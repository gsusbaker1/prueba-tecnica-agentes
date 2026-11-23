import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TaskForm } from '@/components/TaskForm';

describe('TaskForm', () => {
  it('muestra error de validación si se intenta enviar sin título', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onCreate={onCreate} />);

    fireEvent.click(screen.getByRole('button', { name: /añadir tarea/i }));

    expect(
      await screen.findByText(/el título es obligatorio/i),
    ).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('envía una tarea válida con el esquema en inglés y limpia el formulario tras guardarla', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onCreate={onCreate} />);

    const titleInput = screen.getByLabelText(/título/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(
      /descripción/i,
    ) as HTMLTextAreaElement;
    const prioritySelect = screen.getByLabelText(
      /prioridad/i,
    ) as HTMLSelectElement;
    const statusSelect = screen.getByLabelText(
      /estado inicial/i,
    ) as HTMLSelectElement;

    fireEvent.change(titleInput, {
      target: { value: 'Implementar pruebas con Vitest' },
    });
    fireEvent.change(descInput, {
      target: { value: 'Cubrir filtros y servicio CRUD.' },
    });
    fireEvent.change(prioritySelect, { target: { value: 'alta' } });
    fireEvent.change(statusSelect, { target: { value: 'en_proceso' } });

    fireEvent.click(screen.getByRole('button', { name: /añadir tarea/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Implementar pruebas con Vitest',
        description: 'Cubrir filtros y servicio CRUD.',
        priority: 'alta',
        status: 'en_proceso',
      });
    });

    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(descInput.value).toBe('');
    });
  });

  it('aplica maxLength de 120 en título y 500 en descripción con contadores visibles', () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onCreate={onCreate} />);

    const titleInput = screen.getByLabelText(/título/i) as HTMLInputElement;
    const descInput = screen.getByLabelText(
      /descripción/i,
    ) as HTMLTextAreaElement;

    expect(titleInput).toHaveAttribute('maxLength', '120');
    expect(descInput).toHaveAttribute('maxLength', '500');
    expect(screen.getByText('0/120')).toBeInTheDocument();
    expect(screen.getByText('0/500')).toBeInTheDocument();
  });
});
