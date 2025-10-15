// js/modules/calendar.js (Versi Final Optimized)
import { DB } from '../database.js';
import { Utils } from '../utils.js';

export class CalendarModule {
    constructor(app) {
        this.app = app;
        this.calendarDate = new Date();
        this.viewMode = 'month';
        this.selectedDate = new Date().toISOString().split('T')[0];
    }

    async render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🗓️ Kalender Transaksi & Jadwal</h3>
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <div class="btn-group">
                            <button class="btn btn-outline btn-sm ${this.viewMode === 'month' ? 'active' : ''}" id="monthViewBtn">Bulan</button>
                            <button class="btn btn-outline btn-sm ${this.viewMode === 'week' ? 'active' : ''}" id="weekViewBtn">Minggu</button>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <button class="btn btn-outline btn-sm" id="prevBtn">←</button>
                            <span id="currentPeriod" style="margin: 0 15px; min-width: 200px; text-align: center;"></span>
                            <button class="btn btn-outline btn-sm" id="nextBtn">→</button>
                        </div>
                        <button class="btn btn-primary btn-sm" id="addScheduleBtn">+ Tambah Jadwal</button>
                        <button class="btn btn-secondary btn-sm" id="todayBtn">Hari Ini</button>
                    </div>
                </div>
                <div id="calendarContainer"></div>
            </div>
        `;
        
        await this.renderCalendarView();
        this.attachEventListeners();
    }

    attachEventListeners() {
        document.getElementById('prevBtn').addEventListener('click', () => this.navigatePeriod(-1));
        document.getElementById('nextBtn').addEventListener('click', () => this.navigatePeriod(1));
        document.getElementById('monthViewBtn').addEventListener('click', () => this.switchView('month'));
        document.getElementById('weekViewBtn').addEventListener('click', () => this.switchView('week'));
        document.getElementById('addScheduleBtn').addEventListener('click', () => this.showAddScheduleForm());
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());
    }

    async switchView(viewMode) {
        this.viewMode = viewMode;
        await this.renderCalendarView();
        
        document.getElementById('monthViewBtn').classList.toggle('active', viewMode === 'month');
        document.getElementById('weekViewBtn').classList.toggle('active', viewMode === 'week');
    }

    async navigatePeriod(direction) {
        if (this.viewMode === 'month') {
            this.calendarDate.setMonth(this.calendarDate.getMonth() + direction);
        } else {
            this.calendarDate.setDate(this.calendarDate.getDate() + (direction * 7));
        }
        await this.renderCalendarView();
    }

    async goToToday() {
        this.calendarDate = new Date();
        this.selectedDate = new Date().toISOString().split('T')[0];
        await this.renderCalendarView();
    }

    async renderCalendarView() {
        const calendarContainer = document.getElementById('calendarContainer');
        const currentPeriodSpan = document.getElementById('currentPeriod');
        
        if (!calendarContainer || !currentPeriodSpan) return;

        const [transactions, schedules] = await Promise.all([
            DB.getTransactions(),
            DB.getSchedules()
        ]);

        if (this.viewMode === 'month') {
            this.renderMonthView(calendarContainer, currentPeriodSpan, transactions, schedules);
        } else {
            this.renderWeekView(calendarContainer, currentPeriodSpan, transactions, schedules);
        }
    }

    renderMonthView(container, periodSpan, transactions, schedules) {
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();

        periodSpan.textContent = this.calendarDate.toLocaleDateString('id-ID', { 
            month: 'long', 
            year: 'numeric' 
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const firstDay = firstDayOfMonth.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let calendarHTML = `<div class="calendar-grid month-view">
            <div class="calendar-day-header">Min</div><div class="calendar-day-header">Sen</div>
            <div class="calendar-day-header">Sel</div><div class="calendar-day-header">Rab</div>
            <div class="calendar-day-header">Kam</div><div class="calendar-day-header">Jum</div>
            <div class="calendar-day-header">Sab</div>`;

        // Empty days
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += `<div class="calendar-day empty"></div>`;
        }

        const transactionsByDate = this.groupByDate(transactions);
        const schedulesByDate = this.groupByDate(schedules);

        // Days with content
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const today = new Date().toISOString().split('T')[0];
            const isToday = dateString === today;
            const isSelected = dateString === this.selectedDate;
            
            const dayTransactions = transactionsByDate[dateString] || [];
            const daySchedules = schedulesByDate[dateString] || [];
            
            const dayClass = [
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                daySchedules.length > 0 ? 'has-schedule' : ''
            ].filter(Boolean).join(' ');
            
            // Transaction indicators
            let transactionDots = dayTransactions.slice(0, 3).map(transaction => {
                const typeClass = transaction.type === 'income' ? 'income' : 'expense';
                return `<span class="transaction-dot ${typeClass}"></span>`;
            }).join('');
            
            if (dayTransactions.length > 3) {
                transactionDots += `<span class="transaction-dot more">+${dayTransactions.length - 3}</span>`;
            }

            // Schedule indicators
            let scheduleIndicators = '';
            if (daySchedules.length > 0) {
                const scheduleTypes = [...new Set(daySchedules.map(s => s.type))];
                scheduleIndicators = scheduleTypes.slice(0, 2).map(type => 
                    `<span class="schedule-indicator ${type}"></span>`
                ).join('');
                
                if (scheduleTypes.length > 2) {
                    scheduleIndicators += `<span class="schedule-indicator more">+</span>`;
                }
            }

            calendarHTML += `
                <div class="calendar-day ${dayClass}" data-date="${dateString}">
                    <div class="day-header">
                        <div class="day-number">${day}</div>
                        <div class="schedule-indicators">${scheduleIndicators}</div>
                    </div>
                    <div class="day-content">
                        <div class="day-transactions">${transactionDots}</div>
                        ${daySchedules.length > 0 ? 
                          `<div class="day-schedules-count">${daySchedules.length}📅</div>` : ''}
                    </div>
                </div>`;
        }

        calendarHTML += `</div>`;
        container.innerHTML = calendarHTML;
        
        this.attachDayEventListeners(container);
    }

    renderWeekView(container, periodSpan, transactions, schedules) {
        const startOfWeek = new Date(this.calendarDate);
        startOfWeek.setDate(this.calendarDate.getDate() - this.calendarDate.getDay());
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        periodSpan.textContent = 
            `${Utils.formatDateShort(startOfWeek.toISOString().split('T')[0])} - ${Utils.formatDateShort(endOfWeek.toISOString().split('T')[0])}`;

        let calendarHTML = `<div class="calendar-week-view">
            <div class="week-time-column">
                <div class="time-header">Waktu</div>`;
        
        // Time slots
        for (let hour = 0; hour < 24; hour++) {
            calendarHTML += `<div class="time-slot">${String(hour).padStart(2, '0')}:00</div>`;
        }
        
        calendarHTML += `</div>`;

        // Day columns
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            const dateString = currentDay.toISOString().split('T')[0];
            const isToday = dateString === new Date().toISOString().split('T')[0];
            const isSelected = dateString === this.selectedDate;
            
            const dayName = currentDay.toLocaleDateString('id-ID', { weekday: 'short' });
            const dayNumber = currentDay.getDate();
            
            const dayTransactions = transactions.filter(t => t.date === dateString);
            const daySchedules = schedules.filter(s => s.date === dateString);
            
            calendarHTML += `
                <div class="week-day-column ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}">
                    <div class="day-header" data-date="${dateString}">
                        <div class="day-name">${dayName}</div>
                        <div class="day-number">${dayNumber}</div>
                        ${daySchedules.length > 0 ? '<span class="schedule-badge">📅</span>' : ''}
                        ${dayTransactions.length > 0 ? '<span class="transaction-badge">💰</span>' : ''}
                    </div>
                    <div class="day-time-slots">`;
            
            for (let hour = 0; hour < 24; hour++) {
                const hourSchedules = daySchedules.filter(s => {
                    if (!s.startTime) return false;
                    const scheduleHour = parseInt(s.startTime.split(':')[0]);
                    return scheduleHour === hour;
                });
                
                calendarHTML += `<div class="time-slot" data-date="${dateString}" data-hour="${hour}">`;
                
                if (hourSchedules.length > 0) {
                    hourSchedules.forEach(schedule => {
                        calendarHTML += `
                            <div class="schedule-event ${schedule.type}" 
                                 data-schedule-id="${schedule.id}">
                                <span class="event-time">${schedule.startTime}</span>
                                <span class="event-title">${schedule.title}</span>
                            </div>`;
                    });
                }
                
                calendarHTML += `</div>`;
            }
            
            calendarHTML += `</div></div>`;
        }

        calendarHTML += `</div>`;
        container.innerHTML = calendarHTML;
        
        this.attachWeekViewEventListeners(container);
    }

    groupByDate(items) {
        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.date]) {
                grouped[item.date] = [];
            }
            grouped[item.date].push(item);
        });
        return grouped;
    }

    attachDayEventListeners(container) {
        container.querySelectorAll('.calendar-day[data-date]').forEach(dayElement => {
            dayElement.addEventListener('click', (e) => {
                const dateString = e.currentTarget.getAttribute('data-date');
                this.selectedDate = dateString;
                this.showDayDetail(dateString);
            });
        });
    }

    attachWeekViewEventListeners(container) {
        // Day headers
        container.querySelectorAll('.day-header[data-date]').forEach(header => {
            header.addEventListener('click', (e) => {
                const dateString = e.currentTarget.getAttribute('data-date');
                this.selectedDate = dateString;
                this.showDayDetail(dateString);
            });
        });

        // Time slots for adding schedules
        container.querySelectorAll('.time-slot[data-date]').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const dateString = e.currentTarget.getAttribute('data-date');
                const hour = e.currentTarget.getAttribute('data-hour');
                this.showAddScheduleForm(dateString, hour);
            });
        });

        // Schedule events
        container.querySelectorAll('.schedule-event').forEach(event => {
            event.addEventListener('click', (e) => {
                e.stopPropagation();
                const scheduleId = e.currentTarget.getAttribute('data-schedule-id');
                this.showScheduleDetail(scheduleId);
            });
        });
    }

    async showDayDetail(dateString) {
        const [allTransactions, allSchedules, wallets, categories] = await Promise.all([
            DB.getTransactions(),
            DB.getSchedules(),
            DB.getWallets(),
            DB.getCategories()
        ]);

        const transactions = allTransactions.filter(t => t.date === dateString);
        const schedules = allSchedules.filter(s => s.date === dateString);

        let content = `
            <div class="day-detail">
                <h4 style="margin-bottom: 20px; text-align: center; color: #333;">
                    ${Utils.formatDate(dateString)}
                </h4>`;

        // Transactions section
        if (transactions.length > 0) {
            content += `
                <div class="section">
                    <h5 style="margin-bottom: 10px; color: #555;">Transaksi (${transactions.length})</h5>
                    <div class="transaction-list" style="max-height: 200px; overflow-y: auto;">
                        ${transactions.map(transaction => {
                            const wallet = wallets.find(w => w.id === transaction.walletId);
                            const category = categories.find(c => c.id === transaction.categoryId);
                            const typeClass = transaction.type;
                            const amountPrefix = transaction.type === 'income' ? '+' : '-';

                            return `
                                <div class="transaction-item ${typeClass}" 
                                     onclick="window.app.showEditTransactionModal('${transaction.id}')"
                                     style="padding: 10px; border-radius: 8px; margin-bottom: 8px; cursor: pointer; border-left: 4px solid ${typeClass === 'income' ? '#10b981' : '#ef4444'}; background: #f8f9fa;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 500; color: #333;">${category?.emoji || '❔'} ${category?.name || 'Unknown'}</div>
                                            <div style="font-size: 12px; color: #666;">${wallet?.name || 'Unknown'}</div>
                                            ${transaction.notes ? `<div style="font-size: 11px; color: #888; margin-top: 2px;">${transaction.notes}</div>` : ''}
                                        </div>
                                        <div style="font-weight: bold; color: ${typeClass === 'income' ? '#10b981' : '#ef4444'};">
                                            ${amountPrefix}${Utils.formatCurrency(transaction.amount)}
                                        </div>
                                    </div>
                                </div>`;
                        }).join('')}
                    </div>
                </div>`;
        } else {
            content += `<p style="text-align: center; color: #666; margin: 20px 0;">Tidak ada transaksi</p>`;
        }

        // Schedules section
        if (schedules.length > 0) {
            content += `
                <div class="section" style="margin-top: 20px;">
                    <h5 style="margin-bottom: 10px; color: #555;">Jadwal (${schedules.length})</h5>
                    <div class="schedule-list" style="max-height: 200px; overflow-y: auto;">
                        ${schedules.map(schedule => `
                            <div class="schedule-item ${schedule.type}" 
                                 onclick="window.app.calendarModule.showScheduleDetail('${schedule.id}')"
                                 style="padding: 12px; border-radius: 8px; margin-bottom: 8px; cursor: pointer; border-left: 4px solid #3b82f6; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; color: #333;">${schedule.title}</div>
                                    <div style="font-size: 12px; color: #666;">
                                        ${this.formatScheduleTime(schedule)}
                                        ${schedule.description ? ` • ${schedule.description}` : ''}
                                    </div>
                                </div>
                                <div style="color: ${schedule.status === 'completed' ? '#10b981' : '#f59e0b'}; font-size: 18px;">
                                    ${schedule.status === 'completed' ? '✓' : '○'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        } else {
            content += `<p style="text-align: center; color: #666; margin: 20px 0;">Tidak ada jadwal</p>`;
        }

        // Actions
        content += `
            <div class="day-actions" style="margin-top: 25px; display: flex; gap: 10px; justify-content: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                <button class="btn btn-primary btn-sm" onclick="window.app.showAddTransactionModal('${dateString}')" style="padding: 8px 16px; border: none; border-radius: 6px; background: #3b82f6; color: white; cursor: pointer;">
                    + Transaksi
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.app.calendarModule.showAddScheduleForm('${dateString}')" style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; cursor: pointer;">
                    + Jadwal
                </button>
            </div>
        </div>`;

        Utils.createModal('dayDetailModal', `Detail ${Utils.formatDate(dateString)}`, content);
        Utils.openModal('dayDetailModal');
    }

    async showAddScheduleForm(prefillDate = null, prefillHour = null) {
        const categories = await DB.getCategories();
        const scheduleTypes = [
            { value: 'meeting', label: 'Meeting' },
            { value: 'reminder', label: 'Reminder' },
            { value: 'task', label: 'Task' },
            { value: 'event', label: 'Event' },
            { value: 'appointment', label: 'Appointment' }
        ];
        
        let defaultDate = prefillDate || this.selectedDate || new Date().toISOString().split('T')[0];
        let defaultTime = '09:00';
        
        if (prefillHour !== null) {
            defaultTime = `${String(prefillHour).padStart(2, '0')}:00`;
        }

        const content = `
            <form id="addScheduleForm">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Judul Jadwal *</label>
                    <input type="text" id="scheduleTitle" required 
                           placeholder="Masukkan judul jadwal" 
                           style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Deskripsi</label>
                    <textarea id="scheduleDescription" 
                             placeholder="Deskripsi jadwal (opsional)"
                             style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; min-height: 60px; resize: vertical;"></textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tanggal *</label>
                        <input type="date" id="scheduleDate" value="${defaultDate}" required
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tipe Jadwal</label>
                        <select id="scheduleType" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                            ${scheduleTypes.map(type => 
                                `<option value="${type.value}">${type.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Waktu Mulai</label>
                        <input type="time" id="scheduleStartTime" value="${defaultTime}"
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Waktu Selesai</label>
                        <input type="time" id="scheduleEndTime" value="${defaultTime}"
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Kategori</label>
                    <select id="scheduleCategory" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <option value="">Pilih Kategori (opsional)</option>
                        ${categories.map(cat => 
                            `<option value="${cat.id}">${cat.emoji} ${cat.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="scheduleRecurring">
                        <span>Jadwal berulang</span>
                    </label>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    <button type="button" class="btn btn-secondary" 
                            onclick="Utils.closeModal('addScheduleModal')"
                            style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; cursor: pointer;">
                        Batal
                    </button>
                    <button type="submit" class="btn btn-primary"
                            style="padding: 8px 16px; border: none; border-radius: 6px; background: #3b82f6; color: white; cursor: pointer;">
                        Simpan Jadwal
                    </button>
                </div>
            </form>
        `;

        Utils.createModal('addScheduleModal', 'Tambah Jadwal Baru', content);
        
        document.getElementById('addScheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveNewSchedule();
        });
        
        Utils.openModal('addScheduleModal');
    }

    async saveNewSchedule() {
        try {
            const formData = {
                title: document.getElementById('scheduleTitle').value.trim(),
                description: document.getElementById('scheduleDescription').value.trim(),
                date: document.getElementById('scheduleDate').value,
                type: document.getElementById('scheduleType').value,
                startTime: document.getElementById('scheduleStartTime').value,
                endTime: document.getElementById('scheduleEndTime').value,
                categoryId: document.getElementById('scheduleCategory').value || null,
                isRecurring: document.getElementById('scheduleRecurring').checked,
                status: 'pending'
            };

            if (!formData.title) {
                Utils.showToast('Judul jadwal harus diisi', 'error');
                return;
            }

            if (!formData.date) {
                Utils.showToast('Tanggal harus diisi', 'error');
                return;
            }

            if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
                Utils.showToast('Waktu selesai harus setelah waktu mulai', 'error');
                return;
            }

            await DB.addSchedule(formData);
            Utils.showToast('Jadwal berhasil ditambahkan', 'success');
            Utils.closeModal('addScheduleModal');
            await this.renderCalendarView();

        } catch (error) {
            console.error('Error saving schedule:', error);
            Utils.showToast('Gagal menyimpan jadwal: ' + error.message, 'error');
        }
    }

    async showScheduleDetail(scheduleId) {
        const schedule = await DB.getSchedule(scheduleId);
        if (!schedule) {
            Utils.showToast('Jadwal tidak ditemukan', 'error');
            return;
        }

        const categoryName = await this.getCategoryName(schedule.categoryId);

        const content = `
            <div class="schedule-detail">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                    <h4 style="margin: 0; flex: 1;">${schedule.title}</h4>
                    <span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                        ${this.capitalizeFirstLetter(schedule.type)}
                    </span>
                </div>
                
                <div style="display: grid; gap: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Tanggal:</span>
                        <span>${Utils.formatDate(schedule.date)}</span>
                    </div>
                    
                    ${schedule.startTime ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Waktu:</span>
                        <span>${schedule.startTime} - ${schedule.endTime || 'Selesai'}</span>
                    </div>` : ''}
                    
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Status:</span>
                        <span style="color: ${schedule.status === 'completed' ? '#10b981' : schedule.status === 'cancelled' ? '#ef4444' : '#f59e0b'};">
                            ${this.capitalizeFirstLetter(schedule.status)}
                        </span>
                    </div>
                    
                    ${categoryName !== 'Unknown' ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Kategori:</span>
                        <span>${categoryName}</span>
                    </div>` : ''}
                    
                    ${schedule.description ? `
                    <div>
                        <div style="font-weight: 500; color: #666; margin-bottom: 5px;">Deskripsi:</div>
                        <p style="margin: 0; background: #f8f9fa; padding: 10px; border-radius: 6px;">${schedule.description}</p>
                    </div>` : ''}
                    
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500; color: #666;">Dibuat:</span>
                        <span>${this.formatDateTime(schedule.createdAt)}</span>
                    </div>
                </div>
                
                <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    <button class="btn btn-primary btn-sm" onclick="window.app.calendarModule.editSchedule('${schedule.id}')"
                            style="padding: 8px 16px; border: none; border-radius: 6px; background: #3b82f6; color: white; cursor: pointer;">
                        Edit
                    </button>
                    <button class="btn btn-success btn-sm" onclick="window.app.calendarModule.toggleScheduleStatus('${schedule.id}')"
                            style="padding: 8px 16px; border: none; border-radius: 6px; background: #10b981; color: white; cursor: pointer;">
                        ${schedule.status === 'completed' ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="window.app.calendarModule.deleteSchedule('${schedule.id}')"
                            style="padding: 8px 16px; border: none; border-radius: 6px; background: #ef4444; color: white; cursor: pointer;">
                        Hapus
                    </button>
                </div>
            </div>
        `;

        Utils.createModal('scheduleDetailModal', 'Detail Jadwal', content);
        Utils.openModal('scheduleDetailModal');
    }

    async editSchedule(scheduleId) {
        const schedule = await DB.getSchedule(scheduleId);
        if (!schedule) {
            Utils.showToast('Jadwal tidak ditemukan', 'error');
            return;
        }

        Utils.closeModal('scheduleDetailModal');
        this.showEditScheduleForm(schedule);
    }

    async showEditScheduleForm(schedule) {
        const categories = await DB.getCategories();
        const scheduleTypes = [
            { value: 'meeting', label: 'Meeting' },
            { value: 'reminder', label: 'Reminder' },
            { value: 'task', label: 'Task' },
            { value: 'event', label: 'Event' },
            { value: 'appointment', label: 'Appointment' }
        ];

        const content = `
            <form id="editScheduleForm">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Judul Jadwal *</label>
                    <input type="text" id="editScheduleTitle" required 
                           value="${schedule.title}"
                           style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Deskripsi</label>
                    <textarea id="editScheduleDescription"
                             style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; min-height: 60px; resize: vertical;">${schedule.description || ''}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tanggal *</label>
                        <input type="date" id="editScheduleDate" value="${schedule.date}" required
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tipe Jadwal</label>
                        <select id="editScheduleType" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                            ${scheduleTypes.map(type => 
                                `<option value="${type.value}" ${schedule.type === type.value ? 'selected' : ''}>${type.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Waktu Mulai</label>
                        <input type="time" id="editScheduleStartTime" value="${schedule.startTime || ''}"
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Waktu Selesai</label>
                        <input type="time" id="editScheduleEndTime" value="${schedule.endTime || ''}"
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Kategori</label>
                    <select id="editScheduleCategory" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                        <option value="">Pilih Kategori (opsional)</option>
                        ${categories.map(cat => 
                            `<option value="${cat.id}" ${schedule.categoryId === cat.id ? 'selected' : ''}>${cat.emoji} ${cat.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Status</label>
                        <select id="editScheduleStatus" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="pending" ${schedule.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="completed" ${schedule.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${schedule.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; align-items: end;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="editScheduleRecurring" ${schedule.isRecurring ? 'checked' : ''}>
                            <span>Jadwal berulang</span>
                        </label>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    <button type="button" class="btn btn-secondary" 
                            onclick="Utils.closeModal('editScheduleModal')"
                            style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; color: #374151; cursor: pointer;">
                        Batal
                    </button>
                    <button type="submit" class="btn btn-primary"
                            style="padding: 8px 16px; border: none; border-radius: 6px; background: #3b82f6; color: white; cursor: pointer;">
                        Update Jadwal
                    </button>
                </div>
            </form>
        `;

        Utils.createModal('editScheduleModal', 'Edit Jadwal', content);
        
        document.getElementById('editScheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateSchedule(schedule.id);
        });
        
        Utils.openModal('editScheduleModal');
    }

    async updateSchedule(scheduleId) {
        try {
            const formData = {
                title: document.getElementById('editScheduleTitle').value.trim(),
                description: document.getElementById('editScheduleDescription').value.trim(),
                date: document.getElementById('editScheduleDate').value,
                type: document.getElementById('editScheduleType').value,
                startTime: document.getElementById('editScheduleStartTime').value,
                endTime: document.getElementById('editScheduleEndTime').value,
                categoryId: document.getElementById('editScheduleCategory').value || null,
                isRecurring: document.getElementById('editScheduleRecurring').checked,
                status: document.getElementById('editScheduleStatus').value
            };

            if (!formData.title) {
                Utils.showToast('Judul jadwal harus diisi', 'error');
                return;
            }

            if (!formData.date) {
                Utils.showToast('Tanggal harus diisi', 'error');
                return;
            }

            await DB.updateSchedule(scheduleId, formData);
            Utils.showToast('Jadwal berhasil diupdate', 'success');
            Utils.closeModal('editScheduleModal');
            await this.renderCalendarView();

        } catch (error) {
            console.error('Error updating schedule:', error);
            Utils.showToast('Gagal mengupdate jadwal: ' + error.message, 'error');
        }
    }

    async toggleScheduleStatus(scheduleId) {
        try {
            const schedule = await DB.getSchedule(scheduleId);
            if (!schedule) {
                Utils.showToast('Jadwal tidak ditemukan', 'error');
                return;
            }

            const newStatus = schedule.status === 'completed' ? 'pending' : 'completed';
            await DB.updateSchedule(scheduleId, { status: newStatus });
            
            Utils.showToast(`Jadwal ditandai sebagai ${newStatus}`, 'success');
            Utils.closeModal('scheduleDetailModal');
            await this.renderCalendarView();

        } catch (error) {
            console.error('Error toggling schedule status:', error);
            Utils.showToast('Gagal mengubah status jadwal', 'error');
        }
    }

    async deleteSchedule(scheduleId) {
        if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            return;
        }

        try {
            await DB.deleteSchedule(scheduleId);
            Utils.showToast('Jadwal berhasil dihapus', 'success');
            Utils.closeModal('scheduleDetailModal');
            await this.renderCalendarView();

        } catch (error) {
            console.error('Error deleting schedule:', error);
            Utils.showToast('Gagal menghapus jadwal', 'error');
        }
    }

    async getCategoryName(categoryId) {
        if (!categoryId) return 'Unknown';
        try {
            const category = await DB.getCategoryById(categoryId);
            return category ? `${category.emoji} ${category.name}` : 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }

    capitalizeFirstLetter(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
    }

    formatScheduleTime(schedule) {
        if (schedule.startTime && schedule.endTime) {
            return `${schedule.startTime} - ${schedule.endTime}`;
        } else if (schedule.startTime) {
            return schedule.startTime;
        } else {
            return 'Sepanjang hari';
        }
    }

    formatDateTime(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }
}
