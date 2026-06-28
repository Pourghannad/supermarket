export function formatPrice(priceInRial: number): string {
  const toman = Math.round(priceInRial / 10);
  return new Intl.NumberFormat('fa-IR').format(toman);
}

export function formatSource(source: 'okala' | 'digikalajet'): string {
  return source === 'okala' ? 'اکالا' : 'دیجی‌کالا جت';
}
