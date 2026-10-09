import { Comanda, Employee, MenuItem } from '../types';

export interface DayMetric {
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  dayOfWeek: string; // Seg, Ter, Qua...
  isWeekend: boolean;
  lunchSales: number;
  dinnerSales: number;
  totalSales: number;
  ordersCount: number;
  paxCount: number;
}

export interface HourlyDistribution {
  hourLabel: string;
  orderCount: number;
  revenue: number;
  isPeak: boolean;
  peakLabel?: string;
}

// Generate consistent 30-day history ending on current day
export function generate30DayMetrics(currentComandas: Comanda[]): DayMetric[] {
  const result: DayMetric[] = [];
  const baseDate = new Date('2026-10-09T12:00:00Z');
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Calculate today's real closed sales
  const todayPaid = currentComandas.filter((c) => c.status === 'PAGA');
  const todayLunchPaid = todayPaid.filter((c) => {
    const h = new Date(c.openedAt).getHours();
    return h >= 11 && h < 17;
  });
  const todayDinnerPaid = todayPaid.filter((c) => {
    const h = new Date(c.openedAt).getHours();
    return h >= 17 || h < 4;
  });

  const todayLunchSales = todayLunchPaid.reduce((s, c) => s + c.total, 0);
  const todayDinnerSales = todayDinnerPaid.reduce((s, c) => s + c.total, 0);

  // Past 29 days simulated deterministic curve + today
  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const displayDate = `${day}/${month}`;
    const dayOfWeekIdx = d.getDay();
    const dayOfWeek = dayNames[dayOfWeekIdx];
    const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 5 || dayOfWeekIdx === 6; // Sex, Sab, Dom

    if (i === 0) {
      // TODAY: include actual real-time paid data (plus baseline for earlier hours of today)
      const baseTodayLunch = todayLunchSales > 0 ? todayLunchSales : 8420.0;
      const baseTodayDinner = todayDinnerSales > 0 ? todayDinnerSales : 6250.0;
      const total = baseTodayLunch + baseTodayDinner;
      const orders = Math.max(todayPaid.length, 28);
      const pax = todayPaid.reduce((sum, c) => sum + c.peopleCount, 0) || 74;

      result.push({
        date: dateStr,
        displayDate: 'Hoje',
        dayOfWeek,
        isWeekend,
        lunchSales: Math.round(baseTodayLunch * 100) / 100,
        dinnerSales: Math.round(baseTodayDinner * 100) / 100,
        totalSales: Math.round(total * 100) / 100,
        ordersCount: orders,
        paxCount: pax,
      });
    } else {
      // Deterministic variation based on day seed
      const seed = (d.getDate() * 17 + d.getMonth() * 31) % 100;
      const weekendMultiplier = isWeekend ? 1.65 : 1.0;
      const variance = 0.85 + (seed / 100) * 0.35; // 0.85 to 1.20

      // Weekday vs Weekend baseline
      const baseLunch = (isWeekend ? 9500 : 5400) * variance * weekendMultiplier;
      const baseDinner = (isWeekend ? 13200 : 7800) * variance * weekendMultiplier;
      const total = baseLunch + baseDinner;
      const orders = Math.round(total / (isWeekend ? 260 : 210));
      const pax = Math.round(orders * 2.8);

      result.push({
        date: dateStr,
        displayDate,
        dayOfWeek,
        isWeekend,
        lunchSales: Math.round(baseLunch * 100) / 100,
        dinnerSales: Math.round(baseDinner * 100) / 100,
        totalSales: Math.round(total * 100) / 100,
        ordersCount: orders,
        paxCount: pax,
      });
    }
  }

  return result;
}

// Generate hourly peak distribution
export function getHourlyDistribution(dayMetrics: DayMetric[], comandas: Comanda[]): HourlyDistribution[] {
  const hours = [
    { hourLabel: '11:00 - 12:00', lunch: true, baseOrders: 14, baseRev: 2850 },
    { hourLabel: '12:00 - 13:00', lunch: true, baseOrders: 38, baseRev: 8900, isPeak: true, peakLabel: 'Pico Almoço' },
    { hourLabel: '13:00 - 14:00', lunch: true, baseOrders: 32, baseRev: 7200 },
    { hourLabel: '14:00 - 15:00', lunch: true, baseOrders: 16, baseRev: 3100 },
    { hourLabel: '15:00 - 18:00', lunch: false, baseOrders: 8, baseRev: 1450 },
    { hourLabel: '18:00 - 19:00', lunch: false, baseOrders: 18, baseRev: 3900 },
    { hourLabel: '19:00 - 20:00', lunch: false, baseOrders: 36, baseRev: 8400 },
    { hourLabel: '20:00 - 21:00', lunch: false, baseOrders: 44, baseRev: 11200, isPeak: true, peakLabel: 'Pico Jantar' },
    { hourLabel: '21:00 - 22:00', lunch: false, baseOrders: 30, baseRev: 6900 },
    { hourLabel: '22:00 - 23:30', lunch: false, baseOrders: 12, baseRev: 2600 },
  ];

  return hours.map((h) => ({
    hourLabel: h.hourLabel,
    orderCount: h.baseOrders,
    revenue: h.baseRev,
    isPeak: !!h.isPeak,
    peakLabel: h.peakLabel,
  }));
}
