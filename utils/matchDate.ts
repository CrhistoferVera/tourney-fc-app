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

export function getCampoOccupiedRange(partido: {
    fecha: string | null;
    faseJuego?: string;
    estado?: string;
    finalizadoEn?: string | null;
  },
  bufferMs: number,
): { start: number; end: number } | null {
  if (!partido.fecha) return null;
  const scheduled = new Date(partido.fecha).getTime();
  if (Number.isNaN(scheduled)) return null;
  if (partido.faseJuego === 'FINALIZADO') {
    const ended = partido.finalizadoEn
      ? new Date(partido.finalizadoEn).getTime()
      : scheduled;
    return {
      start: scheduled - bufferMs,
      end: ended + bufferMs,
    };
  }



  if (partido.estado === 'EN_CURSO') {
    return {
      start: scheduled - bufferMs,
      end: Date.now() + bufferMs,
    };
  }

  return {
    start: scheduled - bufferMs,
    end: scheduled + bufferMs,
  };
}

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
  const range = getCampoOccupiedRange(other, bufferMs);
  if (!range) return false;
  const newStart = targetMs - bufferMs;
  const newEnd = targetMs + bufferMs;
  return newStart < range.end && newEnd > range.start;
}