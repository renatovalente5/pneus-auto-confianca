/* Os ícones do site: desenhos de traço (24×24, traço 1,5), redondos nas pontas. O WhatsApp e a estrela são cheios. */

const T = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const ICONES = Object.freeze({
  seta: T('<path d="M5 12h13M13 6l6 6-6 6"/>'),
  setaFora: T('<path d="M8 16 16 8M9.5 8H16v6.5"/>'),
  anterior: T('<path d="M15 5l-7 7 7 7"/>'),
  seguinte: T('<path d="M9 5l7 7-7 7"/>'),
  menu: T('<path d="M4 9h16M4 15h16"/>'),
  fechar: T('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: T('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  telefone: T('<path d="M6.6 3.5h2.6l1.4 4-1.9 1.3a12 12 0 0 0 6.5 6.5l1.3-1.9 4 1.4v2.6A2 2 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6a2 2 0 0 1 2.6-2.1Z"/>'),
  email: T('<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/>'),
  instagram: T('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>'),
  facebook: T('<path d="M14.5 20.5v-7h2.4l.4-2.8h-2.8V9c0-.8.3-1.4 1.4-1.4h1.5V5.1a19 19 0 0 0-2.2-.1c-2.2 0-3.6 1.3-3.6 3.7v2h-2.4v2.8h2.4v7"/>'),
  local: T('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>'),
  relogio: T('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  camara: T('<path d="M4.5 8h3l1.5-2.5h6L16.5 8h3a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.3" r="3.4"/>'),
  estrela: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3a8.2 8.2 0 1 1 7 3.8Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
  // o que fazem
  pneu: T('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>'),
  jante: T('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.8"/><path d="M12 10.2V4.5M13.7 11.4l5.4-1.8M13 13.5l3.4 4.6M11 13.5l-3.4 4.6M10.3 11.4 4.9 9.6"/>'),
  volante: T('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M3.6 10.5c2.6-.9 5.4-.9 8.4 1.5 3-2.4 5.8-2.4 8.4-1.5M12 14.2v6.2"/>'),
  chave: T('<path d="M14.6 3.8a4.6 4.6 0 0 0-5 6.1L3.9 15.6a1.9 1.9 0 0 0 2.7 2.7l5.7-5.7a4.6 4.6 0 0 0 6.1-5l-2.9 2.9-2.4-.4-.4-2.4Z"/>'),
  bateria: T('<rect x="3.5" y="7.5" width="17" height="11" rx="2"/><path d="M7 7.5V5.5h2.5v2M14.5 7.5V5.5H17v2M7 13h3M8.5 11.5v3M14 13h3"/>'),
  raio: T('<path d="M13 3 5.5 13.5H11L10 21l8.5-11H13Z"/>'),
  carro: T('<path d="M3.5 15.5v-3l2.2-4.2a2 2 0 0 1 1.8-1.1h8.9a2 2 0 0 1 1.8 1.1l2.3 4.2v3a1 1 0 0 1-1 1h-1M5 16.5H4.5a1 1 0 0 1-1-1"/><path d="M3.8 12.5h16.4"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/><path d="M9.3 16.5h5.4"/>'),
  escudo: T('<path d="M12 3.5 19 6v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  envio: T('<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4Z"/><path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9"/>'),
  pincel: T('<path d="M14.5 4.5 19.5 9.5 11 18l-5-5Z"/><path d="M6 13c-2 .6-2.5 2.5-2.5 4.5 0 1.3-.5 2-1 2.5 3 .3 6-.5 7.5-2.5"/>'),
});
