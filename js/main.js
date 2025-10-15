// js/main.js - Clean Finance App
class FinanceApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.QUICK_NOTE_KEY = 'quickNoteContent';
        this.isPizzaOpen = false;
        this.init();
    }

    init() {
        console.log('🚀 Finance Orbital Started');
        this.setupEventListeners();
        this.setupPizzaWheel();
        this.loadQuickNote();
        this.renderTabContent('dashboard');
    }

    setupPizzaWheel() {
        const pizzaToggle = document.getElementById('pizzaToggle');
        const pizzaClose = document.getElementById('pizzaClose');
        const pizzaBackdrop = document.getElementById('pizzaBackdrop');
        const pizzaSlices = document.querySelectorAll('.pizza-slice');

        // Toggle pizza wheel
        pizzaToggle.addEventListener('click', () => this.togglePizzaWheel(true));
        pizzaClose.addEventListener('click', () => this.togglePizzaWheel(false));
        pizzaBackdrop.addEventListener('click', () => this.togglePizzaWheel(false));

        // Pizza slice clicks
        pizzaSlices.forEach(slice => {
            slice.addEventListener('click', (e) => {
                const tabName = slice.dataset.tab;
                this.switchTab(tabName);
                this.togglePizzaWheel(false);
            });
        });

        // Desktop tab clicks
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Escape key to close pizza wheel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPizzaOpen) {
                this.togglePizzaWheel(false);
            }
        });
    }

    setupEventListeners() {
        // Quick actions
        document.getElementById('quickNoteBtn').addEventListener('click', () => this.toggleQuickNote());
        document.getElementById('addTransactionBtn').addEventListener('click', () => this.showAddTransactionModal());
        document.getElementById('transferBtn').addEventListener('click', () => this.showTransferModal());
        
        // Quick note buttons
        document.getElementById('saveQuickNoteBtn').addEventListener('click', () => this.saveQuickNote());
        document.getElementById('clearQuickNoteBtn').addEventListener('click', () => this.clearQuickNote());
    }

    togglePizzaWheel(open) {
        const pizzaClosed = document.querySelector('.pizza-closed');
        const pizzaWheel = document.getElementById('pizzaWheel');
        const toggleIcon = document.querySelector('.toggle-icon');

        this.isPizzaOpen = open;

        if (open) {
            pizzaClosed.classList.add('hidden');
            pizzaWheel.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            toggleIcon.style.transform = 'rotate(180deg)';
        } else {
            pizzaClosed.classList.remove('hidden');
            pizzaWheel.classList.add('hidden');
            document.body.style.overflow = '';
            toggleIcon.style.transform = 'rotate(0deg)';
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update active states
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.pizza-slice').forEach(slice => {
            slice.classList.toggle('active', slice.dataset.tab === tabName);
        });
        
        this.renderTabContent(tabName);
    }

    renderTabContent(tabName) {
        const tabContent = document.getElementById('tabContent');
        const content = this.getTabContent(tabName);
        tabContent.innerHTML = content;
    }

    getTabContent(tabName) {
        const contents = {
            dashboard: `
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
            `,
            
            transactions: `
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">🔍 Transaksi</h2>
                        <button class="btn btn-primary" onclick="window.app.showAddTransactionModal()">
                            ➕ Tambah Transaksi
                        </button>
                    </div>
                    <div class="card-body">
                        <div style="text-align: center; padding: 2rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">💸</div>
                            <h3>Kelola Transaksi Keuangan</h3>
                            <p style="color: var(--muted-color); margin-bottom: 1.5rem;">Tambahkan transaksi pemasukan dan pengeluaran</p>
                            <button class="btn btn-primary" onclick="window.app.showAddTransactionModal()">
                                ➕ Tambah Transaksi Pertama
                            </button>
                        </div>
                    </div>
                </div>
            `,
            
            'financial-planning': `
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">📊 Financial Planning</h2>
                    </div>
                    <div class="card-body">
                        <div style="text-align: center; padding: 2rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
                            <h3>Rencana Keuangan Masa Depan</h3>
                            <p style="color: var(--muted-color);">Atur budget, tabungan, dan investasi</p>
                        </div>
                    </div>
                </div>
            `,
            
            // Add other tab contents here...
            reports: this.createPlaceholderContent('📈 Laporan', 'Analisis & Laporan Keuangan'),
            calendar: this.createPlaceholderContent('🗓️ Kalender', 'Jadwal transaksi dan reminder'),
            gold: this.createPlaceholderContent('🪙 Emas', 'Kelola portfolio emas Anda'),
            settings: this.createPlaceholderContent('⚙️ Pengaturan', 'Atur tema dan preferensi aplikasi')
        };

        return contents[tabName] || this.createPlaceholderContent('🚧', 'Fitur dalam pengembangan');
    }

    createPlaceholderContent(emoji, title) {
        return `
            <div class="card">
                <div style="text-align: center; padding: 3rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">${emoji}</div>
                    <h3>${title}</h3>
                    <p style="color: var(--muted-color);">Fitur akan segera hadir!</p>
                </div>
            </div>
        `;
    }

    // Quick Note Functions
    loadQuickNote() {
        const content = localStorage.getItem(this.QUICK_NOTE_KEY) || '';
        document.getElementById('quickNoteContent').value = content;
    }

    saveQuickNote() {
        const content = document.getElementById('quickNoteContent').value;
        localStorage.setItem(this.QUICK_NOTE_KEY, content);
        this.showToast('📝 Catatan berhasil disimpan!', 'success');
        this.toggleQuickNote();
    }

    clearQuickNote() {
        if (confirm('Hapus catatan cepat?')) {
            localStorage.removeItem(this.QUICK_NOTE_KEY);
            document.getElementById('quickNoteContent').value = '';
            this.showToast('🗑️ Catatan dihapus!', 'info');
        }
    }

    toggleQuickNote() {
        const popup = document.getElementById('quickNotePopup');
        popup.classList.toggle('hidden');
        
        if (!popup.classList.contains('hidden')) {
            this.loadQuickNote();
            document.getElementById('quickNoteContent').focus();
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
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = 'toast';
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
