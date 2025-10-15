// js/modules/settings-personalization.js (Versi Gabungan)
import { DB } from '../database.js';
import { Utils } from '../utils.js';

export class SettingsPersonalizationModule {
    constructor(app) {
        this.app = app;
        this.customSettings = this.loadCustomSettings();
        this.isApplying = false;
        
        // Auto-apply tema saat modul di-load
        this.applyToApp();
    }

    async render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header"><h3 class="card-title">⚙️ Pengaturan Aplikasi</h3></div>
                <div class="tab-grid tab-grid-2">
                    <div>
                        <h4 style="margin-top: 20px;">💾 Data Management</h4>
                        <div class="data-management">
                            <button class="btn btn-info" id="backupSettingsBtn"><span>💾</span> Backup</button>
                        </div>
                        <div class="data-management">
                             <label class="file-input-label btn btn-primary">
                                <span>📁</span> Restore 
                                <input type="file" id="restoreFile" class="file-input" accept=".json" onchange="window.app.settingsPersonalizationModule.handleRestore(event)">
                            </label>
                        </div>
                        <button class="btn btn-danger" style="width: 100%; margin-top: 10px;" onclick="window.app.confirmClearAllData()"><span>🗑️</span> Hapus Semua Data</button>
                    </div>
                    <div>
                        <h4>🏷️ Kelola Kategori</h4>
                        <div id="categoriesManagement"></div>
                        <button class="btn btn-primary" id="addCategoryBtn" style="width: 100%; margin-top: 10px;">+ Tambah Kategori</button>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🎨 Personalisasi Tampilan</h3>
                    <p>Kustomisasi aplikasi sesuai preferensi Anda</p>
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions" style="margin-bottom: 20px;">
                    <button class="btn btn-primary" data-preset="mineral">💎 Mineral Green</button>
                    <button class="btn btn-primary" data-preset="ocean">🌊 Ocean Blue</button>
                    <button class="btn btn-success" data-preset="nature">🌿 Nature Fresh</button>
                    <button class="btn btn-warning" data-preset="sunset">🌅 Sunset</button>
                    <button class="btn btn-info" data-preset="cyber">🚀 Cyber Punk</button>
                    <button class="btn btn-danger" data-preset="crimson">❤️ Crimson Red</button>
                    <button class="btn btn-outline" data-preset="glass">🔮 Glass Morphism</button>
                    <button class="btn btn-outline" data-preset="dark">🌙 Dark Pro</button>
                    <button class="btn btn-outline" data-preset="purple">👑 Purple Royal</button>
                    <button class="btn btn-outline" data-preset="gold">⭐ Golden Luxury</button>
                </div>
                
                <!-- FLOATING PREVIEW TOGGLE -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="card-header">
                        <h4>👁️ Pratinjau Real-time</h4>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label class="checkbox-label">
                                <input type="checkbox" id="floatingPreviewToggle" ${localStorage.getItem('floatingPreview') === 'true' ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Mode Mengambang (Masih dalam Pengembangan)
                            </label>
                            <button class="btn btn-sm btn-outline" id="refreshPreview">🔄 Refresh</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="livePreview" class="${localStorage.getItem('floatingPreview') === 'true' ? 'floating-preview' : ''}">
                            <div class="color-info">
                                <div class="color-swatch primary" title="Primary Color"></div>
                                <div class="color-swatch secondary" title="Secondary Color"></div>
                                <div class="color-swatch accent" title="Accent Color"></div>
                                <div class="color-swatch background" title="Background Color"></div>
                                <div class="color-info-text">
                                    <strong>Brand Colors:</strong> <span id="currentThemeName">Mineral Green • Twine • Cape Palliser • Ecru White</span>
                                </div>
                            </div>
                            <div class="preview-dashboard">
                                <div class="preview-header">
                                    <h5>Dashboard Preview</h5>
                                    <span class="preview-badge">Live</span>
                                </div>
                                <div class="preview-stats">
                                    <div class="preview-stat-card">
                                        <div class="preview-stat-value">Rp 5.250.000</div>
                                        <div class="preview-stat-label">Total Balance</div>
                                    </div>
                                    <div class="preview-stat-card">
                                        <div class="preview-stat-value">Rp 2.100.000</div>
                                        <div class="preview-stat-label">Monthly Income</div>
                                    </div>
                                </div>
                                <div class="preview-transaction">
                                    <div class="preview-transaction-info">
                                        <span class="preview-emoji">🍔</span>
                                        <div>
                                            <div class="preview-transaction-title">Makan Siang</div>
                                            <div class="preview-transaction-subtitle">Food & Drink • Today</div>
                                        </div>
                                    </div>
                                    <div class="preview-transaction-amount expense">-Rp 75.000</div>
                                </div>
                                <div class="preview-progress">
                                    <div class="preview-progress-header">
                                        <span>Budget Progress</span>
                                        <span>65%</span>
                                    </div>
                                    <div class="preview-progress-bar">
                                        <div class="preview-progress-fill" style="width: 65%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tab-grid tab-grid-2">
                    <div>
                        <!-- THEME CUSTOMIZATION -->
                        <div class="card" style="margin-bottom: 20px;">
                            <div class="card-header">
                                <h4>🎯 Skema Warna</h4>
                            </div>
                            <div class="card-body">
                                <div id="themeCustomization"></div>
                            </div>
                        </div>
                        
                        <!-- WIDGETS MANAGEMENT -->
                        <div class="card">
                            <div class="card-header">
                                <h4>📊 Tata Letak Dashboard</h4>
                            </div>
                            <div class="card-body">
                                <div id="widgetsManagement"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <!-- TYPOGRAPHY -->
                        <div class="card" style="margin-bottom: 20px;">
                            <div class="card-header">
                                <h4>🔤 Tipografi</h4>
                            </div>
                            <div class="card-body">
                                <div id="fontCustomization"></div>
                            </div>
                        </div>
                        
                        <!-- EFFECTS & ANIMATIONS -->
                        <div class="card">
                            <div class="card-header">
                                <h4>🎪 Efek & Animasi</h4>
                            </div>
                            <div class="card-body">
                                <div id="effectsCustomization"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- ACTION BUTTONS -->
                <div class="action-buttons" style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                    <button class="btn btn-primary" id="applyPersonalization">
                        💾 Terapkan Perubahan
                    </button>
                    <button class="btn btn-success" id="saveAsTheme">
                        📁 Simpan sebagai Tema
                    </button>
                    <button class="btn btn-outline" id="resetPersonalization">
                        🔄 Reset Default
                    </button>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-info" id="exportTheme">📤 Export</button>
                        <label class="btn btn-info">
                            📁 Import
                            <input type="file" id="importThemeFile" accept=".json" style="display: none;">
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header"><h3 class="card-title">ℹ️ Informasi Aplikasi</h3></div>
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🤖</div>
                    <h3>Finance Super App</h3>
                    <p style="color: #666; margin-bottom: 15px;">Aplikasi manajemen keuangan offline</p>
                    <div style="background: var(--light-color); padding: 15px; border-radius: 10px;">
                        <p><strong>Total Transaksi:</strong> <span id="totalTransactionsCount">0</span></p>
                        <p><strong>Total Wallet:</strong> <span id="totalWalletsCount">0</span></p>
                        <p><strong>Versi:</strong> 3.0 (IndexedDB)</p>
                    </div>
                </div>
            </div>
            
            <!-- SAVED THEMES MODAL -->
            <div id="savedThemesModal" class="modal hidden">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>💾 Tema Tersimpan</h3>
                        <button class="modal-close" onclick="Utils.closeModal('savedThemesModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="savedThemesList"></div>
                        <div class="form-group" style="margin-top: 15px;">
                            <label>Nama Tema Baru:</label>
                            <input type="text" id="newThemeName" class="form-control" placeholder="Masukkan nama tema">
                        </div>
                        <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="window.app.settingsPersonalizationModule.saveCurrentAsTheme()">
                            💾 Simpan Tema Sekarang
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        await this.renderCategoriesManagement();
        await this.updateAppInfo();
        await this.renderThemeCustomization();
        await this.renderFontCustomization();
        await this.renderEffectsCustomization();
        await this.renderWidgetsManagement();
        this.setupListeners();
        this.updateLivePreview();
        this.setupFloatingPreview();
    }

    setupListeners() {
        document.querySelector('.light-theme-btn')?.addEventListener('click', () => this.app.changeTheme('light'));
        document.querySelector('.dark-theme-btn')?.addEventListener('click', () => this.app.changeTheme('dark'));
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => this.showAddCategoryModal());
        
        // Event listener untuk backup button
        document.getElementById('backupSettingsBtn')?.addEventListener('click', async () => {
            try {
                await DB.backupData();
                Utils.showToast('Backup berhasil didownload!', 'success');
            } catch (error) {
                console.error('Backup error:', error);
                Utils.showToast('Gagal membuat backup', 'error');
            }
        });

        // Personalization listeners
        document.getElementById('applyPersonalization')?.addEventListener('click', () => this.applyPersonalization());
        document.getElementById('saveAsTheme')?.addEventListener('click', () => this.showSaveThemeModal());
        document.getElementById('resetPersonalization')?.addEventListener('click', () => this.resetPersonalization());
        document.getElementById('exportTheme')?.addEventListener('click', () => this.exportTheme());
        document.getElementById('importThemeFile')?.addEventListener('change', (e) => this.importTheme(e));
        document.getElementById('refreshPreview')?.addEventListener('click', () => this.updateLivePreview());
    }

    async handleRestore(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!confirm('⚠️ RESTORE akan MENGGANTI SEMUA DATA yang ada saat ini! Yakin ingin melanjutkan?')) {
            event.target.value = ''; // Reset input file
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonData = e.target.result;
                const success = await DB.restoreData(jsonData);
                if (success) {
                    Utils.showToast('Data berhasil dipulihkan! Aplikasi akan dimuat ulang.', 'success');
                    setTimeout(() => window.location.reload(), 2000);
                }
            } catch (error) {
                console.error('Restore failed:', error);
                Utils.showToast(`Gagal memulihkan: ${error.message}`, 'error');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    }

    async renderCategoriesManagement() {
        const container = document.getElementById('categoriesManagement');
        if (!container) return;
        const categories = await DB.getCategories();
        
        if (categories.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding: 20px;"><div class="emoji">🏷️</div><p>Belum ada kategori.</p></div>`;
            return;
        }

        container.innerHTML = `<ul style="list-style: none; padding: 0;">${categories.map(cat => `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>${cat.emoji} ${cat.name} (${cat.type})</span>
                <div>
                    <button class="btn btn-sm btn-info edit-category-btn" data-id="${cat.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-category-btn" data-id="${cat.id}">Hapus</button>
                </div>
            </li>`).join('')}</ul>`;
        
        container.querySelectorAll('.edit-category-btn').forEach(btn => btn.addEventListener('click', (e) => this.showEditCategoryModal(e.target.dataset.id)));
        container.querySelectorAll('.delete-category-btn').forEach(btn => btn.addEventListener('click', (e) => this.confirmDeleteCategory(e.target.dataset.id)));
    }

    async updateAppInfo() {
        const [transactions, wallets] = await Promise.all([DB.getTransactions(), DB.getWallets()]);
        document.getElementById('totalTransactionsCount').textContent = transactions.length;
        document.getElementById('totalWalletsCount').textContent = wallets.length;
    }

    showAddCategoryModal() {
        const content = `
            <form id="addCategoryForm">
                <div class="form-group">
                    <label>Nama Kategori</label>
                    <input type="text" class="form-control" id="categoryName" required placeholder="Contoh: Makanan, Transportasi">
                </div>
                <div class="form-group">
                    <label>Tipe</label>
                    <select class="form-control" id="categoryType" required>
                        <option value="expense">Pengeluaran</option>
                        <option value="income">Pemasukan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="categoryEmoji" value="🏷️" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Tambah Kategori</button>
            </form>
        `;
        Utils.createModal('addCategoryModal', 'Tambah Kategori', content);
        Utils.openModal('addCategoryModal');

        document.getElementById('addCategoryForm').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('categoryName').value;
            const type = document.getElementById('categoryType').value;
            const emoji = document.getElementById('categoryEmoji').value;

            // Validasi input
            if (!name.trim()) {
                return Utils.showToast('Nama kategori tidak boleh kosong!', 'error');
            }

            const categories = await DB.getCategories();
            
            // Cek duplikasi kategori
            const existingCategory = categories.find(c => c.name === name && c.type === type);
            if (existingCategory) {
                return Utils.showToast('Kategori dengan nama dan tipe yang sama sudah ada!', 'error');
            }

            categories.push({ id: DB.generateId(), name, type, emoji });
            
            await DB.saveCategories(categories);
            Utils.closeModal('addCategoryModal');
            await this.renderCategoriesManagement();
            Utils.showToast('Kategori berhasil ditambahkan!', 'success');
        };
    }

    async showEditCategoryModal(categoryId) {
        const categories = await DB.getCategories();
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;
        
        const content = `
            <form id="editCategoryForm">
                <div class="form-group">
                    <label>Nama Kategori</label>
                    <input type="text" class="form-control" id="editCategoryName" value="${category.name}" required>
                </div>
                <div class="form-group">
                    <label>Tipe</label>
                    <select class="form-control" id="editCategoryType" required>
                        <option value="expense" ${category.type === 'expense' ? 'selected' : ''}>Pengeluaran</option>
                        <option value="income" ${category.type === 'income' ? 'selected' : ''}>Pemasukan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="editCategoryEmoji" value="${category.emoji}" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Update Kategori</button>
            </form>
        `;
        Utils.createModal('editCategoryModal', 'Edit Kategori', content);
        Utils.openModal('editCategoryModal');

        document.getElementById('editCategoryForm').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('editCategoryName').value;
            const type = document.getElementById('editCategoryType').value;
            const emoji = document.getElementById('editCategoryEmoji').value;

            // Validasi input
            if (!name.trim()) {
                return Utils.showToast('Nama kategori tidak boleh kosong!', 'error');
            }

            // Cek duplikasi (kecuali kategori yang sedang diedit)
            const existingCategory = categories.find(c => c.name === name && c.type === type && c.id !== categoryId);
            if (existingCategory) {
                return Utils.showToast('Kategori dengan nama dan tipe yang sama sudah ada!', 'error');
            }

            const updatedCategories = categories.map(c => c.id === categoryId ? { ...c, name, type, emoji } : c);
            
            await DB.saveCategories(updatedCategories);
            Utils.closeModal('editCategoryModal');
            await this.renderCategoriesManagement();
            Utils.showToast('Kategori berhasil diperbarui!', 'success');
        };
    }

    async confirmDeleteCategory(categoryId) {
        const categories = await DB.getCategories();
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        // Cek apakah kategori digunakan dalam transaksi
        const transactions = await DB.getTransactions();
        const isCategoryUsed = transactions.some(t => t.categoryId === categoryId);

        let warningMessage = 'Yakin ingin menghapus kategori ini?';
        if (isCategoryUsed) {
            warningMessage += '\n\n⚠️ PERINGATAN: Kategori ini digunakan dalam beberapa transaksi. Transaksi tersebut akan kehilangan kategorinya.';
        }

        if (confirm(warningMessage)) {
            let categories = await DB.getCategories();
            categories = categories.filter(c => c.id !== categoryId);
            await DB.saveCategories(categories);
            await this.renderCategoriesManagement();
            Utils.showToast('Kategori berhasil dihapus!', 'success');
        }
    }

    // ========== PERSONALIZATION METHODS ==========

    loadCustomSettings() {
        const saved = localStorage.getItem('personalizationSettings');
        const defaultSettings = {
            theme: {
                primaryColor: '#415c5f',       // Mineral Green - Brand utama
                secondaryColor: '#bd9b5f',     // Twine - Brand sekunder
                accentColor: '#93713d',        // Cape Palliser - Brand aksen
                backgroundColor: '#f6f1e9',    // Ecru White - Brand background
                cardBackground: '#ffffff',     // Pure White
                textColor: '#1a1a1a',          // Almost Black
                mutedColor: '#6c757d',         // Modern Gray
                borderColor: '#e9ecef'         // Light Gray
            },
            typography: {
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                fontSize: '14px',
                headingSize: '18px',
                fontWeight: '400',
                lineHeight: '1.6'
            },
            effects: {
                animations: true,
                shadows: true,
                borderRadius: '12px',
                transitionSpeed: '0.3s',
                hoverEffects: true,
                glassEffect: false
            },
            layout: {
                showQuickStats: true,
                showRecentTransactions: true,
                showBudgetProgress: true,
                showSavingsGoals: true,
                compactMode: false,
                cardSpacing: '20px',
                sidebarWidth: '250px'
            },
            advanced: {
                cssOverrides: '',
                customVariables: {}
            }
        };
        
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveCustomSettings() {
        localStorage.setItem('personalizationSettings', JSON.stringify(this.customSettings));
    }

    async renderThemeCustomization() {
        const container = document.getElementById('themeCustomization');
        const colors = this.customSettings.theme;

        container.innerHTML = `
            <div class="color-grid">
                ${this.createColorPicker('primaryColor', 'Warna Primer', colors.primaryColor, 'Warna utama untuk button dan aksen')}
                ${this.createColorPicker('secondaryColor', 'Warna Sekunder', colors.secondaryColor, 'Warna kedua untuk variasi')}
                ${this.createColorPicker('accentColor', 'Warna Aksen', colors.accentColor, 'Warna untuk highlight dan perhatian')}
                ${this.createColorPicker('backgroundColor', 'Background', colors.backgroundColor, 'Warna background aplikasi')}
                ${this.createColorPicker('cardBackground', 'Card Background', colors.cardBackground, 'Warna background card')}
                ${this.createColorPicker('textColor', 'Warna Teks', colors.textColor, 'Warna teks utama')}
                ${this.createColorPicker('mutedColor', 'Warna Muted', colors.mutedColor, 'Warna teks sekunder')}
                ${this.createColorPicker('borderColor', 'Warna Border', colors.borderColor, 'Warna garis dan border')}
            </div>
            
            <div class="preset-themes">
                <label class="form-label">🎨 Preset Cepat:</label>
                <div class="preset-grid">
                    <div class="preset-item" data-preset="mineral" style="background: linear-gradient(135deg, #415c5f 50%, #bd9b5f 50%);" title="Mineral Green"></div>
                    <div class="preset-item" data-preset="ocean" style="background: linear-gradient(135deg, #0077b6 50%, #00b4d8 50%);" title="Ocean Blue"></div>
                    <div class="preset-item" data-preset="nature" style="background: linear-gradient(135deg, #2a9d8f 50%, #e9c46a 50%);" title="Nature Fresh"></div>
                    <div class="preset-item" data-preset="sunset" style="background: linear-gradient(135deg, #ff6b35 50%, #ff9e00 50%);" title="Sunset"></div>
                    <div class="preset-item" data-preset="cyber" style="background: linear-gradient(135deg, #7209b7 50%, #3a86ff 50%);" title="Cyber Punk"></div>
                    <div class="preset-item" data-preset="crimson" style="background: linear-gradient(135deg, #dc2626 50%, #ef4444 50%);" title="Crimson Red"></div>
                    <div class="preset-item" data-preset="glass" style="background: linear-gradient(135deg, #6366f1 50%, #8b5cf6 50%);" title="Glass Morphism"></div>
                    <div class="preset-item" data-preset="dark" style="background: linear-gradient(135deg, #1e293b 50%, #475569 50%);" title="Dark Pro"></div>
                    <div class="preset-item" data-preset="purple" style="background: linear-gradient(135deg, #7e22ce 50%, #c084fc 50%);" title="Purple Royal"></div>
                    <div class="preset-item" data-preset="gold" style="background: linear-gradient(135deg, #d97706 50%, #f59e0b 50%);" title="Golden Luxury"></div>
                </div>
            </div>
        `;

        this.setupColorPickers();
        this.setupPresetThemes();
    }

    createColorPicker(id, label, value, tooltip) {
        const brandDescriptions = {
            primaryColor: 'Warna utama brand untuk tombol dan elemen penting',
            secondaryColor: 'Warna sekunder untuk variasi dan aksen', 
            accentColor: 'Warna aksen untuk highlight dan perhatian',
            backgroundColor: 'Background utama aplikasi'
        };

        const description = brandDescriptions[id] || tooltip;
        
        return `
            <div class="color-picker-item" title="${description}">
                <label class="color-label">${label}</label>
                <div class="color-input-group">
                    <input type="color" class="color-picker" id="${id}" value="${value}" data-original="${value}">
                    <input type="text" class="color-hex" id="${id}Hex" value="${value}" maxlength="7">
                    <button class="btn btn-sm btn-outline reset-color" data-target="${id}">↺</button>
                </div>
                <div class="color-value" style="font-size: 11px; color: var(--muted-color); margin-top: 2px;">${value}</div>
            </div>
        `;
    }

    setupColorPickers() {
        // Sync color pickers dengan hex inputs
        document.querySelectorAll('.color-picker').forEach(picker => {
            picker.addEventListener('input', (e) => {
                const hexInput = document.getElementById(e.target.id + 'Hex');
                const colorValue = e.target.parentElement.parentElement.querySelector('.color-value');
                hexInput.value = e.target.value;
                colorValue.textContent = e.target.value;
                this.updateLivePreview();
            });
        });

        document.querySelectorAll('.color-hex').forEach(hexInput => {
            hexInput.addEventListener('input', (e) => {
                const value = e.target.value;
                const colorValue = e.target.parentElement.parentElement.querySelector('.color-value');
                if (value.startsWith('#') && value.length === 7) {
                    const colorPicker = document.getElementById(e.target.id.replace('Hex', ''));
                    colorPicker.value = value;
                    colorValue.textContent = value;
                    this.updateLivePreview();
                }
            });
            
            hexInput.addEventListener('blur', (e) => {
                const value = e.target.value;
                const colorValue = e.target.parentElement.parentElement.querySelector('.color-value');
                if (!value.startsWith('#')) {
                    e.target.value = '#' + value.replace('#', '');
                    colorValue.textContent = e.target.value;
                }
            });
        });

        // Reset color buttons
        document.querySelectorAll('.reset-color').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const colorPicker = document.getElementById(targetId);
                const hexInput = document.getElementById(targetId + 'Hex');
                const colorValue = colorPicker.parentElement.parentElement.querySelector('.color-value');
                const originalValue = colorPicker.dataset.original;
                
                colorPicker.value = originalValue;
                hexInput.value = originalValue;
                colorValue.textContent = originalValue;
                this.updateLivePreview();
            });
        });
    }

    setupPresetThemes() {
        const presets = {
            mineral: {
                name: "Mineral Green",
                primaryColor: '#415c5f',
                secondaryColor: '#bd9b5f',
                accentColor: '#93713d',
                backgroundColor: '#f6f1e9',
                cardBackground: '#ffffff',
                textColor: '#1a1a1a',
                mutedColor: '#6c757d',
                borderColor: '#e9ecef'
            },
            ocean: {
                name: "Ocean Blue",
                primaryColor: '#0077b6',
                secondaryColor: '#00b4d8',
                accentColor: '#ff6b6b',
                backgroundColor: '#f0f8ff',
                cardBackground: '#ffffff',
                textColor: '#1a1a1a',
                mutedColor: '#6c757d',
                borderColor: '#e1f5fe'
            },
            nature: {
                name: "Nature Fresh",
                primaryColor: '#2a9d8f',
                secondaryColor: '#e9c46a',
                accentColor: '#e76f51',
                backgroundColor: '#fefae0',
                cardBackground: '#ffffff',
                textColor: '#264653',
                mutedColor: '#6b9080',
                borderColor: '#ccd5ae'
            },
            sunset: {
                name: "Sunset",
                primaryColor: '#ff6b35',
                secondaryColor: '#ff9e00',
                accentColor: '#00a8e8',
                backgroundColor: '#f8f5f2',
                cardBackground: '#ffffff',
                textColor: '#2d3047',
                mutedColor: '#6d7275',
                borderColor: '#e6e6e6'
            },
            cyber: {
                name: "Cyber Punk",
                primaryColor: '#7209b7',
                secondaryColor: '#3a86ff',
                accentColor: '#ff006e',
                backgroundColor: '#0d1b2a',
                cardBackground: '#1b263b',
                textColor: '#e0e1dd',
                mutedColor: '#778da9',
                borderColor: '#415a77'
            },
            crimson: {
                name: "Crimson Red",
                primaryColor: '#dc2626',
                secondaryColor: '#ef4444',
                accentColor: '#f59e0b',
                backgroundColor: '#fef2f2',
                cardBackground: '#ffffff',
                textColor: '#1f2937',
                mutedColor: '#9ca3af',
                borderColor: '#fecaca'
            },
            glass: {
                name: "Glass Morphism",
                primaryColor: '#6366f1',
                secondaryColor: '#8b5cf6',
                accentColor: '#06d6a0',
                backgroundColor: '#0f172a',
                cardBackground: 'rgba(30, 41, 59, 0.8)',
                textColor: '#f1f5f9',
                mutedColor: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)'
            },
            dark: {
                name: "Dark Pro",
                primaryColor: '#3b82f6',
                secondaryColor: '#1e40af',
                accentColor: '#10b981',
                backgroundColor: '#111827',
                cardBackground: '#1f2937',
                textColor: '#f9fafb',
                mutedColor: '#9ca3af',
                borderColor: '#374151'
            },
            purple: {
                name: "Purple Royal",
                primaryColor: '#7e22ce',
                secondaryColor: '#c084fc',
                accentColor: '#f0abfc',
                backgroundColor: '#faf5ff',
                cardBackground: '#ffffff',
                textColor: '#1e1b4b',
                mutedColor: '#7e22ce',
                borderColor: '#e9d5ff'
            },
            gold: {
                name: "Golden Luxury",
                primaryColor: '#d97706',
                secondaryColor: '#f59e0b',
                accentColor: '#fbbf24',
                backgroundColor: '#fffbeb',
                cardBackground: '#ffffff',
                textColor: '#78350f',
                mutedColor: '#d97706',
                borderColor: '#fcd34d'
            }
        };

        document.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const presetName = e.target.dataset.preset;
                this.applyThemePreset(presets[presetName]);
            });
        });

    // Quick action buttons - PERBAIKI INI
    document.querySelectorAll('.quick-actions [data-preset]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const presetName = e.target.dataset.preset;
            const preset = presets[presetName];
            
            if (preset) {
                this.applyThemePreset(preset);
                
                // Simpan ke custom settings dan terapkan
                this.customSettings.theme = { ...preset };
                this.saveCustomSettings();
                this.applyToApp();
                
                Utils.showToast(`🎨 Tema "${preset.name}" diterapkan!`, 'success');
                
                // Refresh app theme
                setTimeout(() => {
                    this.app.refreshTheme();
                }, 500);
            }
        });
    });

    // ... rest of the code tetap sama ...
}

    applyThemePreset(preset) {
        Object.keys(preset).forEach(colorKey => {
            if (colorKey !== 'name') {
                const picker = document.getElementById(colorKey);
                const hexInput = document.getElementById(colorKey + 'Hex');
                
                if (picker && hexInput) {
                    picker.value = preset[colorKey];
                    hexInput.value = preset[colorKey];
                    // Update color value display
                    const colorValue = picker.parentElement.parentElement.querySelector('.color-value');
                    if (colorValue) {
                        colorValue.textContent = preset[colorKey];
                    }
                }
            }
        });
        
        // Update theme name in preview
        const themeNameElement = document.getElementById('currentThemeName');
        if (themeNameElement && preset.name) {
            themeNameElement.textContent = preset.name;
        }
        
        this.updateLivePreview();
    }

    async renderFontCustomization() {
        const container = document.getElementById('fontCustomization');
        const fonts = this.customSettings.typography;

        container.innerHTML = `
            <div class="form-group">
                <label class="form-label">Font Family</label>
                <select class="form-control" id="fontFamily">
                    <option value="system-ui, -apple-system, sans-serif" ${fonts.fontFamily.includes('system-ui') ? 'selected' : ''}>System Default</option>
                    <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" ${fonts.fontFamily.includes('Segoe') ? 'selected' : ''}>Segoe UI</option>
                    <option value="'Inter', sans-serif" ${fonts.fontFamily.includes('Inter') ? 'selected' : ''}>Inter (Modern)</option>
                    <option value="'Roboto', sans-serif" ${fonts.fontFamily.includes('Roboto') ? 'selected' : ''}>Roboto (Google)</option>
                    <option value="'Open Sans', sans-serif" ${fonts.fontFamily.includes('Open Sans') ? 'selected' : ''}>Open Sans</option>
                    <option value="'Poppins', sans-serif" ${fonts.fontFamily.includes('Poppins') ? 'selected' : ''}>Poppins (Elegant)</option>
                    <option value="'Montserrat', sans-serif" ${fonts.fontFamily.includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
                    <option value="'Arial', sans-serif" ${fonts.fontFamily.includes('Arial') ? 'selected' : ''}>Arial</option>
                    <option value="'Georgia', serif" ${fonts.fontFamily.includes('Georgia') ? 'selected' : ''}>Georgia (Serif)</option>
                    <option value="'Courier New', monospace" ${fonts.fontFamily.includes('Courier') ? 'selected' : ''}>Courier (Monospace)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Base Font Size</label>
                <input type="range" class="form-range" id="fontSize" min="12" max="18" step="0.5" value="${parseInt(fonts.fontSize)}">
                <div class="range-value"><span id="fontSizeValue">${fonts.fontSize}</span>px</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Heading Size</label>
                <input type="range" class="form-range" id="headingSize" min="16" max="24" step="0.5" value="${parseInt(fonts.headingSize)}">
                <div class="range-value"><span id="headingSizeValue">${fonts.headingSize}</span>px</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Font Weight</label>
                <select class="form-control" id="fontWeight">
                    <option value="300" ${fonts.fontWeight === '300' ? 'selected' : ''}>Light (300)</option>
                    <option value="400" ${fonts.fontWeight === '400' ? 'selected' : ''}>Regular (400)</option>
                    <option value="500" ${fonts.fontWeight === '500' ? 'selected' : ''}>Medium (500)</option>
                    <option value="600" ${fonts.fontWeight === '600' ? 'selected' : ''}>Semi Bold (600)</option>
                    <option value="700" ${fonts.fontWeight === '700' ? 'selected' : ''}>Bold (700)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Line Height</label>
                <input type="range" class="form-range" id="lineHeight" min="1.2" max="2.0" step="0.1" value="${fonts.lineHeight}">
                <div class="range-value"><span id="lineHeightValue">${fonts.lineHeight}</span></div>
            </div>
            
            <div class="font-preview">
                <div class="font-preview-content">
                    <h4 style="margin: 0 0 8px 0;">Heading Preview</h4>
                    <p style="margin: 0; opacity: 0.8;">This is how your text will look with the selected font settings.</p>
                </div>
            </div>
        `;

        this.setupFontControls();
    }

    setupFontControls() {
        // Font size
        const fontSizeSlider = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        
        fontSizeSlider.addEventListener('input', (e) => {
            fontSizeValue.textContent = e.target.value;
            this.updateFontPreview();
        });

        // Heading size
        const headingSizeSlider = document.getElementById('headingSize');
        const headingSizeValue = document.getElementById('headingSizeValue');
        
        headingSizeSlider.addEventListener('input', (e) => {
            headingSizeValue.textContent = e.target.value;
            this.updateFontPreview();
        });

        // Line height
        const lineHeightSlider = document.getElementById('lineHeight');
        const lineHeightValue = document.getElementById('lineHeightValue');
        
        lineHeightSlider.addEventListener('input', (e) => {
            lineHeightValue.textContent = e.target.value;
            this.updateFontPreview();
        });

        // Other font controls
        document.getElementById('fontFamily').addEventListener('change', () => this.updateFontPreview());
        document.getElementById('fontWeight').addEventListener('change', () => this.updateFontPreview());

        this.updateFontPreview();
    }

    updateFontPreview() {
        const preview = document.querySelector('.font-preview-content');
        if (!preview) return;

        const fontFamily = document.getElementById('fontFamily').value;
        const fontSize = document.getElementById('fontSize').value + 'px';
        const headingSize = document.getElementById('headingSize').value + 'px';
        const fontWeight = document.getElementById('fontWeight').value;
        const lineHeight = document.getElementById('lineHeight').value;

        preview.style.fontFamily = fontFamily;
        preview.style.fontSize = fontSize;
        preview.style.lineHeight = lineHeight;
        preview.querySelector('h4').style.fontSize = headingSize;
        preview.querySelector('h4').style.fontWeight = fontWeight;
    }

    async renderEffectsCustomization() {
        const container = document.getElementById('effectsCustomization');
        const effects = this.customSettings.effects;

        container.innerHTML = `
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="animationsToggle" ${effects.animations ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    Animasi & Transisi
                </label>
                <small class="form-text">Aktifkan animasi halus pada elemen UI</small>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="shadowsToggle" ${effects.shadows ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    Shadow & Depth
                </label>
                <small class="form-text">Tambahkan bayangan untuk efek kedalaman</small>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="hoverEffectsToggle" ${effects.hoverEffects ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    Hover Effects
                </label>
                <small class="form-text">Efek interaktif saat hover</small>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="glassEffectToggle" ${effects.glassEffect ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    Glass Morphism Effect
                </label>
                <small class="form-text">Efek kaca transparan (blur background)</small>
            </div>
            
            <div class="form-group">
                <label class="form-label">Border Radius</label>
                <input type="range" class="form-range" id="borderRadius" min="0" max="20" value="${parseInt(effects.borderRadius)}">
                <div class="range-value"><span id="borderRadiusValue">${effects.borderRadius}</span>px</div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Transition Speed</label>
                <input type="range" class="form-range" id="transitionSpeed" min="0.1" max="1.0" step="0.1" value="${parseFloat(effects.transitionSpeed)}">
                <div class="range-value"><span id="transitionSpeedValue">${effects.transitionSpeed}</span>s</div>
            </div>
            
            <div class="effects-preview">
                <div class="preview-card" style="padding: 15px; text-align: center;">
                    <div class="preview-button">Preview Button</div>
                    <div class="preview-card-inner" style="margin-top: 10px; padding: 10px; background: var(--light-color);">
                        Card Preview
                    </div>
                </div>
            </div>
        `;

        this.setupEffectsControls();
    }

    setupEffectsControls() {
        // Border radius
        const borderRadiusSlider = document.getElementById('borderRadius');
        const borderRadiusValue = document.getElementById('borderRadiusValue');
        
        borderRadiusSlider.addEventListener('input', (e) => {
            borderRadiusValue.textContent = e.target.value + 'px';
            this.updateEffectsPreview();
        });

        // Transition speed
        const transitionSpeedSlider = document.getElementById('transitionSpeed');
        const transitionSpeedValue = document.getElementById('transitionSpeedValue');
        
        transitionSpeedSlider.addEventListener('input', (e) => {
            transitionSpeedValue.textContent = e.target.value + 's';
            this.updateEffectsPreview();
        });

        // Toggles
        document.getElementById('animationsToggle').addEventListener('change', () => this.updateEffectsPreview());
        document.getElementById('shadowsToggle').addEventListener('change', () => this.updateEffectsPreview());
        document.getElementById('hoverEffectsToggle').addEventListener('change', () => this.updateEffectsPreview());
        document.getElementById('glassEffectToggle').addEventListener('change', () => this.updateEffectsPreview());

        this.updateEffectsPreview();
    }

    updateEffectsPreview() {
        const previewCard = document.querySelector('.preview-card');
        const previewButton = document.querySelector('.preview-button');
        const previewCardInner = document.querySelector('.preview-card-inner');
        
        if (!previewCard || !previewButton || !previewCardInner) return;

        const borderRadius = document.getElementById('borderRadius').value + 'px';
        const shadows = document.getElementById('shadowsToggle').checked;
        const glassEffect = document.getElementById('glassEffectToggle').checked;

        // Apply to preview elements
        [previewCard, previewButton, previewCardInner].forEach(el => {
            el.style.borderRadius = borderRadius;
            el.style.boxShadow = shadows ? '0 2px 8px rgba(0,0,0,0.1)' : 'none';
        });

        if (glassEffect) {
            previewCard.style.background = 'rgba(255,255,255,0.1)';
            previewCard.style.backdropFilter = 'blur(10px)';
            previewCard.style.border = '1px solid rgba(255,255,255,0.2)';
        } else {
            previewCard.style.background = '';
            previewCard.style.backdropFilter = '';
            previewCard.style.border = '';
        }
    }

    async renderWidgetsManagement() {
        const container = document.getElementById('widgetsManagement');
        const layout = this.customSettings.layout;

        container.innerHTML = `
            <div class="widgets-grid">
                <div class="widget-toggle-item">
                    <label class="checkbox-label">
                        <input type="checkbox" id="showQuickStats" ${layout.showQuickStats ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Quick Stats
                    </label>
                </div>
                <div class="widget-toggle-item">
                    <label class="checkbox-label">
                        <input type="checkbox" id="showRecentTransactions" ${layout.showRecentTransactions ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Recent Transactions
                    </label>
                </div>
                <div class="widget-toggle-item">
                    <label class="checkbox-label">
                        <input type="checkbox" id="showBudgetProgress" ${layout.showBudgetProgress ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Budget Progress
                    </label>
                </div>
                <div class="widget-toggle-item">
                    <label class="checkbox-label">
                        <input type="checkbox" id="showSavingsGoals" ${layout.showSavingsGoals ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Savings Goals
                    </label>
                </div>
            </div>
            
            <div class="form-group" style="margin-top: 15px;">
                <label class="checkbox-label">
                    <input type="checkbox" id="compactMode" ${layout.compactMode ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    Compact Mode
                </label>
                <small class="form-text">Tampilan lebih padat untuk informasi lebih banyak</small>
            </div>
            
            <div class="form-group">
                <label class="form-label">Card Spacing</label>
                <input type="range" class="form-range" id="cardSpacing" min="10" max="30" value="${parseInt(layout.cardSpacing)}">
                <div class="range-value"><span id="cardSpacingValue">${layout.cardSpacing}</span>px</div>
            </div>
        `;

        this.setupWidgetsControls();
    }

    setupWidgetsControls() {
        // Card spacing
        const cardSpacingSlider = document.getElementById('cardSpacing');
        const cardSpacingValue = document.getElementById('cardSpacingValue');
        
        cardSpacingSlider.addEventListener('input', (e) => {
            cardSpacingValue.textContent = e.target.value + 'px';
        });
    }

    updateLivePreview() {
        const preview = document.getElementById('livePreview');
        if (!preview) return;

        // Get current color values
        const colors = {
            primaryColor: document.getElementById('primaryColor')?.value || '#415c5f',
            secondaryColor: document.getElementById('secondaryColor')?.value || '#bd9b5f',
            accentColor: document.getElementById('accentColor')?.value || '#93713d',
            backgroundColor: document.getElementById('backgroundColor')?.value || '#f6f1e9',
            cardBackground: document.getElementById('cardBackground')?.value || '#ffffff',
            textColor: document.getElementById('textColor')?.value || '#1a1a1a',
            mutedColor: document.getElementById('mutedColor')?.value || '#6c757d',
            borderColor: document.getElementById('borderColor')?.value || '#e9ecef'
        };

        // Update color swatches
        Object.keys(colors).forEach(colorKey => {
            const swatch = preview.querySelector(`.color-swatch.${colorKey.replace('Color', '')}`);
            if (swatch) {
                swatch.style.backgroundColor = colors[colorKey];
            }
        });

        // Update preview elements
        const previewDashboard = preview.querySelector('.preview-dashboard');
        if (previewDashboard) {
            previewDashboard.style.backgroundColor = colors.backgroundColor;
            previewDashboard.style.color = colors.textColor;
        }

        const previewCards = preview.querySelectorAll('.preview-stat-card, .preview-transaction');
        previewCards.forEach(card => {
            card.style.backgroundColor = colors.cardBackground;
            card.style.borderColor = colors.borderColor;
        });

        const previewBadge = preview.querySelector('.preview-badge');
        if (previewBadge) {
            previewBadge.style.backgroundColor = colors.primaryColor;
        }

        const expenseAmount = preview.querySelector('.preview-transaction-amount.expense');
        if (expenseAmount) {
            expenseAmount.style.color = colors.accentColor;
        }

        // Update theme name
        const themeNameElement = document.getElementById('currentThemeName');
        if (themeNameElement) {
            const primaryName = this.getColorName(colors.primaryColor);
            const secondaryName = this.getColorName(colors.secondaryColor);
            const accentName = this.getColorName(colors.accentColor);
            const bgName = this.getColorName(colors.backgroundColor);
            
            themeNameElement.textContent = `${primaryName} • ${secondaryName} • ${accentName} • ${bgName}`;
        }
    }

    getColorName(hex) {
        const colorNames = {
            '#415c5f': 'Mineral Green',
            '#bd9b5f': 'Twine',
            '#93713d': 'Cape Palliser',
            '#f6f1e9': 'Ecru White',
            '#0077b6': 'Ocean Blue',
            '#00b4d8': 'Vivid Sky Blue',
            '#2a9d8f': 'Persian Green',
            '#e9c46a': 'Orange Yellow',
            '#ff6b35': 'Portland Orange',
            '#ff9e00': 'Orange Peel',
            '#7209b7': 'Purple',
            '#3a86ff': 'Azure',
            '#dc2626': 'Crimson Red',
            '#ef4444': 'Red Orange',
            '#6366f1': 'Indigo',
            '#8b5cf6': 'Lavender',
            '#1e293b': 'Dark Blue Gray',
            '#475569': 'Slate Gray',
            '#7e22ce': 'Purple Heart',
            '#c084fc': 'Lavender',
            '#d97706': 'Ochre',
            '#f59e0b': 'Amber'
        };
        
        return colorNames[hex] || hex;
    }

    setupFloatingPreview() {
    const toggle = document.getElementById('floatingPreviewToggle');
    const preview = document.getElementById('livePreview');
    
    if (!toggle || !preview) return;
    
    // Load saved preference
    const isFloating = localStorage.getItem('floatingPreview') === 'true';
    this.toggleFloatingPreview(isFloating);
    
    // Toggle event
    toggle.addEventListener('change', (e) => {
        const isFloating = e.target.checked;
        localStorage.setItem('floatingPreview', isFloating);
        this.toggleFloatingPreview(isFloating);
        
        if (isFloating) {
            this.makePreviewDraggable();
        }
    });
    
    // Initialize draggable if already floating
    if (isFloating) {
        setTimeout(() => this.makePreviewDraggable(), 100);
    }
}

toggleFloatingPreview(isFloating) {
    const preview = document.getElementById('livePreview');
    const toggle = document.getElementById('floatingPreviewToggle');
    
    if (!preview) return;
    
    if (isFloating) {
        // Add floating preview header
        if (!preview.querySelector('.floating-preview-header')) {
            const header = document.createElement('div');
            header.className = 'floating-preview-header';
            header.innerHTML = `
                <h5>🎨 Live Preview</h5>
                <div class="floating-preview-actions">
                    <button onclick="window.app.settingsPersonalizationModule.closeFloatingPreview()" title="Tutup">✕</button>
                </div>
            `;
            preview.insertBefore(header, preview.firstChild);
        }
        
        preview.classList.add('floating-preview');
        preview.classList.add('floating-active');
        
        // Add resize handle
        if (!preview.querySelector('.floating-preview-resize')) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'floating-preview-resize';
            preview.appendChild(resizeHandle);
        }
        
        if (toggle) toggle.checked = true;
        
        // Load saved position
        const savedPosition = localStorage.getItem('floatingPreviewPosition');
        if (savedPosition) {
            const { x, y, width, height } = JSON.parse(savedPosition);
            preview.style.left = x + 'px';
            preview.style.top = y + 'px';
            if (width) preview.style.width = width + 'px';
            if (height) preview.style.height = height + 'px';
        }
    } else {
        preview.classList.remove('floating-preview');
        preview.classList.remove('floating-active');
        
        // Remove header and resize handle
        const header = preview.querySelector('.floating-preview-header');
        const resizeHandle = preview.querySelector('.floating-preview-resize');
        if (header) header.remove();
        if (resizeHandle) resizeHandle.remove();
        
        // Reset styles
        preview.style.left = '';
        preview.style.top = '';
        preview.style.width = '';
        preview.style.height = '';
        
        if (toggle) toggle.checked = false;
    }
}

makePreviewDraggable() {
    const preview = document.getElementById('livePreview');
    if (!preview || !preview.classList.contains('floating-active')) return;
    
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    
    const header = preview.querySelector('.floating-preview-header');
    const resizeHandle = preview.querySelector('.floating-preview-resize');
    
    if (!header || !resizeHandle) return;
    
    // Drag functionality
    header.addEventListener('mousedown', startDrag);
    header.addEventListener('touchstart', startDrag);
    
    // Resize functionality
    resizeHandle.addEventListener('mousedown', startResize);
    resizeHandle.addEventListener('touchstart', startResize);
    
    function startDrag(e) {
        if (!preview.classList.contains('floating-active')) return;
        
        isDragging = true;
        preview.style.cursor = 'grabbing';
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        startX = clientX - preview.offsetLeft;
        startY = clientY - preview.offsetTop;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging && !isResizing) return;
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        if (isDragging) {
            let newX = clientX - startX;
            let newY = clientY - startY;
            
            // Boundary checking
            const maxX = window.innerWidth - preview.offsetWidth;
            const maxY = window.innerHeight - preview.offsetHeight;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            preview.style.left = newX + 'px';
            preview.style.top = newY + 'px';
        }
        
        if (isResizing) {
            const newWidth = Math.max(280, startWidth + (clientX - startX));
            const newHeight = Math.max(200, startHeight + (clientY - startY));
            
            preview.style.width = newWidth + 'px';
            preview.style.height = newHeight + 'px';
        }
    }
    
    function startResize(e) {
        if (!preview.classList.contains('floating-active')) return;
        
        isResizing = true;
        preview.style.cursor = 'nwse-resize';
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(preview).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(preview).height, 10);
        startLeft = preview.offsetLeft;
        startTop = preview.offsetTop;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
        preview.style.cursor = 'grab';
        savePreviewPosition();
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
    }
    
    function stopResize() {
        isResizing = false;
        preview.style.cursor = 'grab';
        savePreviewPosition();
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
    }
    
    function savePreviewPosition() {
        const position = {
            x: preview.offsetLeft,
            y: preview.offsetTop,
            width: parseInt(preview.style.width) || 320,
            height: parseInt(preview.style.height) || 400
        };
        localStorage.setItem('floatingPreviewPosition', JSON.stringify(position));
    }
}

closeFloatingPreview() {
    const toggle = document.getElementById('floatingPreviewToggle');
    if (toggle) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
    }
}

    applyPersonalization() {
    if (this.isApplying) return;
    this.isApplying = true;

    try {
        // Collect all current settings
        const newSettings = { ...this.customSettings };

        // Colors - dengan validasi
        newSettings.theme = {
            primaryColor: document.getElementById('primaryColor')?.value || '#415c5f',
            secondaryColor: document.getElementById('secondaryColor')?.value || '#bd9b5f',
            accentColor: document.getElementById('accentColor')?.value || '#93713d',
            backgroundColor: document.getElementById('backgroundColor')?.value || '#f6f1e9',
            cardBackground: document.getElementById('cardBackground')?.value || '#ffffff',
            textColor: document.getElementById('textColor')?.value || '#1a1a1a',
            mutedColor: document.getElementById('mutedColor')?.value || '#6c757d',
            borderColor: document.getElementById('borderColor')?.value || '#e9ecef'
        };

        // Typography
        newSettings.typography = {
            fontFamily: document.getElementById('fontFamily')?.value || "'Inter', 'Segoe UI', system-ui, sans-serif",
            fontSize: (document.getElementById('fontSize')?.value || '14') + 'px',
            headingSize: (document.getElementById('headingSize')?.value || '18') + 'px',
            fontWeight: document.getElementById('fontWeight')?.value || '400',
            lineHeight: document.getElementById('lineHeight')?.value || '1.6'
        };

        // Effects
        newSettings.effects = {
            animations: document.getElementById('animationsToggle')?.checked || true,
            shadows: document.getElementById('shadowsToggle')?.checked || true,
            borderRadius: (document.getElementById('borderRadius')?.value || '12') + 'px',
            transitionSpeed: (document.getElementById('transitionSpeed')?.value || '0.3') + 's',
            hoverEffects: document.getElementById('hoverEffectsToggle')?.checked || true,
            glassEffect: document.getElementById('glassEffectToggle')?.checked || false
        };

        // Layout
        newSettings.layout = {
            showQuickStats: document.getElementById('showQuickStats')?.checked || true,
            showRecentTransactions: document.getElementById('showRecentTransactions')?.checked || true,
            showBudgetProgress: document.getElementById('showBudgetProgress')?.checked || true,
            showSavingsGoals: document.getElementById('showSavingsGoals')?.checked || true,
            compactMode: document.getElementById('compactMode')?.checked || false,
            cardSpacing: (document.getElementById('cardSpacing')?.value || '20') + 'px',
            sidebarWidth: newSettings.layout?.sidebarWidth || '250px'
        };

        // Save and apply
        this.customSettings = newSettings;
        this.saveCustomSettings();
        this.applyToApp();

        Utils.showToast('🎨 Personalisasi berhasil diterapkan!', 'success');
        
        // Refresh yang lebih smooth tanpa reload penuh
        setTimeout(() => {
            this.app.refreshTheme();
        }, 1000);

    } catch (error) {
        console.error('Error applying personalization:', error);
        Utils.showToast('❌ Gagal menerapkan pengaturan', 'error');
    } finally {
        this.isApplying = false;
    }
}

applyToApp() {
    const settings = this.customSettings;
    const root = document.documentElement;
    
    console.log('🎨 Applying theme settings:', settings.theme);

    // Mapping yang benar antara key settings dan nama CSS variable
    const colorMappings = {
        primaryColor: '--primary-color',
        secondaryColor: '--secondary-color',
        accentColor: '--accent-color', 
        backgroundColor: '--background-color',
        cardBackground: '--card-background',
        textColor: '--text-color',
        mutedColor: '--muted-color',
        borderColor: '--border-color'
    };

    // Apply colors dengan mapping yang konsisten
    Object.keys(settings.theme).forEach(key => {
        const cssVar = colorMappings[key];
        if (cssVar && settings.theme[key]) {
            root.style.setProperty(cssVar, settings.theme[key]);
            console.log(`✅ Set ${cssVar} to ${settings.theme[key]}`);
        }
    });

    // Apply typography
    if (settings.typography) {
        root.style.setProperty('--font-family', settings.typography.fontFamily);
        root.style.setProperty('--font-size', settings.typography.fontSize);
        root.style.setProperty('--heading-size', settings.typography.headingSize);
        root.style.setProperty('--font-weight', settings.typography.fontWeight);
        root.style.setProperty('--line-height', settings.typography.lineHeight);
    }

    // Apply effects
    if (settings.effects) {
        root.style.setProperty('--border-radius', settings.effects.borderRadius);
        root.style.setProperty('--transition-speed', settings.effects.transitionSpeed);
        
        // Handle animations
        if (!settings.effects.animations) {
            document.body.style.setProperty('--transition-speed', '0s');
        } else {
            document.body.style.setProperty('--transition-speed', settings.effects.transitionSpeed);
        }
        
        // Handle shadows
        if (!settings.effects.shadows) {
            root.style.setProperty('--shadow-sm', 'none');
            root.style.setProperty('--shadow-md', 'none'); 
            root.style.setProperty('--shadow-lg', 'none');
        } else {
            root.style.setProperty('--shadow-sm', '0 2px 5px rgba(0,0,0,0.1)');
            root.style.setProperty('--shadow-md', '0 4px 15px rgba(0,0,0,0.1)');
            root.style.setProperty('--shadow-lg', '0 8px 25px rgba(0,0,0,0.15)');
        }
    }

    // Save layout preferences
    if (settings.layout) {
        localStorage.setItem('dashboardLayout', JSON.stringify(settings.layout));
    }

    // Force button redraw untuk memastikan perubahan diterapkan
    this.forceButtonRedraw();
    
    console.log('🎨 Theme application completed');
}

// Tambahkan method forceButtonRedraw()
forceButtonRedraw() {
    // Force CSS recalculation untuk semua tombol
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        // Trigger reflow untuk memaksa update CSS
        btn.style.display = 'none';
        void btn.offsetHeight; // Trigger reflow
        btn.style.display = '';
    });
    
    console.log(`🔄 Redrew ${buttons.length} buttons`);
}

    resetPersonalization() {
        if (confirm('Yakin ingin mengembalikan semua pengaturan ke default?')) {
            localStorage.removeItem('personalizationSettings');
            localStorage.removeItem('dashboardLayout');
            localStorage.removeItem('savedThemes');
            
            this.customSettings = this.loadCustomSettings();
            this.saveCustomSettings();
            this.applyToApp();
            
            Utils.showToast('♻️ Pengaturan dikembalikan ke default!', 'success');
            
            // Reload the module to reflect changes
            setTimeout(() => {
                const container = document.querySelector('.module-content');
                if (container) {
                    this.render(container);
                }
            }, 1000);
        }
    }

    showSaveThemeModal() {
        const savedThemes = this.getSavedThemes();
        const themesList = document.getElementById('savedThemesList');
        
        if (themesList) {
            if (savedThemes.length === 0) {
                themesList.innerHTML = '<div class="empty-state"><div class="emoji">🎨</div><p>Belum ada tema tersimpan.</p></div>';
            } else {
                themesList.innerHTML = savedThemes.map(theme => `
                    <div class="saved-theme-item">
                        <div class="theme-preview" style="background: ${theme.settings.theme.backgroundColor}; border-color: ${theme.settings.theme.borderColor}">
                            <div class="theme-colors">
                                <div class="theme-color" style="background: ${theme.settings.theme.primaryColor}"></div>
                                <div class="theme-color" style="background: ${theme.settings.theme.secondaryColor}"></div>
                                <div class="theme-color" style="background: ${theme.settings.theme.accentColor}"></div>
                            </div>
                        </div>
                        <div class="theme-info">
                            <strong>${theme.name}</strong>
                            <small>${new Date(theme.createdAt).toLocaleDateString()}</small>
                        </div>
                        <div class="theme-actions">
                            <button class="btn btn-sm btn-info" onclick="window.app.settingsPersonalizationModule.applySavedTheme('${theme.id}')">Apply</button>
                            <button class="btn btn-sm btn-danger" onclick="window.app.settingsPersonalizationModule.deleteTheme('${theme.id}')">Hapus</button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        Utils.openModal('savedThemesModal');
        document.getElementById('newThemeName').value = '';
        document.getElementById('newThemeName').focus();
    }

    saveCurrentAsTheme() {
        const themeName = document.getElementById('newThemeName').value.trim();
        if (!themeName) {
            Utils.showToast('Masukkan nama tema terlebih dahulu!', 'error');
            return;
        }

        const savedThemes = this.getSavedThemes();
        
        // Check for duplicate names
        if (savedThemes.some(theme => theme.name.toLowerCase() === themeName.toLowerCase())) {
            Utils.showToast('Nama tema sudah ada!', 'error');
            return;
        }

        const newTheme = {
            id: DB.generateId(),
            name: themeName,
            settings: this.customSettings,
            createdAt: new Date().toISOString()
        };

        savedThemes.push(newTheme);
        this.saveThemes(savedThemes);
        
        Utils.closeModal('savedThemesModal');
        Utils.showToast(`🎨 Tema "${themeName}" berhasil disimpan!`, 'success');
        
        // Refresh the modal to show the new theme
        setTimeout(() => this.showSaveThemeModal(), 500);
    }

    applySavedTheme(themeId) {
        const savedThemes = this.getSavedThemes();
        const theme = savedThemes.find(t => t.id === themeId);
        
        if (theme) {
            this.customSettings = theme.settings;
            this.saveCustomSettings();
            this.applyToApp();
            
            Utils.closeModal('savedThemesModal');
            Utils.showToast(`🎨 Tema "${theme.name}" diterapkan!`, 'success');
            
            // Reload the module to reflect changes
            setTimeout(() => {
                const container = document.querySelector('.module-content');
                if (container) {
                    this.render(container);
                }
            }, 1000);
        }
    }

    deleteTheme(themeId) {
        if (confirm('Yakin ingin menghapus tema ini?')) {
            const savedThemes = this.getSavedThemes();
            const updatedThemes = savedThemes.filter(t => t.id !== themeId);
            
            this.saveThemes(updatedThemes);
            Utils.showToast('Tema berhasil dihapus!', 'success');
            
            // Refresh the modal
            this.showSaveThemeModal();
        }
    }

    getSavedThemes() {
        const saved = localStorage.getItem('savedThemes');
        return saved ? JSON.parse(saved) : [];
    }

    saveThemes(themes) {
        localStorage.setItem('savedThemes', JSON.stringify(themes));
    }

    exportTheme() {
        const themeData = {
            name: 'Custom Theme Export',
            version: '1.0',
            exportedAt: new Date().toISOString(),
            settings: this.customSettings
        };

        const dataStr = JSON.stringify(themeData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `theme-${new Date().getTime()}.json`;
        link.click();
        
        Utils.showToast('🎨 Tema berhasil di-export!', 'success');
    }

    importTheme(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const themeData = JSON.parse(e.target.result);
                
                if (themeData.settings) {
                    if (confirm('Import tema ini? Pengaturan saat ini akan diganti.')) {
                        this.customSettings = themeData.settings;
                        this.saveCustomSettings();
                        this.applyToApp();
                        
                        Utils.showToast('🎨 Tema berhasil di-import!', 'success');
                        
                        // Reload the module
                        setTimeout(() => {
                            const container = document.querySelector('.module-content');
                            if (container) {
                                this.render(container);
                            }
                        }, 1000);
                    }
                } else {
                    Utils.showToast('File tema tidak valid!', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                Utils.showToast('Gagal membaca file tema!', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    }
}