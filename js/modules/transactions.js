// js/modules/transactions.js (VERSI DIPERBAIKI)
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
                        <button class="btn btn-primary" id="addTransactionBtn">
                            <span>➕</span> Tambah Transaksi
                        </button>
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
        
        // ADD TRANSACTION BUTTON - YANG INI YANG PENTING!
        document.getElementById('addTransactionBtn')?.addEventListener('click', () => this.showAddTransactionModal());

        // Enter key support for date filters
        document.getElementById('filterDateFrom')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
        document.getElementById('filterDateTo')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
    }

    // 🆕 METHOD BARU: MODAL TAMBAH TRANSAKSI
    async showAddTransactionModal() {
        const [wallets, categories] = await Promise.all([
            DB.getWallets(),
            DB.getCategories()
        ]);

        const content = `
            <form id="addTransactionForm">
                <div class="form-group">
                    <label>Tipe Transaksi</label>
                    <select id="transactionType" class="form-control" required>
                        <option value="">Pilih Tipe</option>
                        <option value="income">💰 Pemasukan</option>
                        <option value="expense">💸 Pengeluaran</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Jumlah</label>
                    <input type="number" id="transactionAmount" class="form-control" 
                           placeholder="Masukkan jumlah" required min="1">
                </div>
                
                <div class="form-group">
                    <label>Kategori</label>
                    <select id="transactionCategory" class="form-control" required>
                        <option value="">Pilih Kategori</option>
                        ${categories.map(cat => 
                            `<option value="${cat.id}" data-type="${cat.type}">${cat.emoji} ${cat.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Dompet</label>
                    <select id="transactionWallet" class="form-control" required>
                        <option value="">Pilih Dompet</option>
                        ${wallets.map(wallet => 
                            `<option value="${wallet.id}">${wallet.emoji} ${wallet.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" id="transactionDate" class="form-control" 
                           value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <div class="form-group">
                    <label>Catatan (Opsional)</label>
                    <textarea id="transactionNotes" class="form-control" 
                              placeholder="Tambahkan catatan..." rows="3"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        💾 Simpan Transaksi
                    </button>
                    <button type="button" class="btn btn-outline" onclick="Utils.closeModal('addTransactionModal')">
                        Batal
                    </button>
                </div>
            </form>
        `;

        Utils.createModal('addTransactionModal', '➕ Tambah Transaksi Baru', content);
        Utils.openModal('addTransactionModal');
        
        this.setupTransactionForm();
        this.setupCategoryFilter();
    }

    // 🆕 METHOD BARU: FILTER KATEGORI BERDASARKAN TIPE
    setupCategoryFilter() {
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('transactionCategory');
        
        if (!typeSelect || !categorySelect) return;
        
        typeSelect.addEventListener('change', () => {
            const selectedType = typeSelect.value;
            const options = categorySelect.querySelectorAll('option');
            
            options.forEach(option => {
                if (option.value === '') return; // Keep "Pilih Kategori"
                
                const optionType = option.dataset.type;
                if (selectedType === optionType) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            });
            
            // Reset selection
            categorySelect.value = '';
        });
    }

    // 🆕 METHOD BARU: SETUP FORM TRANSAKSI
    setupTransactionForm() {
        const form = document.getElementById('addTransactionForm');
        if (!form) return;

        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const transactionData = {
                type: document.getElementById('transactionType').value,
                amount: parseInt(document.getElementById('transactionAmount').value),
                categoryId: document.getElementById('transactionCategory').value,
                walletId: document.getElementById('transactionWallet').value,
                date: document.getElementById('transactionDate').value,
                notes: document.getElementById('transactionNotes').value,
                id: DB.generateId(),
                createdAt: new Date().toISOString()
            };

            // Validasi
            if (!this.validateTransaction(transactionData)) return;

            try {
                // Simpan transaksi
                const transactions = await DB.getTransactions();
                transactions.push(transactionData);
                await DB.saveTransactions(transactions);

                // Update wallet balance
                await this.updateWalletBalance(transactionData);

                Utils.closeModal('addTransactionModal');
                Utils.showToast('✅ Transaksi berhasil ditambahkan!', 'success');
                
                // Refresh tampilan transaksi
                await this.renderAllTransactions();
                
            } catch (error) {
                console.error('Error saving transaction:', error);
                Utils.showToast('❌ Gagal menyimpan transaksi', 'error');
            }
        };
    }

    // 🆕 METHOD BARU: VALIDASI TRANSAKSI
    validateTransaction(data) {
        if (!data.type) {
            Utils.showToast('Pilih tipe transaksi terlebih dahulu', 'error');
            return false;
        }
        if (data.amount <= 0) {
            Utils.showToast('Jumlah harus lebih dari 0', 'error');
            return false;
        }
        if (!data.categoryId) {
            Utils.showToast('Pilih kategori terlebih dahulu', 'error');
            return false;
        }
        if (!data.walletId) {
            Utils.showToast('Pilih dompet terlebih dahulu', 'error');
            return false;
        }
        return true;
    }

    // 🆕 METHOD BARU: UPDATE SALDO DOMPET
    async updateWalletBalance(transaction) {
        const wallets = await DB.getWallets();
        const wallet = wallets.find(w => w.id === transaction.walletId);
        
        if (wallet) {
            if (transaction.type === 'income') {
                wallet.balance += transaction.amount;
            } else {
                wallet.balance -= transaction.amount;
            }
            
            await DB.saveWallets(wallets);
        }
    }

    // 🆕 METHOD BARU: MODAL EDIT TRANSAKSI
    async showEditTransactionModal(transactionId) {
        const [transactions, wallets, categories] = await Promise.all([
            DB.getTransactions(),
            DB.getWallets(),
            DB.getCategories()
        ]);

        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) {
            Utils.showToast('Transaksi tidak ditemukan', 'error');
            return;
        }

        const content = `
            <form id="editTransactionForm">
                <div class="form-group">
                    <label>Tipe Transaksi</label>
                    <select id="editTransactionType" class="form-control" required>
                        <option value="income" ${transaction.type === 'income' ? 'selected' : ''}>💰 Pemasukan</option>
                        <option value="expense" ${transaction.type === 'expense' ? 'selected' : ''}>💸 Pengeluaran</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Jumlah</label>
                    <input type="number" id="editTransactionAmount" class="form-control" 
                           value="${transaction.amount}" required min="1">
                </div>
                
                <div class="form-group">
                    <label>Kategori</label>
                    <select id="editTransactionCategory" class="form-control" required>
                        ${categories.map(cat => 
                            `<option value="${cat.id}" data-type="${cat.type}" 
                             ${transaction.categoryId === cat.id ? 'selected' : ''}>
                                ${cat.emoji} ${cat.name}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Dompet</label>
                    <select id="editTransactionWallet" class="form-control" required>
                        ${wallets.map(wallet => 
                            `<option value="${wallet.id}" 
                             ${transaction.walletId === wallet.id ? 'selected' : ''}>
                                ${wallet.emoji} ${wallet.name}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" id="editTransactionDate" class="form-control" 
                           value="${transaction.date}" required>
                </div>
                
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea id="editTransactionNotes" class="form-control" 
                              rows="3">${transaction.notes || ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        💾 Update Transaksi
                    </button>
                    <button type="button" class="btn btn-danger" onclick="window.app.modules.transactions.deleteTransaction('${transaction.id}')">
                        🗑️ Hapus
                    </button>
                    <button type="button" class="btn btn-outline" onclick="Utils.closeModal('editTransactionModal')">
                        Batal
                    </button>
                </div>
            </form>
        `;

        Utils.createModal('editTransactionModal', '✏️ Edit Transaksi', content);
        Utils.openModal('editTransactionModal');
        
        this.setupEditTransactionForm(transaction);
    }

    // 🆕 METHOD BARU: SETUP FORM EDIT
    setupEditTransactionForm(originalTransaction) {
        const form = document.getElementById('editTransactionForm');
        if (!form) return;

        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const updatedData = {
                ...originalTransaction,
                type: document.getElementById('editTransactionType').value,
                amount: parseInt(document.getElementById('editTransactionAmount').value),
                categoryId: document.getElementById('editTransactionCategory').value,
                walletId: document.getElementById('editTransactionWallet').value,
                date: document.getElementById('editTransactionDate').value,
                notes: document.getElementById('editTransactionNotes').value
            };

            if (!this.validateTransaction(updatedData)) return;

            try {
                // Update transaction
                const transactions = await DB.getTransactions();
                const index = transactions.findIndex(t => t.id === originalTransaction.id);
                transactions[index] = updatedData;
                await DB.saveTransactions(transactions);

                // Update wallet balance if amount or type changed
                if (originalTransaction.amount !== updatedData.amount || 
                    originalTransaction.type !== updatedData.type ||
                    originalTransaction.walletId !== updatedData.walletId) {
                    await this.recalculateWalletBalances();
                }

                Utils.closeModal('editTransactionModal');
                Utils.showToast('✅ Transaksi berhasil diupdate!', 'success');
                await this.renderAllTransactions();
                
            } catch (error) {
                console.error('Error updating transaction:', error);
                Utils.showToast('❌ Gagal mengupdate transaksi', 'error');
            }
        };
    }

    // 🆕 METHOD BARU: HAPUS TRANSAKSI
    async deleteTransaction(transactionId) {
        if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

        try {
            const transactions = await DB.getTransactions();
            const updatedTransactions = transactions.filter(t => t.id !== transactionId);
            await DB.saveTransactions(updatedTransactions);
            
            // Recalculate all wallet balances
            await this.recalculateWalletBalances();
            
            Utils.closeModal('editTransactionModal');
            Utils.showToast('✅ Transaksi berhasil dihapus!', 'success');
            await this.renderAllTransactions();
            
        } catch (error) {
            console.error('Error deleting transaction:', error);
            Utils.showToast('❌ Gagal menghapus transaksi', 'error');
        }
    }

    // 🆕 METHOD BARU: RECALCULATE SALDO
    async recalculateWalletBalances() {
        const [transactions, wallets] = await Promise.all([
            DB.getTransactions(),
            DB.getWallets()
        ]);

        // Reset all wallet balances to 0
        wallets.forEach(wallet => wallet.balance = 0);

        // Recalculate based on transactions
        transactions.forEach(transaction => {
            const wallet = wallets.find(w => w.id === transaction.walletId);
            if (wallet) {
                if (transaction.type === 'income') {
                    wallet.balance += transaction.amount;
                } else {
                    wallet.balance -= transaction.amount;
                }
            }
        });

        await DB.saveWallets(wallets);
    }

    // 🎯 METHOD YANG SUDAH ADA (TETAP DIKEEP)
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
            document.getElementById('addFirstTransactionBtn')?.addEventListener('click', () => this.showAddTransactionModal());
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

        // 🆕 UPDATE: Add click listeners untuk edit transaksi
        container.querySelectorAll('.transaction-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const transactionId = e.currentTarget.getAttribute('data-transaction-id');
                this.showEditTransactionModal(transactionId);
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
