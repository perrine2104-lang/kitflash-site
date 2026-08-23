/* =========================================================
   KITFLASH — script principal (nav mobile, panier, filtres...)
========================================================= */

const CART_KEY = 'kitflash_cart';

function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount(){
  const cart = getCart();
  const total = cart.reduce((s,i)=>s+i.qty,0);
  document.querySelectorAll('.cart-count').forEach(el=> el.textContent = total);
}
function addToCart(item){
  const cart = getCart();
  const existing = cart.find(i=> i.id === item.id && i.size === item.size);
  if(existing){ existing.qty += item.qty; }
  else{ cart.push(item); }
  saveCart(cart);
  showToast(`${item.name} ajouté au panier !`);
}
function removeFromCart(id, size){
  let cart = getCart();
  cart = cart.filter(i=> !(i.id === id && i.size === size));
  saveCart(cart);
  renderCartPage();
}
function updateQty(id, size, qty){
  const cart = getCart();
  const item = cart.find(i=> i.id === id && i.size === size);
  if(item){ item.qty = Math.max(1, qty); }
  saveCart(cart);
  renderCartPage();
}

function showToast(msg){
  let toast = document.querySelector('.toast');
  if(!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> toast.classList.remove('show'), 2600);
}

/* ---------- Nav mobile ---------- */
function initNav(){
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.main-nav');
  if(burger && nav){
    burger.addEventListener('click', ()=> nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> nav.classList.remove('open')));
  }
}

/* ---------- Boutons "ajouter au panier" génériques (grille produits) ---------- */
function initAddToCartButtons(){
  document.querySelectorAll('.add-cart-btn[data-id]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        img: btn.dataset.img,
        league: btn.dataset.league || '',
        size: 'M',
        qty: 1
      });
    });
  });
}

/* ---------- Countdown promo (hero) ---------- */
function initCountdown(){
  const el = document.querySelector('.hero-countdown');
  if(!el) return;
  let end = localStorage.getItem('kitflash_promo_end');
  if(!end){
    end = Date.now() + 1000*60*60*36; // 36h
    localStorage.setItem('kitflash_promo_end', end);
  }
  end = parseInt(end,10);
  function tick(){
    const diff = Math.max(0, end - Date.now());
    const h = Math.floor(diff/3600000);
    const m = Math.floor((diff%3600000)/60000);
    const s = Math.floor((diff%60000)/1000);
    el.querySelector('[data-h]').textContent = String(h).padStart(2,'0');
    el.querySelector('[data-m]').textContent = String(m).padStart(2,'0');
    el.querySelector('[data-s]').textContent = String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------- Page boutique : filtres ---------- */
function initShopFilters(){
  const grid = document.querySelector('[data-shop-grid]');
  if(!grid) return;
  const cards = Array.from(grid.querySelectorAll('.product-card'));
  const leagueBoxes = document.querySelectorAll('[data-filter-league]');
  const sortSelect = document.querySelector('[data-sort]');
  const searchInput = document.querySelector('[data-shop-search]');

  function applyFilters(){
    const activeLeagues = Array.from(leagueBoxes).filter(b=>b.checked).map(b=>b.value);
    const query = (searchInput?.value || '').toLowerCase();
    cards.forEach(card=>{
      const league = card.dataset.league;
      const name = card.dataset.name.toLowerCase();
      const matchLeague = activeLeagues.length === 0 || activeLeagues.includes(league);
      const matchSearch = name.includes(query);
      card.style.display = (matchLeague && matchSearch) ? '' : 'none';
    });
  }

  function applySort(){
    const val = sortSelect.value;
    const sorted = cards.slice().sort((a,b)=>{
      const pa = parseFloat(a.dataset.price), pb = parseFloat(b.dataset.price);
      if(val === 'price-asc') return pa - pb;
      if(val === 'price-desc') return pb - pa;
      return 0;
    });
    sorted.forEach(c=> grid.appendChild(c));
  }

  leagueBoxes.forEach(b=> b.addEventListener('change', applyFilters));
  if(searchInput) searchInput.addEventListener('input', applyFilters);
  if(sortSelect) sortSelect.addEventListener('change', applySort);
}

/* ---------- Page produit : taille + quantité + galerie ---------- */
function initProductPage(){
  const wrap = document.querySelector('[data-product-page]');
  if(!wrap) return;

  const sizeBoxes = wrap.querySelectorAll('.size-box');
  let selectedSize = 'M';
  sizeBoxes.forEach(box=>{
    box.addEventListener('click', ()=>{
      sizeBoxes.forEach(b=>b.classList.remove('selected'));
      box.classList.add('selected');
      selectedSize = box.dataset.size;
    });
  });

  const qtyInput = wrap.querySelector('.qty-selector input');
  wrap.querySelector('[data-qty-minus]')?.addEventListener('click', ()=>{
    qtyInput.value = Math.max(1, parseInt(qtyInput.value,10) - 1);
  });
  wrap.querySelector('[data-qty-plus]')?.addEventListener('click', ()=>{
    qtyInput.value = parseInt(qtyInput.value,10) + 1;
  });

  const thumbs = wrap.querySelectorAll('.gallery-thumbs img');
  const mainImg = wrap.querySelector('.gallery-main img');
  thumbs.forEach(t=>{
    t.addEventListener('click', ()=>{
      thumbs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      mainImg.src = t.src;
    });
  });

  const addBtn = wrap.querySelector('[data-add-to-cart]');
  addBtn?.addEventListener('click', ()=>{
    addToCart({
      id: addBtn.dataset.id,
      name: addBtn.dataset.name,
      price: parseFloat(addBtn.dataset.price),
      img: addBtn.dataset.img,
      league: addBtn.dataset.league || '',
      size: selectedSize,
      qty: parseInt(qtyInput.value,10)
    });
  });
}

/* ---------- Page panier ---------- */
function renderCartPage(){
  const body = document.querySelector('[data-cart-body]');
  if(!body) return;
  const cart = getCart();
  const emptyMsg = document.querySelector('[data-cart-empty]');
  const summaryWrap = document.querySelector('[data-cart-summary]');

  if(cart.length === 0){
    body.innerHTML = '';
    if(emptyMsg) emptyMsg.style.display = 'block';
    if(summaryWrap) summaryWrap.style.display = 'none';
    return;
  }
  if(emptyMsg) emptyMsg.style.display = 'none';
  if(summaryWrap) summaryWrap.style.display = 'block';

  body.innerHTML = cart.map(item=>`
    <tr>
      <td>
        <div class="cart-item-info">
          <img src="${item.img}" alt="${item.name}">
          <div>
            <b>${item.name}</b>
            <span>Taille : ${item.size}</span>
          </div>
        </div>
      </td>
      <td>${item.price.toFixed(2)} €</td>
      <td>
        <div class="qty-selector">
          <button data-minus data-id="${item.id}" data-size="${item.size}">-</button>
          <input type="text" value="${item.qty}" readonly>
          <button data-plus data-id="${item.id}" data-size="${item.size}">+</button>
        </div>
      </td>
      <td>${(item.price*item.qty).toFixed(2)} €</td>
      <td><button class="remove-btn" data-remove data-id="${item.id}" data-size="${item.size}">Retirer</button></td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=> removeFromCart(btn.dataset.id, btn.dataset.size));
  });
  body.querySelectorAll('[data-plus]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cart = getCart();
      const item = cart.find(i=>i.id===btn.dataset.id && i.size===btn.dataset.size);
      updateQty(btn.dataset.id, btn.dataset.size, item.qty+1);
    });
  });
  body.querySelectorAll('[data-minus]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cart = getCart();
      const item = cart.find(i=>i.id===btn.dataset.id && i.size===btn.dataset.size);
      updateQty(btn.dataset.id, btn.dataset.size, item.qty-1);
    });
  });

  const subtotal = cart.reduce((s,i)=> s + i.price*i.qty, 0);
  const shipping = subtotal >= 50 ? 0 : 4.9;
  const total = subtotal + shipping;
  const subtotalEl = document.querySelector('[data-cart-subtotal]');
  const shippingEl = document.querySelector('[data-cart-shipping]');
  const totalEl = document.querySelector('[data-cart-total]');
  if(subtotalEl) subtotalEl.textContent = subtotal.toFixed(2) + ' €';
  if(shippingEl) shippingEl.textContent = shipping === 0 ? 'Offerte' : shipping.toFixed(2) + ' €';
  if(totalEl) totalEl.textContent = total.toFixed(2) + ' €';
}

/* ---------- Formulaire contact (démo) ---------- */
function initContactForm(){
  const form = document.querySelector('[data-contact-form]');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    showToast('Message envoyé ! Notre équipe vous répond sous 24h.');
    form.reset();
  });
}

/* ---------- Newsletter (démo) ---------- */
function initNewsletter(){
  const form = document.querySelector('[data-newsletter-form]');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    showToast('Inscription confirmée ! Code FLASH15 envoyé par e-mail.');
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateCartCount();
  initNav();
  initAddToCartButtons();
  initCountdown();
  initShopFilters();
  initProductPage();
  renderCartPage();
  initContactForm();
  initNewsletter();
});
