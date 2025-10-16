// js/database.js (Fixed Version dengan Error Handling)

export const DB = {
    db: null,
    dbName: 'FinanceSuperAppDB',
    dbVersion: 3,
    isInitialized: false,
    initPromise: null,

    // ====================================================================
    // 1. INISIALISASI & KONEKSI DATABASE
    // ====================================================================
    async init() {
        // Jika sudah terkoneksi, return langsung
        if (this.db && this.isInitialized) {
            return Promise.resolve(this.db);
        }

        // Jika sedang dalam proses inisialisasi, return promise yang sama
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            console.log('🔄 Initializing IndexedDB connection...');
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                this.initPromise = null;
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isInitialized = true;
                console.log('✅ IndexedDB connection successful.');
                this.initPromise = null;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🚀 Upgrading IndexedDB schema...');

                const objectStores = [
                    { name: 'wallets', key: 'id' },
                    { name: 'categories', key: 'id' },
                    { name: 'transactions', key: 'id' },
                    { name: 'budgets', key: 'id' },
                    { name: 'goldWallets', key: 'id' },
                    { name: 'goldTransactions', key: 'id' },
                    { name: 'currentGoldPrice', key: 'id' },
                    { name: 'savingsGoals', key: 'id' },
                    { name: 'savingsTransactions', key: 'id' },
                    { name: 'billReminders', key: 'id' },
                    { name: 'liabilities', key: 'id' },
                    { name: 'liabilityPayments', key: 'id' },
                    { name: 'schedules', key: 'id' },
                    { name: 'userProfile', key: 'id' } 
                ];

                objectStores.forEach(storeInfo => {
                    if (!db.objectStoreNames.contains(storeInfo.name)) {
                        db.createObjectStore(storeInfo.name, { keyPath: storeInfo.key });
                        console.log(`- Object store '${storeInfo.name}' created.`);
                    }
                });
            };
        });

        return this.initPromise;
    },

    // ====================================================================
    // 2. FUNGSI PEMBANTU (HELPERS) GENERIC dengan Error Handling
    // ====================================================================
    async ensureDBReady() {
        if (!this.isInitialized || !this.db) {
            await this.init();
        }
    },

    async getAll(storeName) {
        try {
            await this.ensureDBReady();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();
                    
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = (e) => {
                        console.error(`Error getting all from ${storeName}:`, e.target.error);
                        resolve([]);
                    };
                    
                    transaction.onerror = (e) => {
                        console.error(`Transaction error for ${storeName}:`, e.target.error);
                        resolve([]);
                    };
                } catch (error) {
                    console.error(`Error in getAll for ${storeName}:`, error);
                    resolve([]);
                }
            });
        } catch (error) {
            console.error(`Failed to ensure DB ready for ${storeName}:`, error);
            return [];
        }
    },
    
    async saveAll(storeName, dataArray) {
        try {
            await this.ensureDBReady();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    
                    // Clear store first
                    const clearRequest = store.clear();
                    
                    clearRequest.onsuccess = () => {
                        // Add all items
                        const promises = dataArray.map(item => {
                            return new Promise((resolveItem, rejectItem) => {
                                const putRequest = store.put(item);
                                putRequest.onsuccess = () => resolveItem();
                                putRequest.onerror = (e) => rejectItem(e.target.error);
                            });
                        });
                        
                        Promise.all(promises)
                            .then(() => resolve(true))
                            .catch(error => {
                                console.error(`Error saving items to ${storeName}:`, error);
                                resolve(false);
                            });
                    };
                    
                    clearRequest.onerror = (e) => {
                        console.error(`Error clearing ${storeName}:`, e.target.error);
                        resolve(false);
                    };
                    
                } catch (error) {
                    console.error(`Error in saveAll for ${storeName}:`, error);
                    resolve(false);
                }
            });
        } catch (error) {
            console.error(`Failed to ensure DB ready for saveAll ${storeName}:`, error);
            return false;
        }
    },
    
    async getById(storeName, id) {
        try {
            await this.ensureDBReady();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.get(id);
                    
                    request.onsuccess = () => resolve(request.result || null);
                    request.onerror = (e) => {
                        console.error(`Error getting by id from ${storeName}:`, e.target.error);
                        resolve(null);
                    };
                    
                } catch (error) {
                    console.error(`Error in getById for ${storeName}:`, error);
                    resolve(null);
                }
            });
        } catch (error) {
            console.error(`Failed to ensure DB ready for getById ${storeName}:`, error);
            return null;
        }
    },

    async addItem(storeName, item) {
        try {
            await this.ensureDBReady();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.add(item);
                    
                    request.onsuccess = () => resolve(item);
                    request.onerror = (e) => {
                        console.error(`Error adding item to ${storeName}:`, e.target.error);
                        resolve(null);
                    };
                    
                } catch (error) {
                    console.error(`Error in addItem for ${storeName}:`, error);
                    resolve(null);
                }
            });
        } catch (error) {
            console.error(`Failed to ensure DB ready for addItem ${storeName}:`, error);
            return null;
        }
    },

    async updateItem(storeName, id, updates) {
        try {
            await this.ensureDBReady();
            
            return new Promise(async (resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    
                    const getRequest = store.get(id);
                    getRequest.onsuccess = () => {
                        const existingItem = getRequest.result;
                        if (!existingItem) {
                            console.warn(`Item with id ${id} not found in ${storeName}`);
                            resolve(null);
                            return;
                        }
                        
                        const updatedItem = { ...existingItem, ...updates };
                        const putRequest = store.put(updatedItem);
                        putRequest.onsuccess = () => resolve(updatedItem);
                        putRequest.onerror = (e) => {
                            console.error(`Error updating item in ${storeName}:`, e.target.error);
                            resolve(null);
                        };
                    };
                    
                    getRequest.onerror = (e) => {
                        console.error(`Error getting item for update from ${storeName}:`, e.target.error);
                        resolve(null);
                    };
                    
                } catch (error) {
                    console.error(`Error in updateItem for ${storeName}:`, error);
                    resolve(null);
                }
            });
        } catch (error) {
            console.error(`Failed to ensure DB ready for updateItem ${storeName}:`, error);
            return null;
        }
    },

    async deleteItem(storeName, id) {
        try {
            await this.ensureDBReady();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = this.db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.delete(id);
                    
                    request.onsuccess = () => resolve(true);
                    request.onerror = (e) => {
                        console.error(`Error deleting item from ${storeName}:`, e.target.error);
                        resolve(false);
                    };
                    
                } catch (error) {
                    console.error(`Error in deleteItem for ${storeName}:`, error);
                    resolve(false);
                }
            });
        } catch (error) {
            console.error(`Failed to ensure DB ready for deleteItem ${storeName}:`, error);
            return false;
        }
    },

    // ====================================================================
    // 3. PUBLIC API (FUNGSI-FUNGSI YANG DIPAKAI APLIKASI)
    // ====================================================================
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),

    // Wallets
    async getWallets() { 
        const wallets = await this.getAll('wallets');
        return wallets.length > 0 ? wallets : [
            { id: this.generateId(), name: 'Cash', balance: 500000, emoji: '💵' },
            { id: this.generateId(), name: 'Bank Account', balance: 1500000, emoji: '💳' }
        ];
    },
    async saveWallets(wallets) { return this.saveAll('wallets', wallets); },

    // Categories
    async getCategories() { 
        const categories = await this.getAll('categories');
        return categories.length > 0 ? categories : [
            { id: this.generateId(), name: 'Food', type: 'expense', emoji: '🍔' },
            { id: this.generateId(), name: 'Transport', type: 'expense', emoji: '🚌' },
            { id: this.generateId(), name: 'Salary', type: 'income', emoji: '💰' }
        ];
    },
    async saveCategories(categories) { return this.saveAll('categories', categories); },
    async getCategoryById(id) { return this.getById('categories', id); },

    // Transactions
    async getTransactions() { return this.getAll('transactions'); },
    async saveTransactions(transactions) { return this.saveAll('transactions', transactions); },

    // Budgets
    async getBudgets() { return this.getAll('budgets'); },
    async saveBudgets(budgets) { return this.saveAll('budgets', budgets); },

    // Gold
    async getGoldWallets() { return this.getAll('goldWallets'); },
    async saveGoldWallets(wallets) { return this.saveAll('goldWallets', wallets); },
    async getGoldTransactions() { return this.getAll('goldTransactions'); },
    async saveGoldTransactions(transactions) { return this.saveAll('goldTransactions', transactions); },
    async getGoldPrice() { 
        const price = await this.getById('currentGoldPrice', 'current');
        return price || { buy: 1200000, sell: 1150000, source: 'Default' };
    },
    async saveGoldPrice(price) {
        const priceObject = {
            ...price,
            id: 'current',
            lastUpdate: new Date().toISOString()
        };
        const transaction = this.db.transaction('currentGoldPrice', 'readwrite');
        transaction.objectStore('currentGoldPrice').put(priceObject);
        return true;
    },

    // Liabilities
    async getLiabilities() { return this.getAll('liabilities'); },
    async saveLiabilities(liabilities) { return this.saveAll('liabilities', liabilities); },
    async getLiabilityPayments() { return this.getAll('liabilityPayments'); },
    async saveLiabilityPayments(payments) { return this.saveAll('liabilityPayments', payments); },

    // Savings & Bills
    async getSavingsGoals() { return this.getAll('savingsGoals'); },
    async saveSavingsGoals(goals) { return this.saveAll('savingsGoals', goals); },
    async getSavingsTransactions() { return this.getAll('savingsTransactions'); },
    async saveSavingsTransactions(transactions) { return this.saveAll('savingsTransactions', transactions); },
    async getBillReminders() { return this.getAll('billReminders'); },
    async saveBillReminders(reminders) { return this.saveAll('billReminders', reminders); },

    // Schedules
    async getSchedules() { return this.getAll('schedules'); },
    async addSchedule(schedule) {
        const scheduleWithId = {
            ...schedule,
            id: this.generateId(),
            createdAt: new Date().toISOString()
        };
        return await this.addItem('schedules', scheduleWithId);
    },
    async getSchedule(id) { return this.getById('schedules', id); },
    async updateSchedule(id, updates) { return this.updateItem('schedules', id, updates); },
    async deleteSchedule(id) { return this.deleteItem('schedules', id); },

    // User Profile
    async getUserProfile() {
        return await this.getById('userProfile', 'main');
    },
    async saveUserProfile(name) {
        const profile = { id: 'main', name, createdAt: new Date().toISOString() };
        const tx = this.db.transaction('userProfile', 'readwrite');
        tx.objectStore('userProfile').put(profile);
        return profile;
    },

    // Personalization
    async getPersonalizationSettings() {
        try {
            const settings = localStorage.getItem('personalizationSettings');
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Error getting personalization settings:', error);
            return null;
        }
    },

    async savePersonalizationSettings(settings) {
        try {
            localStorage.setItem('personalizationSettings', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving personalization settings:', error);
            return false;
        }
    },

    async getSavedThemes() {
        try {
            const themes = localStorage.getItem('savedThemes');
            return themes ? JSON.parse(themes) : [];
        } catch (error) {
            console.error('Error getting saved themes:', error);
            return [];
        }
    },

    async saveSavedThemes(themes) {
        try {
            localStorage.setItem('savedThemes', JSON.stringify(themes));
            return true;
        } catch (error) {
            console.error('Error saving themes:', error);
            return false;
        }
    },

    // ====================================================================
    // 4. FUNGSI UTILITAS (Backup, Restore, etc.)
    // ====================================================================
    async backupData() {
        try {
            await this.ensureDBReady();
            
            const [
                wallets, categories, transactions, budgets, goldWallets, 
                goldTransactions, currentGoldPrice, liabilities, liabilityPayments, 
                savingsGoals, savingsTransactions, billReminders, schedules
            ] = await Promise.all([
                this.getWallets(), this.getCategories(), this.getTransactions(),
                this.getBudgets(), this.getGoldWallets(), this.getGoldTransactions(),
                this.getGoldPrice(), this.getLiabilities(), this.getLiabilityPayments(),
                this.getSavingsGoals(), this.getSavingsTransactions(), this.getBillReminders(),
                this.getSchedules()
            ]);

            const data = {
                wallets, categories, transactions, budgets, goldWallets, goldTransactions,
                currentGoldPrice, liabilities, liabilityPayments, savingsGoals,
                savingsTransactions, billReminders, schedules,
                exportedAt: new Date().toISOString(),
                version: '3.1'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('💾 Backup complete.');
            return true;
        } catch (e) {
            console.error('Backup error:', e);
            return false;
        }
    },

    async restoreData(jsonData) {
        try {
            await this.ensureDBReady();
            
            const data = JSON.parse(jsonData);
            if (!data.wallets || !data.categories) {
                throw new Error('Invalid backup file format.');
            }

            console.log('🔄 Restoring data...');

            await Promise.all([
                this.saveAll('wallets', data.wallets || []),
                this.saveAll('categories', data.categories || []),
                this.saveAll('transactions', data.transactions || []),
                this.saveAll('budgets', data.budgets || []),
                this.saveAll('goldWallets', data.goldWallets || []),
                this.saveAll('goldTransactions', data.goldTransactions || []),
                this.saveAll('liabilities', data.liabilities || []),
                this.saveAll('liabilityPayments', data.liabilityPayments || []),
                this.saveAll('savingsGoals', data.savingsGoals || []),
                this.saveAll('savingsTransactions', data.savingsTransactions || []),
                this.saveAll('billReminders', data.billReminders || []),
                this.saveAll('schedules', data.schedules || []),
                this.saveGoldPrice(data.currentGoldPrice || { buy: 1000000, sell: 980000, source: 'Restored' })
            ]);
            
            console.log('🎉 Restore successful!');
            return true;
        } catch (e) {
            console.error('Restore error:', e);
            return false;
        }
    },

    async clearAllData() {
        try {
            await this.ensureDBReady();
            
            const stores = [
                'wallets', 'categories', 'transactions', 'budgets', 
                'goldWallets', 'goldTransactions', 'savingsGoals', 
                'savingsTransactions', 'billReminders', 'liabilities', 
                'liabilityPayments', 'schedules'
            ];

            await Promise.all(stores.map(storeName => 
                this.saveAll(storeName, [])
            ));

            await this.saveGoldPrice({ buy: 1000000, sell: 980000, source: 'Reset' });
            
            console.log('🧹 All data cleared successfully.');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
};
