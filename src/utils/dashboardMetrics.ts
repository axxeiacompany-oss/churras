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
  pax: number;
}

export interface HourlyDistribution {
  hourLabel: string;
  orderCount: number;
  revenue: number;
  isPeak: boolean;
  peakLabel?: string;
}

// Generate consistent 30-day history in Paraguayan Guaraní (₲) ending on current day
export function generate30DayMetrics(currentComandas: Comanda[]): DayMetric[] {
  const result: DayMetric[] = [];
  const baseDate = new Date('2026-10-09T12:00:00Z');
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

  // Past 29 days simulated deterministic curve + today in Guaraníes (₲)
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
    const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 5 || dayOfWeekIdx === 6; // Vie, Sab, Dom

    if (i === 0) {
      // TODAY in Guaraní: include actual real-time paid data or baseline
      const baseTodayLunch = todayLunchSales > 0 ? todayLunchSales : 12850000;
      const baseTodayDinner = todayDinnerSales > 0 ? todayDinnerSales : 16400000;
      const total = baseTodayLunch + baseTodayDinner;
      const orders = Math.max(todayPaid.length, 32);
      const pax = todayPaid.reduce((sum, c) => sum + c.peopleCount, 0) || 84;

      result.push({
        date: dateStr,
        displayDate: 'Hoy',
        dayOfWeek,
        isWeekend,
        lunchSales: Math.round(baseTodayLunch),
        dinnerSales: Math.round(baseTodayDinner),
        totalSales: Math.round(total),
        ordersCount: orders,
        paxCount: pax,
        pax: pax,
      });
    } else {
      // Deterministic variation in Guaraníes based on day seed
      const seed = (d.getDate() * 17 + d.getMonth() * 31) % 100;
      const weekendMultiplier = isWeekend ? 1.65 : 1.0;
      const variance = 0.85 + (seed / 100) * 0.35; // 0.85 to 1.20

      // Weekday vs Weekend baseline in Paraguayan Guaraní
      const baseLunch = Math.round((isWeekend ? 16500000 : 9800000) * variance * weekendMultiplier);
      const baseDinner = Math.round((isWeekend ? 22800000 : 13400000) * variance * weekendMultiplier);
      const total = baseLunch + baseDinner;
      const orders = Math.round(total / (isWeekend ? 440000 : 360000));
      const pax = Math.round(orders * 2.8);

      result.push({
        date: dateStr,
        displayDate,
        dayOfWeek,
        isWeekend,
        lunchSales: baseLunch,
        dinnerSales: baseDinner,
        totalSales: total,
        ordersCount: orders,
        paxCount: pax,
        pax: pax,
      });
    }
  }

  return result;
}

// Generate hourly peak distribution in Guaraní
export function getHourlyDistribution(dayMetrics: DayMetric[], comandas: Comanda[]): HourlyDistribution[] {
  const hours = [
    { hourLabel: '11:00 - 12:00', lunch: true, baseOrders: 14, baseRev: 4200000 },
    { hourLabel: '12:00 - 13:00', lunch: true, baseOrders: 38, baseRev: 14800000, isPeak: true, peakLabel: 'Pico Almuerzo' },
    { hourLabel: '13:00 - 14:00', lunch: true, baseOrders: 32, baseRev: 11200000 },
    { hourLabel: '14:00 - 15:00', lunch: true, baseOrders: 16, baseRev: 4800000 },
    { hourLabel: '15:00 - 18:00', lunch: false, baseOrders: 8, baseRev: 2500000 },
    { hourLabel: '18:00 - 19:00', lunch: false, baseOrders: 18, baseRev: 6200000 },
    { hourLabel: '19:00 - 20:00', lunch: false, baseOrders: 36, baseRev: 13500000 },
    { hourLabel: '20:00 - 21:00', lunch: false, baseOrders: 44, baseRev: 18400000, isPeak: true, peakLabel: 'Pico Cena' },
    { hourLabel: '21:00 - 22:00', lunch: false, baseOrders: 30, baseRev: 10500000 },
    { hourLabel: '22:00 - 23:30', lunch: false, baseOrders: 12, baseRev: 3900000 },
  ];

  return hours.map((h) => ({
    hourLabel: h.hourLabel,
    orderCount: h.baseOrders,
    revenue: h.baseRev,
    isPeak: !!h.isPeak,
    peakLabel: h.peakLabel,
  }));
}
