'use strict';

// ── Constants ──────────────────────────────────────────────
var STORAGE_KEY = 'cinepass_tickets';

// ── Ticket ID Generator ────────────────────────────────────
function generateTicketId() {
  var ts   = Date.now();
  var rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return 'TCK-' + ts + '-' + rand;
}

// ── localStorage Helpers ───────────────────────────────────
function getAllTickets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveAllTickets(tickets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function addTicket(ticket) {
  var tickets = getAllTickets();
  tickets.push(ticket);
  saveAllTickets(tickets);
}

function getTicketById(ticketId) {
  var tickets = getAllTickets();
  for (var i = 0; i < tickets.length; i++) {
    if (tickets[i].ticketId === ticketId) return tickets[i];
  }
  return null;
}

function markTicketUsed(ticketId) {
  var tickets = getAllTickets();
  for (var i = 0; i < tickets.length; i++) {
    if (tickets[i].ticketId === ticketId) {
      tickets[i].used   = true;
      tickets[i].usedAt = new Date().toISOString();
      saveAllTickets(tickets);
      return true;
    }
  }
  return false;
}

function clearAllTickets() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── QR Data Encode / Decode ────────────────────────────────
function encodeTicketToQR(ticket) {
  return JSON.stringify(ticket);
}

function decodeQRToTicket(qrString) {
  try {
    return JSON.parse(qrString);
  } catch (e) {
    return null;
  }
}

// ── Date / Time Formatters ─────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch (e) { return dateStr; }
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return isoStr; }
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  try {
    var parts = timeStr.split(':');
    var h = parseInt(parts[0]);
    var m = parseInt(parts[1]);
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
  } catch (e) { return timeStr; }
}

// ── Currency Formatter ─────────────────────────────────────
function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount || 0);
  } catch (e) {
    return 'Rs.' + (amount || 0);
  }
}

// ── Toast Notifications ────────────────────────────────────
function showToast(message, type, duration) {
  type     = type     || 'info';
  duration = duration || 3500;

  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  var icons = { success: 'OK', error: 'X', info: 'i', warning: '!' };
  var iconMap = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  var toastEl = document.createElement('div');
  toastEl.className = 'toast toast-' + type;
  toastEl.innerHTML = '<span>' + (iconMap[type] || 'ℹ️') + '</span><span>' + message + '</span>';
  container.appendChild(toastEl);

  setTimeout(function() {
    toastEl.classList.add('hide');
    toastEl.addEventListener('animationend', function() { toastEl.remove(); });
  }, duration);
}

// ── Navbar Active Link ─────────────────────────────────────
function setActiveNavLink() {
  var current = window.location.pathname.split('/').pop() || 'index.html';
  var links = document.querySelectorAll('.navbar-nav a');
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      links[i].classList.add('active');
    }
  }
}

// ── Hamburger Menu ─────────────────────────────────────────
function initHamburger() {
  var btn = document.getElementById('hamburger-btn');
  var nav = document.getElementById('main-nav');
  if (btn && nav) {
    btn.addEventListener('click', function() { nav.classList.toggle('open'); });
    document.addEventListener('click', function(e) {
      if (!btn.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }
}

// ── Shared Navbar HTML ─────────────────────────────────────
function renderNavbar(containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML =
    '<nav class="navbar">' +
      '<a href="index.html" class="navbar-brand">' +
        '<div class="logo-icon">🎬</div>' +
        '<span class="brand-name">CINE<span>PASS</span></span>' +
      '</a>' +
      '<ul class="navbar-nav" id="main-nav">' +
        '<li><a href="index.html">🏠 Home</a></li>' +
        '<li><a href="booking.html">🎟️ Book Ticket</a></li>' +
        '<li><a href="scanner.html">📷 Scanner</a></li>' +
        '<li><a href="dashboard.html">📊 Dashboard</a></li>' +
      '</ul>' +
      '<button class="hamburger" id="hamburger-btn" aria-label="Menu">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
    '</nav>';
  setActiveNavLink();
  initHamburger();
}

// ── Confirm Modal ──────────────────────────────────────────
function showConfirm(title, message, onConfirm) {
  var existing = document.getElementById('confirm-modal-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'confirm-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal" style="max-width:400px;">' +
      '<div class="modal-header">' +
        '<span class="modal-title">⚠️ ' + title + '</span>' +
        '<button class="modal-close" id="confirm-cancel-btn">✕</button>' +
      '</div>' +
      '<p style="color:var(--text-secondary);margin-bottom:1.5rem;font-size:0.93rem;">' + message + '</p>' +
      '<div class="flex gap-2">' +
        '<button class="btn btn-outline btn-full" id="confirm-cancel-btn2">Cancel</button>' +
        '<button class="btn btn-danger btn-full" id="confirm-ok-btn">Confirm</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  requestAnimationFrame(function() { overlay.classList.add('open'); });

  function close() { overlay.classList.remove('open'); setTimeout(function() { overlay.remove(); }, 300); }
  document.getElementById('confirm-cancel-btn').onclick  = close;
  document.getElementById('confirm-cancel-btn2').onclick = close;
  document.getElementById('confirm-ok-btn').onclick      = function() { close(); onConfirm(); };
  overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
}

// ── Escape HTML ────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Auto-init on DOM ready ─────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('navbar-placeholder')) {
    renderNavbar('navbar-placeholder');
  }
});