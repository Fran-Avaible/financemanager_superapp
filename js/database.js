// js/database.js (Versi Final dengan Fitur Schedule)

export const DB = {
    db: null,
    dbName: 'FinanceSuperAppDB',
    dbVersion: 3, // Ubah versi menjadi 2 untuk menambahkan store schedules

    // ====================================================================
    // 1. INISIALISASI & KONEKSI DATABASE
    // ====================================================================
    async init() {
        if (this.db) return Promise.resolve(this.db); // Jika sudah terkoneksi, jangan buka lagi

        return new Promise((resolve, reject) => {
            console.log('🔄 Initializing IndexedDB connection...');
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ IndexedDB connection successful.');
                resolve(this.db);
            };

            // Fungsi ini hanya berjalan saat database dibuat pertama kali atau saat versi diubah
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;
                console.log('🚀 Upgrading IndexedDB schema...');

                const objectStores = [
                    { name: 'wallets', key: 'id' },
                    { name: 'categories', key: 'id' },
                    { name: 'transactions', key: 'id' },
                    { name: 'budgets', key: 'id' },
                    { name: 'goldWallets', key: 'id' },
                    { name: 'goldTransactions', key: 'id' },
                    { name: 'currentGoldPrice', key: 'id' }, // Hanya akan ada 1 item di sini
                    { name: 'savingsGoals', key: 'id' },
                    { name: 'savingsTransactions', key: 'id' },
                    { name: 'billReminders', key: 'id' },
                    { name: 'liabilities', key: 'id' },
                    { name: 'liabilityPayments', key: 'id' },
                    { name: 'schedules', key: 'id' }, // Tambahkan store untuk schedules
                    { name: 'userProfile', key: 'id' } 
                ];

                objectStores.forEach(storeInfo => {
                    if (!db.objectStoreNames.contains(storeInfo.name)) {
                        db.createObjectStore(storeInfo.name, { keyPath: storeInfo.key });
                        console.log(`- Object store '${storeInfo.name}' created.`);
                    }
                });
                
                // Panggil fungsi untuk mengisi data default setelah semua store dibuat
                this.initDefaultData(transaction);
            };
        });
    },

    initDefaultData(transaction) {
        console.log('🌱 Seeding default data...');
        
        // Data default hanya diisi jika store-nya kosong
        const walletsStore = transaction.objectStore('wallets');
        walletsStore.count().onsuccess = (e) => {
            if (e.target.result === 0) {
                walletsStore.add({ id: this.generateId(), name: 'Cash', balance: 500000, emoji: '💵' });
                walletsStore.add({ id: this.generateId(), name: 'Bank Account', balance: 1500000, emoji: '💳' });
                console.log('...Default wallets added.');
            }
        };

        const categoriesStore = transaction.objectStore('categories');
        categoriesStore.count().onsuccess = (e) => {
            if (e.target.result === 0) {
                categoriesStore.add({ id: this.generateId(), name: 'Food', type: 'expense', emoji: '🍔' });
                categoriesStore.add({ id: this.generateId(), name: 'Transport', type: 'expense', emoji: '🚌' });
                categoriesStore.add({ id: this.generateId(), name: 'Salary', type: 'income', emoji: '💰' });
                console.log('...Default categories added.');
            }
        };

        const goldPriceStore = transaction.objectStore('currentGoldPrice');
        goldPriceStore.count().onsuccess = (e) => {
            if (e.target.result === 0) {
                goldPriceStore.add({ id: 'current', buy: 1000000, sell: 980000, source: 'Initial' });
                console.log('...Default gold price set.');
            }
        };

        // Data default untuk schedules (opsional)
        const schedulesStore = transaction.objectStore('schedules');
        schedulesStore.count().onsuccess = (e) => {
            if (e.target.result === 0) {
                const today = new Date().toISOString().split('T')[0];
                schedulesStore.add({
                    id: this.generateId(),
                    title: 'Meeting Rutin',
                    description: 'Meeting mingguan dengan tim',
                    date: today,
                    type: 'meeting',
                    startTime: '09:00',
                    endTime: '10:00',
                    status: 'pending',
                    isRecurring: false,
                    createdAt: new Date().toISOString()
                });
                console.log('...Default schedule added.');
            }
        };
    },

    // ====================================================================
    // 2. FUNGSI PEMBANTU (HELPERS) GENERIC
    // ====================================================================
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    
    async saveAll(storeName, dataArray) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            store.clear(); // Hapus semua data lama
            dataArray.forEach(item => store.put(item)); // Masukkan data baru
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = (e) => reject(e.target.error);
        });
    },
    
    async getById(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async addItem(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            request.onsuccess = () => resolve(item);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async updateItem(storeName, id, updates) {
        return new Promise(async (resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Ambil data yang sudah ada
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const existingItem = getRequest.result;
                if (!existingItem) {
                    reject(new Error('Item not found'));
                    return;
                }
                
                // Update data
                const updatedItem = { ...existingItem, ...updates };
                const putRequest = store.put(updatedItem);
                putRequest.onsuccess = () => resolve(updatedItem);
                putRequest.onerror = (e) => reject(e.target.error);
            };
            getRequest.onerror = (e) => reject(e.target.error);
        });
    },

    async deleteItem(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    },

        async getUserProfile() {
        return await this.getById('userProfile', 'main');
    },
    async saveUserProfile(name) {
        const profile = { id: 'main', name, createdAt: new Date().toISOString() };
        const tx = this.db.transaction('userProfile', 'readwrite');
        tx.objectStore('userProfile').put(profile);
        await new Promise(r => tx.oncomplete = r);
        return profile;
    },

    // ====================================================================
    // 3. PUBLIC API (FUNGSI-FUNGSI YANG DIPAKAI APLIKASI)
    // ====================================================================
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),

    // Wallets
    async getWallets() { return this.getAll('wallets'); },
    async saveWallets(wallets) { return this.saveAll('wallets', wallets); },

    // Categories
    async getCategories() { return this.getAll('categories'); },
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
            id: 'current', // Key statis agar selalu menimpa data yang sama
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

    // ====================================================================
    // 4. SCHEDULES MANAGEMENT (Fitur Baru)
    // ====================================================================
    async getSchedules() {
        try {
            return await this.getAll('schedules');
        } catch (error) {
            console.error('Error getting schedules:', error);
            return [];
        }
    },

    async addSchedule(schedule) {
        try {
            const scheduleWithId = {
                ...schedule,
                id: this.generateId(),
                createdAt: new Date().toISOString()
            };
            return await this.addItem('schedules', scheduleWithId);
        } catch (error) {
            console.error('Error adding schedule:', error);
            throw error;
        }
    },

    async getSchedule(id) {
        try {
            return await this.getById('schedules', id);
        } catch (error) {
            console.error('Error getting schedule:', error);
            return null;
        }
    },

    async updateSchedule(id, updates) {
        try {
            return await this.updateItem('schedules', id, updates);
        } catch (error) {
            console.error('Error updating schedule:', error);
            throw error;
        }
    },

    async deleteSchedule(id) {
        try {
            return await this.deleteItem('schedules', id);
        } catch (error) {
            console.error('Error deleting schedule:', error);
            throw error;
        }
    },

    async getSchedulesByDate(date) {
        try {
            const allSchedules = await this.getSchedules();
            return allSchedules.filter(schedule => schedule.date === date);
        } catch (error) {
            console.error('Error getting schedules by date:', error);
            return [];
        }
    },

    async getSchedulesByDateRange(startDate, endDate) {
        try {
            const allSchedules = await this.getSchedules();
            return allSchedules.filter(schedule => {
                return schedule.date >= startDate && schedule.date <= endDate;
            });
        } catch (error) {
            console.error('Error getting schedules by date range:', error);
            return [];
        }
    },

    // ====================================================================
    // 5. FUNGSI UTILITAS (Backup, Restore, etc.)
    // ====================================================================
    async backupData() {
        try {
            // Mengambil semua data secara paralel untuk efisiensi
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
                version: '3.1' // Versi dengan schedules
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
            const data = JSON.parse(jsonData);
            if (!data.wallets || !data.categories) {
                throw new Error('Invalid backup file format.');
            }

            console.log('🔄 Restoring data...');

            // Menyimpan semua data secara paralel
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
                this.saveAll('schedules', data.schedules || []), // Tambahkan schedules
                this.saveGoldPrice(data.currentGoldPrice || { buy: 1000000, sell: 980000, source: 'Restored' })
            ]);
            
            console.log('🎉 Restore successful!');
            return true;
        } catch (e) {
            console.error('Restore error:', e);
            return false;
        }
    },

    async exportData() {
        try {
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

            return {
                wallets, categories, transactions, budgets, goldWallets, goldTransactions,
                currentGoldPrice, liabilities, liabilityPayments, savingsGoals,
                savingsTransactions, billReminders, schedules,
                exportDate: new Date().toISOString(),
                version: '3.1' // Versi dengan schedules
            };
        } catch (error) {
            console.error('Export data error:', error);
            throw error;
        }
    },

    // ====================================================================
    // 6. FUNGSI PEMBERSIHAN DATA
    // ====================================================================
    async clearAllData() {
        try {
            const stores = [
                'wallets', 'categories', 'transactions', 'budgets', 
                'goldWallets', 'goldTransactions', 'savingsGoals', 
                'savingsTransactions', 'billReminders', 'liabilities', 
                'liabilityPayments', 'schedules'
            ];

            await Promise.all(stores.map(storeName => 
                this.saveAll(storeName, [])
            ));

            // Reset gold price to default
            await this.saveGoldPrice({ buy: 1000000, sell: 980000, source: 'Reset' });
            
            console.log('🧹 All data cleared successfully.');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    },
    // Tambahkan method untuk personalization settings
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
}
};
