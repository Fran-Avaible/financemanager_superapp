
// js/main.js - Finance App with Pizza Wheel Navigation (FULLY FIXED)

class FinanceApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.QUICK_NOTE_KEY = 'quickNoteContent';
        this.isPizzaOpen = false;
        this.modules = {};
        this.DB = null;
        this.init();
    }

    async init() {
        console.log('🚀 Finance Orbital Pizza Wheel Navigation Started');
        
        // Setup dasar dulu
        this.setupEventListeners();
        this.setupTabPalette();
        this.setupPizzaWheel();
        this.loadQuickNote();
        
        // Initialize database dan modules
        await this.initializeDatabase();
        this.initializeModules();
        
        // Render tab awal
        await this.switchTab('dashboard');
    }

    async initializeDatabase() {
        try {
            // Dynamic import untuk database
            const databaseModule = await import('./database.js');
            this.DB = databaseModule.DB;
            await this.DB.init();
            console.log('✅ Database initialized');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
        }
    }

    initializeModules() {
        try {
            // Inisialisasi modul-modul dengan dynamic import
            // Modules akan di-load on-demand saat tab diakses
            this.modules = {
                dashboard: null,
                transactions: null,
                reports: null,
                'settings-personalization': null
            };
            
            console.log('✅ Modules system initialized');
        } catch (error) {
            console.error('❌ Modules initialization failed:', error);
        }
    }

    async loadModule(moduleName) {
        // Jika module sudah loaded, return langsung
        if (this.modules[moduleName]) {
            return this.modules[moduleName];
        }

        try {
            let module;
            switch(moduleName) {
                case 'dashboard':
                    const dashboardModule = await import('./modules/dashboard.js');
                    module = new dashboardModule.DashboardModule(this);
                    break;
                case 'transactions':
                    const transactionsModule = await import('./modules/transactions.js');
                    module = new transactionsModule.TransactionsModule(this);
                    break;
                case 'reports':
                    const reportsModule = await import('./modules/reports.js');
                    module = new reportsModule.ReportsModule(this);
                    break;
                case 'settings-personalization':
                    const settingsModule = await import('./modules/settings-personalization.js');
                    module = new settingsModule.SettingsPersonalizationModule(this);
                    break;
                default:
                    return null;
            }
            
            this.modules[moduleName] = module;
            console.log(`✅ Module ${moduleName} loaded`);
            return module;
        } catch (error) {
            console.error(`❌ Failed to load module ${moduleName}:`, error);
            return null;
        }
    }

    setupPizzaWheel() {
        const pizzaToggleBtn = document.getElementById('pizzaToggleBtn');
        const pizzaCloseBtn = document.getElementById('pizzaCloseBtn');
        const pizzaBackdrop = document.getElementById('pizzaBackdrop');
        const pizzaSlices = document.querySelectorAll('.pizza-slice');

        if (!pizzaToggleBtn || !pizzaCloseBtn || !pizzaBackdrop) {
            console.warn('Pizza wheel elements not found');
            return;
        }

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

        if (!pizzaClosed || !pizzaWheel || !pizzaToggleBtn) return;

        this.isPizzaOpen = open;

        if (open) {
            pizzaClosed.classList.add('hidden');
            pizzaWheel.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Animate arrow
            const arrow = pizzaToggleBtn.querySelector('.pizza-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(180deg)';
            }
        } else {
            pizzaClosed.classList.remove('hidden');
            pizzaWheel.classList.add('hidden');
            document.body.style.overflow = '';
            
            // Reset arrow
            const arrow = pizzaToggleBtn.querySelector('.pizza-arrow');
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
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

    // Dalam class FinanceApp, tambahkan:
async initializeModules() {
    try {
        // Load transaction modal module
        const transactionModalModule = await import('./modules/transaction-modal.js');
        this.transactionModal = new transactionModalModule.TransactionModal(this);
        
        this.modules = {
            dashboard: null,
            transactions: null,
            reports: null,
            'settings-personalization': null
        };
        
    } catch (error) {
        console.error('❌ Modules initialization failed:', error);
    }
}

// Update modal functions di main.js:
    setupPizzaWheel() {
    const pizzaToggleBtn = document.getElementById('pizzaToggleBtn');
    const pizzaCloseBtn = document.getElementById('pizzaCloseBtn');
    const pizzaBackdrop = document.getElementById('pizzaBackdrop');
    const pizzaWheelRotatable = document.getElementById('pizzaWheelRotatable');
    const pizzaSlices = document.querySelectorAll('.pizza-slice');

    if (!pizzaToggleBtn || !pizzaCloseBtn || !pizzaBackdrop || !pizzaWheelRotatable) {
        console.warn('Pizza wheel elements not found');
        return;
    }

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

    // Touch and mouse events for rotation
    this.setupWheelRotation(pizzaWheelRotatable);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isPizzaOpen) {
            this.togglePizzaWheel(false);
        }
    });

    // Set initial active slice
    this.updatePizzaActiveState();
}

setupWheelRotation(wheelElement) {
    let isDragging = false;
    let startAngle = 0;
    let currentAngle = 0;
    let rotationSpeed = 0.5; // Adjust rotation sensitivity

    const startRotation = (clientX, clientY) => {
        isDragging = true;
        const rect = wheelElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + (rect.height / 2) + 160; // Account for semicircle
        startAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    };

    const rotate = (clientX, clientY) => {
        if (!isDragging) return;
        
        const rect = wheelElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + (rect.height / 2) + 160;
        const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        
        const deltaAngle = angle - startAngle;
        currentAngle += deltaAngle * rotationSpeed;
        
        wheelElement.style.transform = `rotate(${currentAngle}deg)`;
        startAngle = angle;
    };

    const stopRotation = () => {
        isDragging = false;
    };

    // Mouse events
    wheelElement.addEventListener('mousedown', (e) => {
        startRotation(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        rotate(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', stopRotation);

    // Touch events
    wheelElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startRotation(touch.clientX, touch.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        rotate(touch.clientX, touch.clientY);
    });

    document.addEventListener('touchend', stopRotation);

    // Prevent context menu
    wheelElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

togglePizzaWheel(open) {
    const pizzaClosed = document.getElementById('pizzaClosed');
    const pizzaWheel = document.getElementById('pizzaWheel');
    const pizzaToggleBtn = document.getElementById('pizzaToggleBtn');

    if (!pizzaClosed || !pizzaWheel || !pizzaToggleBtn) return;

    this.isPizzaOpen = open;

    if (open) {
        pizzaClosed.classList.add('hidden');
        pizzaWheel.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Animate arrow
        const arrow = pizzaToggleBtn.querySelector('.pizza-arrow');
        if (arrow) {
            arrow.style.transform = 'rotate(180deg)';
        }
    } else {
        pizzaClosed.classList.remove('hidden');
        pizzaWheel.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Reset arrow
        const arrow = pizzaToggleBtn.querySelector('.pizza-arrow');
        if (arrow) {
            arrow.style.transform = 'rotate(0deg)';
        }
    }
}

updatePizzaActiveState() {
    const pizzaSlices = document.querySelectorAll('.pizza-slice');
    pizzaSlices.forEach(slice => {
        slice.classList.toggle('active', slice.dataset.tab === this.currentTab);
    });
}
// Dalam class FinanceApp, update method showAddTransactionModal:
showAddTransactionModal() {
    if (this.modules.transactions && typeof this.modules.transactions.showAddTransactionModal === 'function') {
        this.modules.transactions.showAddTransactionModal();
    } else {
        this.showToast('➕ Memuat modul transaksi...', 'info');
        // Fallback ke modal sederhana
        this.showSimpleTransactionModal();
    }
}

showEditTransactionModal(transactionId) {
    if (this.modules.transactions && typeof this.modules.transactions.showEditTransactionModal === 'function') {
        this.modules.transactions.showEditTransactionModal(transactionId);
    } else {
        this.showToast('✏️ Fitur edit transaksi sedang dimuat...', 'info');
    }
}

// Fallback modal sederhana
showSimpleTransactionModal() {
    const content = `
        <div style="text-align: center; padding: 20px;">
            <div class="emoji">⏳</div>
            <p>Modul transaksi sedang dimuat...</p>
            <p>Silakan refresh halaman atau buka tab Transaksi terlebih dahulu.</p>
        </div>
    `;
    Utils.createModal('simpleTransactionModal', 'Tambah Transaksi', content);
    Utils.openModal('simpleTransactionModal');
}

// Tambahkan method refresh
refreshCurrentTab() {
    this.renderTabContent(this.currentTab);
}

    async renderTabContent(tabName) {
        const tabContent = document.getElementById('tabContent');
        if (!tabContent) {
            console.error('Tab content container not found');
            return;
        }
        
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
            // Beri sedikit delay untuk UX yang lebih baik
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Load dan render module yang sesuai
            const module = await this.loadModule(tabName);
            
            if (module && typeof module.render === 'function') {
                await module.render(tabContent);
            } else {
                // Fallback ke default content jika module tidak ada
                tabContent.innerHTML = this.getFallbackContent(tabName);
            }
            
        } catch (error) {
            console.error(`Error rendering ${tabName}:`, error);
            tabContent.innerHTML = this.renderError(tabName, error);
        }
    }

    getFallbackContent(tabName) {
        const fallbackContents = {
            'dashboard': `
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">🏠 Dashboard</h2>
                    </div>
                    <div class="card-body">
                        <div style="text-align: center; padding: 3rem;">
                            <div style="font-size: 4rem; margin-bottom: 1rem;">📊</div>
                            <h3>Dashboard Keuangan</h3>
                            <p style="color: var(--muted-color); margin-bottom: 2rem;">Ringkasan keuangan Anda akan muncul di sini</p>
                            <button class="btn btn-primary" onclick="window.app.showAddTransactionModal()">
                                ➕ Tambah Transaksi Pertama
                            </button>
                        </div>
                    </div>
                </div>
            `,
            'transactions': `
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
            `,
            'financial-planning': `
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
            `,
            'reports': `
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
            `,
            'calendar': `
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
            `,
            'gold': `
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
            `,
            'settings-personalization': `
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
                                <button class="btn btn-outline" onclick="window.app.confirmClearAllData()">🔄 Reset Data</button>
                                <button class="btn btn-outline" onclick="window.app.DB?.backupData()">💾 Backup</button>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };

        return fallbackContents[tabName] || `
            <div class="card">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🚧</div>
                    <h3>Fitur dalam Pengembangan</h3>
                    <p style="color: var(--muted-color);">Tab ini akan segera hadir!</p>
                </div>
            </div>
        `;
    }

    renderError(tabName, error) {
        return `
            <div class="card">
                <div style="text-align: center; padding: 40px; color: var(--danger-color);">
                    <div style="font-size: 48px; margin-bottom: 15px;">😵</div>
                    <h3>Terjadi Kesalahan</h3>
                    <p>Gagal memuat konten: ${error.message}</p>
                    <button class="btn btn-primary" onclick="window.app.switchTab('${tabName}')" style="margin-top: 15px;">
                        🔄 Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }

    // Quick Note Functions
    loadQuickNote() {
        try {
            const content = localStorage.getItem(this.QUICK_NOTE_KEY) || '';
            const textarea = document.getElementById('quickNoteContent');
            if (textarea) {
                textarea.value = content;
            }
        } catch (error) {
            console.error('Error loading quick note:', error);
        }
    }

    saveQuickNote() {
        try {
            const content = document.getElementById('quickNoteContent')?.value || '';
            localStorage.setItem(this.QUICK_NOTE_KEY, content);
            this.showToast('📝 Catatan berhasil disimpan!', 'success');
            this.toggleQuickNotePopup();
        } catch (error) {
            console.error('Error saving quick note:', error);
            this.showToast('❌ Gagal menyimpan catatan', 'error');
        }
    }

    clearQuickNote() {
        if (confirm('Hapus catatan cepat?')) {
            try {
                localStorage.removeItem(this.QUICK_NOTE_KEY);
                const textarea = document.getElementById('quickNoteContent');
                if (textarea) {
                    textarea.value = '';
                }
                this.showToast('🗑️ Catatan dihapus!', 'info');
            } catch (error) {
                console.error('Error clearing quick note:', error);
                this.showToast('❌ Gagal menghapus catatan', 'error');
            }
        }
    }

    toggleQuickNotePopup() {
        const popup = document.getElementById('quickNotePopup');
        if (popup) {
            const isHidden = popup.classList.toggle('hidden');
            
            if (!isHidden) {
                this.loadQuickNote();
                const textarea = document.getElementById('quickNoteContent');
                if (textarea) {
                    textarea.focus();
                }
            }
        }
    }

    // Modal Functions - akan diimplementasikan oleh modul
    showAddTransactionModal() {
        this.showToast('➕ Fitur tambah transaksi akan segera hadir!', 'info');
    }

    showTransferModal() {
        this.showToast('🔄 Fitur transfer akan segera hadir!', 'info');
    }

    showAddWalletModal() {
        this.showToast('💰 Fitur tambah dompet akan segera hadir!', 'info');
    }

    showEditWalletModal(walletId) {
        this.showToast(`✏️ Edit dompet ${walletId} akan segera hadir!`, 'info');
    }

    showEditTransactionModal(transactionId) {
        this.showToast(`✏️ Edit transaksi ${transactionId} akan segera hadir!`, 'info');
    }

    // Method untuk diakses oleh modul
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    refreshTheme() {
        // Method untuk refresh tema - akan digunakan oleh settings module
        console.log('Refreshing theme...');
        // Force re-render current tab untuk apply theme changes
        this.renderTabContent(this.currentTab);
    }

    confirmClearAllData() {
        if (confirm('⚠️ Yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!')) {
            if (this.DB && this.DB.clearAllData) {
                this.DB.clearAllData().then(success => {
                    if (success) {
                        this.showToast('🗑️ Semua data berhasil dihapus!', 'success');
                        // Refresh aplikasi
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        this.showToast('❌ Gagal menghapus data', 'error');
                    }
                });
            } else {
                this.showToast('❌ Database tidak tersedia', 'error');
            }
        }
    }

    // Utility Functions
    showToast(message, type = 'info') {
        // Hapus toast lama
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
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Method untuk diakses global
    switchToTab(tabName) {
        this.switchTab(tabName);
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

    .toast {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 10000 !important;
    }
`;
document.head.appendChild(style);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
    
    // Expose methods untuk diakses global
    window.switchTab = (tabName) => window.app.switchTab(tabName);
    window.showToast = (message, type) => window.app.showToast(message, type);
    window.closeModal = (modalId) => window.app.closeModal(modalId);
});

console.log('✅ Main.js loaded successfully');
