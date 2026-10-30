
'use strict';

const KEY = 'skinforge_v1';

const catalog = [
  {id:'armor_base',type:'armor',name:'Стартовая броня',color:'#8465d9',icon:'🛡️',price:0},
  {id:'armor_fire',type:'armor',name:'Огненный страж',color:'#e9634e',icon:'🔥',price:120},
  {id:'armor_ice',type:'armor',name:'Ледяной рыцарь',color:'#57bfe9',icon:'❄️',price:160},
  {id:'armor_gold',type:'armor',name:'Золотой титан',color:'#e9b84e',icon:'👑',price:220},
  {id:'helm_base',type:'helm',name:'Шлем новичка',color:'#b3a6e6',icon:'🪖',price:0},
  {id:'helm_shadow',type:'helm',name:'Тёмный визор',color:'#514c75',icon:'🥷',price:100},
  {id:'helm_sun',type:'helm',name:'Солнечный шлем',color:'#f1c66b',icon:'🌟',price:140},
  {id:'weapon_base',type:'weapon',name:'Энергоклинок',color:'#55e9ff',icon:'⚔️',price:0},
  {id:'weapon_ember',type:'weapon',name:'Пламенный меч',color:'#ff7a55',icon:'🗡️',price:130},
  {id:'weapon_void',type:'weapon',name:'Клинок бездны',color:'#b77aff',icon:'✨',price:190}
];

const defaults = {
  coins:200,
  xp:0,
  name:'Неоновый рыцарь',
  owned:['armor_base','helm_base','weapon_base'],
  equipped:{
    armor:'armor_base',
    helm:'helm_base',
    weapon:'weapon_base'
  },
  claims:{}
};

let state;

try {
  const raw = JSON.parse(localStorage.getItem(KEY));
  state = raw && typeof raw === 'object'
    ? {
        ...defaults,
        ...raw,
        equipped:{...defaults.equipped,...raw.equipped},
        claims:raw.claims || {}
      }
    : structuredClone(defaults);
} catch {
  state = structuredClone(defaults);
}

if (!Array.isArray(state.owned)) {
  state.owned = [...defaults.owned];
}
if (!Number.isFinite(state.coins) || state.coins < 0) {
  state.coins = 200;
}
if (!Number.isFinite(state.xp) || state.xp < 0) {
  state.xp = 0;
}

const $ = id => document.getElementById(id);

function saveState() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    notify('Не удалось сохранить данные браузера');
  }
}

let toastTimer;

function notify(msg) {
  $('toast').textContent = msg;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $('toast').classList.remove('show');
  }, 2500);
}

const getItem = id => catalog.find(i => i.id === id);

function renderHero() {
  const avatar = $('avatar');

  avatar.style.setProperty(
    '--armor',
    getItem(state.equipped.armor)?.color || '#8465d9'
  );
  avatar.style.setProperty(
    '--helm',
    getItem(state.equipped.helm)?.color || '#b3a6e6'
  );
  avatar.style.setProperty(
    '--blade',
    getItem(state.equipped.weapon)?.color || '#55e9ff'
  );

  $('coins').textContent = state.coins.toLocaleString('ru-RU');

  const level = Math.floor(state.xp / 100) + 1;
  $('level').textContent = level;
  $('xpText').textContent = `${state.xp % 100} / 100 XP`;
  $('xpFill').style.width = (state.xp % 100) + '%';
  $('heroName').value = state.name;
}

let category = 'armor';

const names = {
  armor:'🛡 Броня',
  helm:'🪖 Шлем',
  weapon:'⚔️ Оружие'
};

function itemCard(item, shop) {
  const owned = state.owned.includes(item.id);
  const selected = state.equipped[item.type] === item.id;

  const el = document.createElement('article');
  el.className = 'item' + (selected ? ' selected' : '');

  const sw = document.createElement('div');
  sw.className = 'swatch';
  sw.style.setProperty('--swatch', item.color);
  sw.textContent = item.icon;

  const title = document.createElement('b');
  title.textContent = item.name;

  const sub = document.createElement('small');
  sub.textContent = owned
    ? 'В коллекции'
    : `🪙 ${item.price}`;

  const btn = document.createElement('button');
  btn.textContent = selected
    ? 'Надето'
    : owned
      ? (shop ? 'Надеть' : 'Выбрать')
      : `Купить · ${item.price} 🪙`;

  btn.disabled = selected;

  btn.addEventListener('click', () => {
    if (!state.owned.includes(item.id)) {
      if (state.coins < item.price) {
        notify('Недостаточно монет');
        return;
      }

      state.coins -= item.price;
      state.owned.push(item.id);
      notify('Предмет куплен!');
    }

    state.equipped[item.type] = item.id;
    saveState();
    render();
  });

  el.append(sw, title, sub, btn);
  return el;
}

function renderWardrobe() {
  const cats = $('categories');
  cats.replaceChildren();

  Object.entries(names).forEach(([key, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = category === key ? 'active' : '';

    b.onclick = () => {
      category = key;
      renderWardrobe();
    };

    cats.append(b);
  });

  $('wardrobeItems').replaceChildren(
    ...catalog
      .filter(i => i.type === category && state.owned.includes(i.id))
      .map(i => itemCard(i, false))
  );
}

function renderShop() {
  $('shopItems').replaceChildren(
    ...catalog
      .filter(i => i.price > 0)
      .map(i => itemCard(i, true))
  );
}

const quests = [
  {
    id:'visit',
    name:'Ежедневный бонус',
    desc:'Зайди в игру сегодня',
    coins:50,
    xp:20
  },
  {
    id:'style',
    name:'Мастер стиля',
    desc:'Сохрани имя и образ героя',
    coins:35,
    xp:30
  },
  {
    id:'collector',
    name:'Коллекционер',
    desc:'Собери минимум 4 предмета',
    coins:75,
    xp:40
  }
];

function localDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function renderQuests() {
  const day = localDay();
  const container = $('questItems');
  container.replaceChildren();

  quests.forEach(q => {
    const done = state.claims[q.id] === day;

    const eligible =
      q.id === 'visit' ||
      (q.id === 'style' && state.name.trim().length > 0) ||
      (q.id === 'collector' && state.owned.length >= 4);

    const el = document.createElement('div');
    el.className = 'quest';

    const detail = document.createElement('div');
    detail.className = 'detail';

    const title = document.createElement('b');
    title.textContent = q.name;

    const sub = document.createElement('small');
    sub.textContent =
      `${q.desc} · +${q.coins} 🪙 · +${q.xp} XP`;

    detail.append(title, sub);

    const btn = document.createElement('button');
    btn.textContent = done
      ? 'Получено'
      : eligible
        ? 'Забрать'
        : 'Закрыто';

    btn.disabled = done || !eligible;

    btn.onclick = () => {
      if (state.claims[q.id] === localDay()) return;

      state.claims[q.id] = localDay();
      state.coins += q.coins;
      state.xp += q.xp;

      saveState();
      render();
      notify(`+${q.coins} монет, +${q.xp} XP`);
    };

    el.append(detail, btn);
    container.append(el);
  });
}

function render() {
  renderHero();
  renderWardrobe();
  renderShop();
  renderQuests();
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => {
      b.classList.toggle('active', b === btn);
    });

    document.querySelectorAll('.panel').forEach(p => {
      p.classList.toggle(
        'hidden',
        p.id !== btn.dataset.tab
      );
    });
  });
});

$('save').onclick = () => {
  const name = $('heroName').value.trim();

  if (!name) {
    notify('Введи имя героя');
    return;
  }

  state.name = name;
  saveState();
  render();
  notify('Герой сохранён!');
};

$('randomize').onclick = () => {
  for (const type of Object.keys(names)) {
    const choices = catalog.filter(i =>
      i.type === type && state.owned.includes(i.id)
    );

    state.equipped[type] =
      choices[Math.floor(Math.random() * choices.length)].id;
  }

  saveState();
  render();
  notify('Новый образ готов!');
};

render();
