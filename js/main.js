// js/main.js - Finance App with Pizza Wheel Navigation

class FinanceApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.QUICK_NOTE_KEY = 'quickNoteContent';
        this.isPizzaOpen = false;
        this.init();
    }

    init() {
        this.setupApp();
        this.setupEventListeners();
        this.setupTabPalette();
        this.setupPizzaWheel();
        this.loadQuickNote();
    }

    setupApp() {
        console.log('🚀 Finance Orbital Pizza Wheel Navigation Started');
    }

    setupPizzaWheel() {
        const pizzaToggleBtn = document.getElementById('pizzaToggleBtn');
        const pizzaCloseBtn = document.getElementById('pizzaCloseBtn');
        const pizzaBackdrop = document.getElementById('pizzaBackdrop');
        const pizzaSlices = document.querySelectorAll('.pizza-slice');

        // Toggle pizza wheel
        pizzaToggleBtn.addEventListener('click', () => {
            this.togglePizzaWheel(true);
        });

        pizzaCloseBtn.addEventListener('click', () => {
            this.togglePizzaWheel(false);
        });

        pizzaBackdrop.addEventListener('click', () => {
            this.togglePizzaWheel(false);
        });

        // Pizza slice clicks
        pizzaSlices.forEach(slice => {
            slice.addEventListener('click', (e) => {
                e.stopPropagation();
                const tabName = slice.dataset.tab;
                
                // Update active state
                pizzaSlices.forEach(s => s.classList.remove('active'));
                slice.classList.add('active');
                
                this.switchTab(tabName);
                this.togglePizzaWheel(false);
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPizzaOpen) {
                this.togglePizzaWheel(false);
            }
        });

        // Set initial active slice
        this.updatePizzaActiveState();
    }

    togglePizzaWheel(open) {
        const pizzaClosed = document.getElementById('pizzaClosed');
        const pizzaWheel = document.getElementById('pizzaWheel');
        const pizzaToggleBtn = document.getElementById('pizzaToggleBtn');

        this.isPizzaOpen = open;

        if (open) {
            pizzaClosed.classList.add('hidden');
            pizzaWheel.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Animate arrow
            pizzaToggleBtn.querySelector('.pizza-arrow').style.transform = 'rotate(180deg)';
        } else {
            pizzaClosed.classList.remove('hidden');
            pizzaWheel.classList.add('hidden');
            document.body.style.overflow = '';
            
            // Reset arrow
            pizzaToggleBtn.querySelector('.pizza-arrow').style.transform = 'rotate(0deg)';
        }
    }

    updatePizzaActiveState() {
        const pizzaSlices = document.querySelectorAll('.pizza-slice');
        pizzaSlices.forEach(slice => {
            slice.classList.toggle('active', slice.dataset.tab === this.currentTab);
        });
    }

    setupTabPalette() {
        const tabs = document.querySelectorAll('.tab-palette');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    setupEventListeners() {
        // Quick actions
        document.getElementById('quickNoteBtn')?.addEventListener('click', () => this.toggleQuickNotePopup());
        document.getElementById('addTransactionBtn')?.addEventListener('click', () => this.showAddTransactionModal());
        document.getElementById('transferBtn')?.addEventListener('click', () => this.showTransferModal());
        
        // Quick note buttons
        document.getElementById('saveQuickNoteBtn')?.addEventListener('click', () => this.saveQuickNote());
        document.getElementById('clearQuickNoteBtn')?.addEventListener('click', () => this.clearQuickNote());
    }

    async switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update both regular and pizza active states
        document.querySelectorAll('.tab-palette').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        this.updatePizzaActiveState();
        await this.renderTabContent(tabName);
    }

    async renderTabContent(tabName) {
        const tabContent = document.getElementById('tabContent');
        if (!tabContent) return;
        
        // Show loading
        tabContent.innerHTML = `
            <div class="card">
                <div style="text-align: center; padding: 40px;">
                    <div style="width: 40px; height: 40px; border: 4px solid var(--light-color); border-top: 4px solid var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 15px; color: var(--muted-color);">Memuat ${tabName}...</p>
                </div>
            </div>
        `;

        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            let content = '';
            switch(tabName) {
                case 'dashboard': content = this.renderDashboard(); break;
                case 'transactions': content = this.renderTransactions(); break;
                case 'financial-planning': content = this.renderFinancialPlanning(); break;
                case 'reports': content = this.renderReports(); break;
                case 'calendar': content = this.renderCalendar(); break;
                case 'gold': content = this.renderGold(); break;
                case 'settings-personalization': content = this.renderSettings(); break;
                default: content = this.renderDefault();
            }
            
            tabContent.innerHTML = content;
            
        } catch (error) {
            console.error(`Error rendering ${tabName}:`, error);
            tabContent.innerHTML = this.renderError(tabName);
        }
    }

    renderDashboard() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🏠 Dashboard</h2>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px;">
                            <h3 style="margin: 0 0 10px 0; font-size: 1rem;">Total Balance</h3>
                            <div style="font-size: 1.8rem; font-weight: bold;">Rp 14.007.437,5</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px;">
                            <h3 style="margin: 0 0 10px 0; font-size: 1rem;">Monthly Income</h3>
                            <div style="font-size: 1.8rem; font-weight: bold;">Rp 8.500.000</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px;">
                            <h3 style="margin: 0 0 10px 0; font-size: 1rem;">Monthly Expense</h3>
                            <div style="font-size: 1.8rem; font-weight: bold;">Rp 5.200.000</div>
                        </div>
                    </div>
                    
                    <h3 style="margin-bottom: 1rem;">Recent Transactions</h3>
                    <div style="background: var(--light-color); padding: 1rem; border-radius: 8px;">
                        <p style="text-align: center; color: var(--muted-color);">No recent transactions</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderTransactions() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🔍 Transaksi</h2>
                    <button class="btn btn-primary" onclick="window.app.showAddTransactionModal()">
                        ➕ Tambah Transaksi
                    </button>
                </div>
                <div class="card-body">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">💸</div>
                        <h3>Kelola Transaksi Keuangan</h3>
                        <p style="color: var(--muted-color); margin-bottom: 2rem;">Tambahkan transaksi pemasukan dan pengeluaran</p>
                        <button class="btn btn-primary btn-lg" onclick="window.app.showAddTransactionModal()">
                            ➕ Tambah Transaksi Pertama
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderFinancialPlanning() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📊 Financial Planning</h2>
                </div>
                <div class="card-body">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🎯</div>
                        <h3>Rencana Keuangan Masa Depan</h3>
                        <p style="color: var(--muted-color);">Atur budget, tabungan, dan investasi</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderReports() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📈 Laporan</h2>
                </div>
                <div class="card-body">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">📊</div>
                        <h3>Analisis & Laporan Keuangan</h3>
                        <p style="color: var(--muted-color);">Lihat laporan dan analisis keuangan Anda</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderCalendar() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🗓️ Kalender</h2>
                </div>
                <div class="card-body">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">📅</div>
                        <h3>Kalender Keuangan</h3>
                        <p style="color: var(--muted-color);">Jadwal transaksi dan reminder</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderGold() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🪙 Emas</h2>
                </div>
                <div class="card-body">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">💰</div>
                        <h3>Investasi Emas</h3>
                        <p style="color: var(--muted-color);">Kelola portfolio emas Anda</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderSettings() {
        return `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">⚙️ Pengaturan</h2>
                </div>
                <div class="card-body">
                    <div style="text-align: center; padding: 3rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🎨</div>
                        <h3>Pengaturan & Personalisasi</h3>
                        <p style="color: var(--muted-color); margin-bottom: 2rem;">Atur tema dan preferensi aplikasi</p>
                        
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                            <button class="btn btn-outline">🔄 Reset Data</button>
                            <button class="btn btn-outline">💾 Backup</button>
                            <button class="btn btn-outline">🎨 Tema</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDefault() {
        return `
            <div class="card">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🚧</div>
                    <h3>Fitur dalam Pengembangan</h3>
                    <p style="color: var(--muted-color);">Tab ini akan segera hadir!</p>
                </div>
            </div>
        `;
    }

    renderError(tabName) {
        return `
            <div class="card">
                <div style="text-align: center; padding: 40px; color: var(--danger-color);">
                    <div style="font-size: 48px; margin-bottom: 15px;">😵</div>
                    <h3>Terjadi Kesalahan</h3>
                    <p>Gagal memuat konten. Silakan refresh halaman.</p>
                    <button class="btn btn-primary" onclick="window.app.switchTab('${tabName}')" style="margin-top: 15px;">
                        🔄 Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }

    // Quick Note Functions
    loadQuickNote() {
        const content = localStorage.getItem(this.QUICK_NOTE_KEY) || '';
        const textarea = document.getElementById('quickNoteContent');
        if (textarea) {
            textarea.value = content;
        }
    }

    saveQuickNote() {
        const content = document.getElementById('quickNoteContent').value;
        localStorage.setItem(this.QUICK_NOTE_KEY, content);
        this.showToast('📝 Catatan berhasil disimpan!', 'success');
        this.toggleQuickNotePopup();
    }

    clearQuickNote() {
        if (confirm('Hapus catatan cepat?')) {
            localStorage.removeItem(this.QUICK_NOTE_KEY);
            document.getElementById('quickNoteContent').value = '';
            this.showToast('🗑️ Catatan dihapus!', 'info');
        }
    }

    toggleQuickNotePopup() {
        const popup = document.getElementById('quickNotePopup');
        if (popup) {
            const isHidden = popup.classList.toggle('hidden');
            
            if (!isHidden) {
                this.loadQuickNote();
                document.getElementById('quickNoteContent').focus();
            }
        }
    }

    // Modal Functions
    showAddTransactionModal() {
        this.showToast('➕ Fitur tambah transaksi akan segera hadir!', 'info');
    }

    showTransferModal() {
        this.showToast('🔄 Fitur transfer akan segera hadir!', 'info');
    }

    // Utility Functions
    showToast(message, type = 'info') {
        document.querySelectorAll('.toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            color: white;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
});
