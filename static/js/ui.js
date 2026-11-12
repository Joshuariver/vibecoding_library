// 공용 UI 조각: SVG 아이콘 세트 (이모지 대신 어느 OS에서나 같은 모양으로 보이게)
(function () {
  const P = {
    home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M19 17H6',
    flask: 'M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3',
    check: 'M4 12l5 5L20 6',
    lock: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
    star: 'M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8L6.7 19.6l1-6L3.3 9.4l6-.9z',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z',
    menu: 'M4 6h16M4 12h16M4 18h16',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
    beaker: 'M9 3h6M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3M8 14h8',
    gloss: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM9 8h6M9 12h6',
    prompt: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
    library: 'M4 4v16M9 4v16M14 6l4 14M4 20h16',
    play: 'M7 4l13 8-13 8z',
    download: 'M12 3v12M7 10l5 5 5-5M5 21h14'
  };
  window.VCL_ICON = function ic(name, size, fill) {
    const s = size || 18;
    return `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || ''}"/></svg>`;
  };
})();
