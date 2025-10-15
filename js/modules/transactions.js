// js/modules/transactions.js (Versi Final yang Diperbaiki)
import { DB } from '../database.js';
import { Utils } from '../utils.js';

export class TransactionsModule {
    constructor(app) {
        this.app = app;
    }

    async render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🔍 Semua Transaksi</h3>
                    <div class="data-management">
                        <button class="btn btn-warning" id="exportCsvBtn">
                            <span>📤</span> Export CSV
                        </button>
                        <button class="btn btn-info" id="backupBtn">
                            <span>💾</span> Backup
                        </button>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <div class="tab-grid tab-grid-2">
                        <div>
                            <label class="form-label">Filter by Wallet:</label>
                            <select id="filterWallet" class="form-control">
                                <option value="">Semua Wallet</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Filter by Kategori:</label>
                            <select id="filterCategory" class="form-control">
                                <option value="">Semua Kategori</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Dari Tanggal:</label>
                            <input type="date" id="filterDateFrom" class="form-control">
                        </div>
                        <div>
                            <label class="form-label">Sampai Tanggal:</label>
                            <input type="date" id="filterDateTo" class="form-control">
                        </div>
                    </div>
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <button class="btn btn-primary" id="applyFiltersBtn">Terapkan Filter</button>
                        <button class="btn btn-outline" id="resetFiltersBtn">Reset Filter</button>
                    </div>
                </div>
                
                <div id="allTransactions"></div>
            </div>
        `;
        
        await this.populateFilterOptions();
        await this.renderAllTransactions();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filter listeners
        document.getElementById('applyFiltersBtn')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('resetFiltersBtn')?.addEventListener('click', () => this.resetFilters());
        
        // Export & Backup listeners
        document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportToCSV());
        document.getElementById('backupBtn')?.addEventListener('click', () => this.downloadBackup());

        // Enter key support for date filters
        document.getElementById('filterDateFrom')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
        document.getElementById('filterDateTo')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
    }

    async downloadBackup() {
        try {
            await DB.backupData();
            Utils.showToast('Backup berhasil didownload!', 'success');
        } catch (error) {
            console.error('Backup error:', error);
            Utils.showToast('Gagal membuat backup', 'error');
        }
    }

    async populateFilterOptions() {
        const [wallets, categories] = await Promise.all([
            DB.getWallets(),
            DB.getCategories()
        ]);
        
        const walletSelect = document.getElementById('filterWallet');
        const categorySelect = document.getElementById('filterCategory');
        
        if (walletSelect) {
            walletSelect.innerHTML = '<option value="">Semua Wallet</option>' +
                wallets.map(w => `<option value="${w.id}">${w.emoji} ${w.name}</option>`).join('');
        }
            
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Semua Kategori</option>' +
                categories.map(c => `<option value="${c.id}">${c.emoji} ${c.name} (${c.type})</option>`).join('');
        }
            
        // Set default date range (30 hari terakhir)
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);
        
        const filterDateFrom = document.getElementById('filterDateFrom');
        const filterDateTo = document.getElementById('filterDateTo');

        if (filterDateFrom) filterDateFrom.value = dateFrom.toISOString().split('T')[0];
        if (filterDateTo) filterDateTo.value = dateTo.toISOString().split('T')[0];
    }

    applyFilters() {
        this.renderAllTransactions();
    }

    resetFilters() {
        document.getElementById('filterWallet').value = '';
        document.getElementById('filterCategory').value = '';
        
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);
        
        document.getElementById('filterDateFrom').value = dateFrom.toISOString().split('T')[0];
        document.getElementById('filterDateTo').value = dateTo.toISOString().split('T')[0];
        
        this.renderAllTransactions();
    }

    async renderAllTransactions() {
        const container = document.getElementById('allTransactions');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="emoji">⏳</div>
                <p>Memuat transaksi...</p>
            </div>
        `;

        const walletFilter = document.getElementById('filterWallet')?.value;
        const categoryFilter = document.getElementById('filterCategory')?.value;
        const dateFrom = document.getElementById('filterDateFrom')?.value;
        const dateTo = document.getElementById('filterDateTo')?.value;
        
        const [transactions, wallets, categories] = await Promise.all([
            DB.getTransactions(),
            DB.getWallets(),
            DB.getCategories()
        ]);
        
        let filteredTransactions = transactions.filter(t => {
            if (walletFilter && t.walletId !== walletFilter) return false;
            if (categoryFilter && t.categoryId !== categoryFilter) return false;
            if (dateFrom && t.date < dateFrom) return false;
            if (dateTo && t.date > dateTo) return false;
            return true;
        });
        
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">🤷‍♀️</div>
                    <p>Tidak ada transaksi yang cocok dengan filter Anda.</p>
                    <button class="btn btn-primary" id="addFirstTransactionBtn" style="margin-top: 10px;">
                        + Tambah Transaksi Pertama
                    </button>
                </div>
            `;
            document.getElementById('addFirstTransactionBtn')?.addEventListener('click', () => this.app.showAddTransactionModal());
            return;
        }

        const totalIncome = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const netBalance = totalIncome - totalExpense;

        container.innerHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: var(--light-color); border-radius: var(--border-radius-sm);">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                    <div>
                        <div style="font-size: 12px; color: #666;">Total Transaksi</div>
                        <div style="font-weight: bold;">${filteredTransactions.length}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">Pemasukan</div>
                        <div style="font-weight: bold; color: var(--success-color);">${Utils.formatCurrency(totalIncome)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">Pengeluaran</div>
                        <div style="font-weight: bold; color: var(--danger-color);">${Utils.formatCurrency(totalExpense)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">Saldo Bersih</div>
                        <div style="font-weight: bold; color: ${netBalance >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">${Utils.formatCurrency(netBalance)}</div>
                    </div>
                </div>
            </div>
            ${filteredTransactions.map(transaction => {
                const wallet = wallets.find(w => w.id === transaction.walletId);
                const category = categories.find(c => c.id === transaction.categoryId);
                const typeClass = transaction.type;
                const amountPrefix = transaction.type === 'income' ? '+' : 
                                   transaction.type === 'expense' ? '-' : '';

                return `
                    <div class="transaction-item ${typeClass}" data-transaction-id="${transaction.id}">
                        <div class="transaction-info">
                            <div class="transaction-category">${category?.emoji || ''} ${category?.name || 'Unknown'}</div>
                            <div class="transaction-wallet">${wallet?.name || 'Unknown'} • ${Utils.formatDateShort(transaction.date)}</div>
                            ${transaction.notes ? `<div class="transaction-notes">${transaction.notes}</div>` : ''}
                        </div>
                        <div class="transaction-amount ${typeClass}">
                            ${amountPrefix}${Utils.formatCurrency(transaction.amount)}
                        </div>
                    </div>
                `;
            }).join('')}
        `;

        // Add click listeners to transaction items
        container.querySelectorAll('.transaction-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const transactionId = e.currentTarget.getAttribute('data-transaction-id');
                this.app.showEditTransactionModal(transactionId);
            });
        });
    }

    async exportToCSV() {
        try {
            const walletFilter = document.getElementById('filterWallet')?.value;
            const categoryFilter = document.getElementById('filterCategory')?.value;
            const dateFrom = document.getElementById('filterDateFrom')?.value;
            const dateTo = document.getElementById('filterDateTo')?.value;
            
            const [allTransactions, wallets, categories] = await Promise.all([
                DB.getTransactions(),
                DB.getWallets(),
                DB.getCategories()
            ]);

            let transactionsToExport = allTransactions.filter(t => {
                if (walletFilter && t.walletId !== walletFilter) return false;
                if (categoryFilter && t.categoryId !== categoryFilter) return false;
                if (dateFrom && t.date < dateFrom) return false;
                if (dateTo && t.date > dateTo) return false;
                return true;
            });

            transactionsToExport.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (transactionsToExport.length === 0) {
                Utils.showToast('Tidak ada data untuk diexport', 'warning');
                return;
            }

            let csvContent = "Tanggal,Tipe,Kategori,Dompet,Jumlah,Catatan\n";
            
            transactionsToExport.forEach(transaction => {
                const wallet = wallets.find(w => w.id === transaction.walletId);
                const category = categories.find(c => c.id === transaction.categoryId);
                
                const row = [
                    transaction.date,
                    transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                    `"${category?.name || 'Unknown'}"`,
                    `"${wallet?.name || 'Unknown'}"`,
                    transaction.amount,
                    `"${transaction.notes || ''}"`
                ];
                
                csvContent += row.join(',') + '\n';
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `transaksi_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Utils.showToast(`Data berhasil diexport (${transactionsToExport.length} transaksi)!`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            Utils.showToast('Gagal mengexport data: ' + error.message, 'error');
        }
    }
}
