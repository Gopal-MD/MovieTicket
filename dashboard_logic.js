(function() {
  'use strict';

  let allTickets = [];
  let filtered   = [];

  const tbody        = document.getElementById('tickets-tbody');
  const searchInput  = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const movieFilter  = document.getElementById('movie-filter');
  const tableInfo    = document.getElementById('table-info');
  const detailModal  = document.getElementById('detail-modal');
  const detailBody   = document.getElementById('detail-modal-body');
  const detailActions= document.getElementById('detail-modal-actions');
  const detailClose  = document.getElementById('detail-modal-close');

  function load() {
    allTickets = getAllTickets().sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
    populateMovieFilter();
    applyFilters();
    updateStats();
  }

  function updateStats() {
    const total   = allTickets.length;
    const used    = allTickets.filter(t => t.used).length;
    const pending = total - used;
    const revenue = allTickets.reduce((s, t) => s + (t.totalPrice || 0), 0);
    document.getElementById('stat-total').textContent   = total;
    document.getElementById('stat-used').textContent    = used;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-revenue').textContent = formatCurrency(revenue);
  }

  function populateMovieFilter() {
    const movies = [...new Set(allTickets.map(t => t.movieName).filter(Boolean))].sort();
    const current = movieFilter.value;
    movieFilter.innerHTML = '<option value="">All Movies</option>';
    movies.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      if (m === current) opt.selected = true;
      movieFilter.appendChild(opt);
    });
  }

  function applyFilters() {
    const q      = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const movie  = movieFilter.value;

    filtered = allTickets.filter(t => {
      const matchQ = !q ||
        (t.ticketId || '').toLowerCase().includes(q) ||
        (t.customerName || '').toLowerCase().includes(q) ||
        (t.movieName || '').toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q) ||
        (t.seatNumbers || '').toLowerCase().includes(q);
      const matchStatus = !status || (status === 'used' ? t.used : !t.used);
      const matchMovie  = !movie || t.movieName === movie;
      return matchQ && matchStatus && matchMovie;
    });

    renderTable();
  }

  function renderTable() {
    if (filtered.length === 0) {
      const isFiltered = searchInput.value || statusFilter.value || movieFilter.value;
      tbody.innerHTML = '<tr><td colspan="11"><div class="table-empty">' +
        '<div class="empty-icon">' + (isFiltered ? '🔎' : '🎫') + '</div>' +
        '<p>' + (isFiltered ? 'No tickets match your filter.' : 'No tickets yet. <a href="booking.html" style="color:var(--gold-primary);">Book your first ticket</a>') + '</p>' +
        '</div></td></tr>';
      tableInfo.textContent = '';
      return;
    }

    tbody.innerHTML = filtered.map(t => {
      const badge = t.used
        ? '<span class="badge badge-success">Entered</span>'
        : '<span class="badge badge-warning">Pending</span>';
      const tid = escHtml(t.ticketId);
      return '<tr>' +
        '<td><span class="ticket-row-id">' + tid + '</span></td>' +
        '<td>' + escHtml(t.customerName) + '</td>' +
        '<td><strong>' + escHtml(t.movieName) + '</strong></td>' +
        '<td>' + formatDate(t.showDate) + '</td>' +
        '<td>' + formatTime(t.showTime) + '</td>' +
        '<td>' + escHtml(t.screenNo) + '</td>' +
        '<td>' + escHtml(t.seatNumbers) + '</td>' +
        '<td style="text-align:center;">' + t.numTickets + '</td>' +
        '<td style="color:var(--gold-primary);font-weight:700;">' + formatCurrency(t.totalPrice) + '</td>' +
        '<td>' + badge + '</td>' +
        '<td><div class="action-cell">' +
          '<button class="btn btn-sm btn-outline" onclick="openDetail(\'' + tid + '\')">👁 View</button>' +
          (!t.used ? '<button class="btn btn-sm btn-primary" onclick="manualEntry(\'' + tid + '\')">Mark Used</button>' : '') +
          '<button class="btn btn-sm btn-danger" onclick="deleteTicket(\'' + tid + '\')">🗑</button>' +
        '</div></td>' +
        '</tr>';
    }).join('');

    tableInfo.textContent = 'Showing ' + filtered.length + ' of ' + allTickets.length + ' ticket' + (allTickets.length !== 1 ? 's' : '');
  }

  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  movieFilter.addEventListener('change', applyFilters);

  document.getElementById('refresh-btn').addEventListener('click', () => {
    load();
    showToast('Dashboard refreshed', 'info');
  });

  document.getElementById('clear-all-btn').addEventListener('click', () => {
    showConfirm(
      'Clear All Data',
      'This will permanently delete ALL ticket records. This cannot be undone.',
      () => {
        clearAllTickets();
        load();
        showToast('All ticket data cleared.', 'info');
      }
    );
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    if (allTickets.length === 0) { showToast('No tickets to export.', 'error'); return; }
    const headers = ['Ticket ID','Customer Name','Phone','Email','Movie','Show Date','Show Time','Screen','Seats','Qty','Price/Ticket','Total','Status','Booked At','Used At'];
    const rows = allTickets.map(t => [
      t.ticketId, t.customerName, t.phone, t.email,
      t.movieName, t.showDate, t.showTime, t.screenNo,
      t.seatNumbers, t.numTickets, t.pricePerTicket, t.totalPrice,
      t.used ? 'Used' : 'Pending',
      t.bookedAt, t.usedAt || ''
    ].map(v => '"' + String(v || '').replace(/"/g, '""') + '"'));
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'cinepass_tickets_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!', 'success');
  });

  window.openDetail = function(ticketId) {
    const t = getTicketById(ticketId);
    if (!t) { showToast('Ticket not found.', 'error'); return; }

    detailBody.innerHTML =
      '<div style="margin-bottom:1rem;">' +
        '<div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;">' +
          '<span style="font-family:monospace;font-size:0.85rem;color:var(--text-muted);">' + escHtml(t.ticketId) + '</span>' +
          (t.used ? '<span class="badge badge-success">Entered</span>' : '<span class="badge badge-warning">Pending Entry</span>') +
        '</div>' +
      '</div>' +
      '<div class="ticket-detail-grid">' +
        detail('Customer', escHtml(t.customerName)) +
        detail('Phone', escHtml(t.phone)) +
        detail('Email', escHtml(t.email)) +
        detail('Movie', escHtml(t.movieName)) +
        detail('Show Date', formatDate(t.showDate)) +
        detail('Show Time', formatTime(t.showTime)) +
        detail('Screen', escHtml(t.screenNo)) +
        detail('Seats', escHtml(t.seatNumbers)) +
        detail('Tickets', t.numTickets) +
        detail('Price/Ticket', formatCurrency(t.pricePerTicket)) +
        '<div class="ticket-detail-item"><span class="ticket-detail-label">Total Price</span><span class="ticket-detail-value" style="color:var(--gold-primary);font-size:1.1rem;">' + formatCurrency(t.totalPrice) + '</span></div>' +
        detail('Booked At', formatDateTime(t.bookedAt)) +
        (t.used ? '<div class="ticket-detail-item"><span class="ticket-detail-label">Used At</span><span class="ticket-detail-value" style="color:#4ade80;">' + formatDateTime(t.usedAt) + '</span></div>' : '') +
      '</div>';

    detailActions.innerHTML =
      (!t.used ? '<button class="btn btn-primary btn-sm" id="detail-mark-used">Mark as Used</button>' : '') +
      '<button class="btn btn-danger btn-sm" id="detail-delete">Delete Ticket</button>' +
      '<button class="btn btn-outline btn-sm" id="detail-close-btn">Close</button>';

    detailModal.classList.add('open');

    if (!t.used) {
      document.getElementById('detail-mark-used').onclick = () => {
        manualEntry(t.ticketId);
        closeDetailModal();
      };
    }
    document.getElementById('detail-delete').onclick = () => { closeDetailModal(); deleteTicket(t.ticketId); };
    document.getElementById('detail-close-btn').onclick = closeDetailModal;
  };

  function detail(label, value) {
    return '<div class="ticket-detail-item"><span class="ticket-detail-label">' + label + '</span><span class="ticket-detail-value">' + value + '</span></div>';
  }

  function closeDetailModal() { detailModal.classList.remove('open'); }
  detailClose.addEventListener('click', closeDetailModal);
  detailModal.addEventListener('click', e => { if (e.target === detailModal) closeDetailModal(); });

  window.manualEntry = function(ticketId) {
    const t = getTicketById(ticketId);
    if (!t) { showToast('Ticket not found.', 'error'); return; }
    if (t.used) { showToast('Ticket already marked as used.', 'warning'); return; }
    showConfirm(
      'Mark as Used',
      'Mark this ticket as used? This simulates a manual entry override.',
      () => { markTicketUsed(ticketId); load(); showToast('Ticket marked as used.', 'success'); }
    );
  };

  window.deleteTicket = function(ticketId) {
    showConfirm(
      'Delete Ticket',
      'Permanently delete this ticket? This cannot be undone.',
      () => {
        const tickets = getAllTickets().filter(t => t.ticketId !== ticketId);
        saveAllTickets(tickets);
        load();
        showToast('Ticket deleted.', 'info');
      }
    );
  };

  load();
  setInterval(load, 30000);
})();