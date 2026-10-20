const LOCALE = 'es-MX';

const moneyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'MXN' });
const numberFormatter = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// $1,000.00
export const formatMoney = (value) => moneyFormatter.format(value);

// 1,000.00
export const formatNumber = (value) => numberFormatter.format(value);

// 14:38:22
export const formatTime = (date) =>
  date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

// Jueves, 24 de octubre de 2024
export const formatLongDate = (date) =>
  capitalize(date.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

export const firstName = (nombre) => nombre.split(' ')[0];
