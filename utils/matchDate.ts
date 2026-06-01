export function fechaPartidoFromIso(iso: string): { date: string; time: string } {

  const trimmed = iso.trim();
  if (!trimmed) return { date: '', time: '' };
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** YYYY-MM-DD desde ISO o cadena de fecha del API. */
export function toDateOnlyString(value: string | Date): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    const { date } = fechaPartidoFromIso(trimmed);
    if (date) return date;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Fin del día local para guardar fecha de torneo (YYYY-MM-DD). */
export function dateOnlyToEndOfDayIso(dateOnly: string): string {
  const [y, mo, d] = dateOnly.split('-').map(Number);
  const local = new Date(y, mo - 1, d, 23, 59, 59, 999);
  return local.toISOString();
}

export function fechaPartidoToIso(date: string, time: string): string {
  const [y, mo, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const local = new Date(y, mo - 1, d, hh, mm, 0, 0);
  return local.toISOString();
}

export function formatPartidoFecha(iso: string | null): string {
  if (!iso) return 'Sin fecha';
  const { date, time } = fechaPartidoFromIso(iso);
  if (!date) return 'Sin fecha';
  const [y, mo, d] = date.split('-').map(Number);
  const local = new Date(y, mo - 1, d);
  const dayPart = local.toLocaleDateString('es-BO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return time ? `${dayPart}, ${time}` : dayPart;
}

/**
 * Conflicto de horario en la misma cancha.
 * F5/F7: mínimo 1h15 entre horarios de inicio; F11: 2h.
 * Partido finalizado: la cancha queda libre bufferMs después de finalizadoEn.
 */
export function campoHorarioConflicto(
  targetMs: number,
  other: {
    fecha: string | null;
    faseJuego?: string;
    estado?: string;
    finalizadoEn?: string | null;
  },
  bufferMs: number,
): boolean {
  if (!other.fecha) return false;
  const otherStart = new Date(other.fecha).getTime();
  if (Number.isNaN(otherStart)) return false;

  if (other.faseJuego === 'FINALIZADO') {
    const ended = other.finalizadoEn
      ? new Date(other.finalizadoEn).getTime()
      : otherStart;
    return targetMs < ended + bufferMs;
  }

  if (other.estado === 'EN_CURSO') {
    return targetMs < Date.now() + bufferMs;
  }

  return Math.abs(targetMs - otherStart) < bufferMs;
}