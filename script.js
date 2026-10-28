"use strict";
// Buscador y filtros, sin dependencias externas.
const search = document.querySelector('#search');
const cards = [...document.querySelectorAll('.card')];
const filters = [...document.querySelectorAll('[data-filter]')];
let category = 'all';
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function filterNews() {
  const query = normalize(search.value);
  let visible = 0;
  for (const card of cards) {
    const matches = (category === 'all' || card.dataset.category === category) && normalize(card.textContent).includes(query);
    card.hidden = !matches;
    if (matches) visible++;
  }
  document.querySelector('#no-results').hidden = visible > 0;
}
search.addEventListener('input', filterNews);
filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filters.forEach(item => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  filterNews();
}));
// Restablece los filtros cuando un enlace del menú apunta a una nota oculta.
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
  if (cards.some(card => '#' + card.id === link.getAttribute('href'))) {
    category = 'all';
    search.value = '';
    filters.forEach(button => {
      button.classList.toggle('active', button.dataset.filter === 'all');
      button.setAttribute('aria-pressed', String(button.dataset.filter === 'all'));
    });
    filterNews();
  }
}));
// Sopa de letras: coordenadas almacenadas para conservar el marcado.
const WORDS = ['FANTASMA', 'RIO', 'LEYENDA', 'MISTERIO', 'SANTAFE', 'GATO', 'SECRETO'];
const LABELS = ['FANTASMA', 'RÍO', 'LEYENDA', 'MISTERIO', 'SANTA FE', 'GATO', 'SECRETO'];
const SIZE = 12;
const DIRECTIONS = [[0,1],[1,0],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]];
const board = document.querySelector('#board');
const status = document.querySelector('#game-status');
let letters = [], placements = [], found = new Set(), start = null;
function placeWord(word) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const [dy, dx] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const row = Math.floor(Math.random() * SIZE), col = Math.floor(Math.random() * SIZE);
    const path = [];
    for (let k = 0; k < word.length; k++) {
      const y = row + dy * k, x = col + dx * k;
      if (y < 0 || y >= SIZE || x < 0 || x >= SIZE) break;
      path.push(y * SIZE + x);
    }
    if (path.length === word.length && path.every((pos, k) => !letters[pos] || letters[pos] === word[k])) {
      path.forEach((pos, k) => { letters[pos] = word[k]; });
      placements.push(path);
      return true;
    }
  }
  return false;
}
function newGame() {
  found = new Set(); start = null;
  let ready = false;
  for (let attempt = 0; attempt < 50 && !ready; attempt++) {
    letters = Array(SIZE * SIZE).fill(''); placements = [];
    ready = WORDS.every(placeWord);
  }
  if (!ready) {
    letters = Array(SIZE * SIZE).fill(''); placements = [];
    WORDS.forEach((word, row) => {
      const path = Array.from(word, (_, col) => row * SIZE + col);
      path.forEach((pos, k) => { letters[pos] = word[k]; });
      placements.push(path);
    });
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  letters = letters.map(letter => letter || alphabet[Math.floor(Math.random() * alphabet.length)]);
  renderGame();
}
function renderGame() {
  const marked = new Set();
  found.forEach(index => placements[index].forEach(pos => marked.add(pos)));
  board.replaceChildren();
  letters.forEach((letter, pos) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'cell'; button.textContent = letter;
    button.classList.toggle('selected', pos === start);
    button.classList.toggle('found', marked.has(pos));
    button.setAttribute('aria-label', `${letter}, fila ${Math.floor(pos / SIZE) + 1}, columna ${pos % SIZE + 1}`);
    button.setAttribute('aria-pressed', String(pos === start || marked.has(pos)));
    button.addEventListener('click', () => choose(pos));
    board.append(button);
  });
  const list = document.querySelector('#words'); list.replaceChildren();
  LABELS.forEach((word, index) => {
    const item = document.createElement('li'); item.textContent = word;
    item.classList.toggle('done', found.has(index)); list.append(item);
  });
  status.textContent = found.size === WORDS.length ? '¡Misterio resuelto! Encontraste todas las palabras.' : `${found.size} de ${WORDS.length} palabras encontradas.`;
}
function choose(pos) {
  if (start === null) { start = pos; renderGame(); return; }
  const origin = start; start = null;
  const row = Math.floor(origin / SIZE), col = origin % SIZE;
  const dy = Math.floor(pos / SIZE) - row, dx = pos % SIZE - col;
  let match = -1;
  if (dy === 0 || dx === 0 || Math.abs(dy) === Math.abs(dx)) {
    const length = Math.max(Math.abs(dy), Math.abs(dx)) + 1;
    const path = Array.from({length}, (_, k) => (row + Math.sign(dy) * k) * SIZE + col + Math.sign(dx) * k);
    const text = path.map(i => letters[i]).join('');
    match = WORDS.findIndex(word => word === text || word === [...text].reverse().join(''));
    if (match >= 0) {
      placements[match] = path;
      found.add(match);
    }
  }
  renderGame();
  if (match < 0) status.textContent = 'Esa selección no es una palabra de la lista. Probá otra vez.';
}
document.querySelector('#new-game').addEventListener('click', newGame);
document.querySelector('#reveal').addEventListener('click', () => {
  WORDS.forEach((_, index) => found.add(index)); start = null; renderGame();
  status.textContent = 'Soluciones reveladas. Creá un nuevo tablero para volver a jugar.';
});
newGame();
