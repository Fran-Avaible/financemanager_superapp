// js/modules/gold.js (Versi Final dengan async/await)
import { DB } from '../database.js';
import { Utils } from '../utils.js';

export class GoldModule {
    constructor(app) {
        this.app = app;
    }

    async render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">💰 Harga Emas Hari Ini</h3>
                    <div>
                        <button class="btn btn-outline btn-sm" onclick="window.app.goldModule.updateGoldPrice()">🔄 Update</button>
                        <button class="btn btn-outline btn-sm" onclick="window.app.goldModule.showManualGoldPriceInput()">✏️ Input Manual</button>
                    </div>
                </div>
                <div id="goldPriceDisplay"></div>
            </div>

            <div class="quick-actions">
                <button class="btn btn-primary" onclick="window.app.goldModule.showBuyGoldModal()"><span>🛒</span> Beli Emas</button>
                <button class="btn btn-secondary" onclick="window.app.goldModule.showSellGoldModal()"><span>💰</span> Jual Emas</button>
                <button class="btn btn-success" onclick="window.app.goldModule.showGoldCalculator()"><span>🧮</span> Kalkulator</button>
                <button class="btn btn-warning" onclick="window.app.goldModule.showManualGoldInputModal()"><span>✨</span> Input Emas Awal</button>
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title">🏦 Portfolio Emas Saya</h3></div>
                <div id="goldPortfolio"></div>
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title">📊 Ringkasan Investasi</h3></div>
                <div id="goldSummary"></div>
            </div>

            <div class="card">
                <div class="card-header"><h3 class="card-title">📝 Riwayat Transaksi Emas</h3></div>
                <div id="goldTransactions"></div>
            </div>
        `;

        await this.updateGoldPriceDisplay();
        await this.renderGoldPortfolio();
        await this.renderGoldSummary();
        await this.renderGoldTransactions();
    }

    async updateGoldPrice() {
        try {
            Utils.showToast('Mengambil harga terbaru...', 'info');
            const newPrice = await DB.fetchPegadaianGoldPrice();
            await DB.saveGoldPrice(newPrice);
            await this.updateGoldPriceDisplay();
            Utils.showToast('Harga emas berhasil diupdate!', 'success');
        } catch (error) {
            console.error('Update gold price error:', error);
            Utils.showToast('Gagal mengambil harga otomatis', 'error');
        }
    }

    async updateGoldPriceDisplay() {
        const container = document.getElementById('goldPriceDisplay');
        if (!container) return;
        const price = await DB.getGoldPrice();
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); padding: var(--spacing-md);">
                <div style="text-align: center; padding: var(--spacing-md); background: var(--light-color); border-radius: var(--border-radius-sm);">
                    <div style="font-size: 14px; color: #666;">Harga Beli</div>
                    <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">${Utils.formatCurrency(price.buy)}</div>
                </div>
                <div style="text-align: center; padding: var(--spacing-md); background: var(--light-color); border-radius: var(--border-radius-sm);">
                    <div style="font-size: 14px; color: #666;">Harga Jual</div>
                    <div style="font-size: 24px; font-weight: bold; color: var(--danger-color);">${Utils.formatCurrency(price.sell)}</div>
                </div>
            </div>
            <div style="padding: 0 var(--spacing-md) var(--spacing-md); text-align: center; color: #666; font-size: 12px;">
                Sumber: ${price.source} • Terakhir update: ${price.lastUpdate ? Utils.formatDate(price.lastUpdate) : 'Tidak diketahui'}
            </div>
        `;
    }

    async showManualGoldPriceInput() {
        const currentPrice = await DB.getGoldPrice();
        const content = `
            <form id="manualGoldPriceForm">
                <div class="form-group">
                    <label>Harga Beli Emas (per gram)</label>
                    <input type="number" class="form-control" id="manualBuyPrice" value="${currentPrice.buy}" required min="1">
                </div>
                <div class="form-group">
                    <label>Harga Jual Emas (per gram)</label>
                    <input type="number" class="form-control" id="manualSellPrice" value="${currentPrice.sell}" required min="1">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Simpan Harga</button>
            </form>
        `;
        
        Utils.createModal('manualGoldPriceModal', 'Input Harga Emas Manual', content);
        Utils.openModal('manualGoldPriceModal');

        document.getElementById('manualGoldPriceForm').onsubmit = (e) => {
            e.preventDefault();
            this.processManualGoldPrice();
        };
    }

    async processManualGoldPrice() {
        const buyPrice = parseFloat(document.getElementById('manualBuyPrice').value);
        const sellPrice = parseFloat(document.getElementById('manualSellPrice').value);
        
        if (buyPrice <= 0 || sellPrice <= 0) {
            return Utils.showToast('Harga harus lebih dari 0', 'error');
        }
        
        if (sellPrice > buyPrice) {
            return Utils.showToast('Harga jual tidak boleh lebih tinggi dari harga beli', 'error');
        }

        const newPrice = { 
            buy: buyPrice, 
            sell: sellPrice, 
            source: 'Manual Input',
            lastUpdate: new Date().toISOString()
        };
        
        await DB.saveGoldPrice(newPrice);
        Utils.closeModal('manualGoldPriceModal');
        await this.updateGoldPriceDisplay();
        Utils.showToast('Harga emas berhasil disimpan!', 'success');
    }

    async showManualGoldInputModal() {
        const goldWallets = await DB.getGoldWallets();
        const wallets = await DB.getWallets();
        
        const walletOptions = wallets.map(w => `<option value="${w.id}">${w.emoji} ${w.name}</option>`).join('');
        
        const content = `
            <form id="manualGoldInputForm">
                <div class="form-group">
                    <label>Nama Dompet Emas</label>
                    <input type="text" class="form-control" id="goldWalletName" value="Dompet Emas 1" required>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="goldWalletEmoji" value="🪙" required>
                </div>
                <div class="form-group">
                    <label>Berat Emas (gram)</label>
                    <input type="number" class="form-control" id="goldWeight" step="0.01" required min="0">
                </div>
                <div class="form-group">
                    <label>Harga Rata-rata Beli (per gram)</label>
                    <input type="number" class="form-control" id="goldAvgPrice" required min="1">
                </div>
                <div class="form-group">
                    <label>Dompet Tunai (untuk nilai investasi)</label>
                    <select class="form-control" id="cashWalletId" required>
                        ${walletOptions}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Setel Saldo Emas</button>
            </form>
        `;
        
        Utils.createModal('manualGoldInputModal', 'Input Saldo Emas Awal', content);
        Utils.openModal('manualGoldInputModal');

        document.getElementById('manualGoldInputForm').onsubmit = (e) => {
            e.preventDefault();
            this.processManualGoldInput();
        };
    }

    async processManualGoldInput() {
        const name = document.getElementById('goldWalletName').value;
        const emoji = document.getElementById('goldWalletEmoji').value;
        const weight = parseFloat(document.getElementById('goldWeight').value);
        const avgPrice = parseFloat(document.getElementById('goldAvgPrice').value);
        const cashWalletId = document.getElementById('cashWalletId').value;

        if (weight <= 0 || avgPrice <= 0) {
            return Utils.showToast('Berat dan harga harus lebih dari 0', 'error');
        }

        const goldWallets = await DB.getGoldWallets();
        const existingWallet = goldWallets.find(w => w.name === name);
        
        if (existingWallet) {
            existingWallet.weight = weight;
            existingWallet.avgBuyPrice = avgPrice;
        } else {
            goldWallets.push({
                id: DB.generateId(),
                name,
                emoji,
                weight,
                avgBuyPrice: avgPrice,
                totalInvestment: weight * avgPrice
            });
        }

        await DB.saveGoldWallets(goldWallets);
        
        // Buat transaksi emas untuk riwayat
        const goldTransactions = await DB.getGoldTransactions();
        goldTransactions.push({
            id: DB.generateId(),
            type: 'initial',
            weight: weight,
            pricePerGram: avgPrice,
            totalAmount: weight * avgPrice,
            walletId: cashWalletId,
            date: new Date().toISOString().split('T')[0],
            notes: 'Input saldo emas awal'
        });
        
        await DB.saveGoldTransactions(goldTransactions);

        Utils.closeModal('manualGoldInputModal');
        await this.renderGoldPortfolio();
        await this.renderGoldSummary();
        await this.renderGoldTransactions();
        Utils.showToast('Saldo emas berhasil disetel!', 'success');
    }
    
    async renderGoldPortfolio() {
        const container = document.getElementById('goldPortfolio');
        if (!container) return;
        
        const [wallets, currentPrice] = await Promise.all([DB.getGoldWallets(), DB.getGoldPrice()]);
        
        if (wallets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">🪙</div>
                    <p>Belum ada portfolio emas. Tambahkan emas pertama Anda!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = wallets.map(wallet => {
            const currentValue = wallet.weight * currentPrice.buy;
            const profitLoss = currentValue - (wallet.weight * wallet.avgBuyPrice);
            const profitLossPercent = ((profitLoss / (wallet.weight * wallet.avgBuyPrice)) * 100).toFixed(2);
            const profitLossClass = profitLoss >= 0 ? 'success' : 'danger';

            return `
                <div class="wallet-card" style="border-left: 4px solid var(--${profitLossClass}-color);">
                    <span class="wallet-emoji">${wallet.emoji}</span>
                    <div class="wallet-info" style="flex: 1;">
                        <div class="wallet-name">${wallet.name}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${wallet.weight.toFixed(3)} gram • Avg: ${Utils.formatCurrency(wallet.avgBuyPrice)}/g
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 16px;">${Utils.formatCurrency(currentValue)}</div>
                        <div style="font-size: 12px; color: var(--${profitLossClass}-color);">
                            ${profitLoss >= 0 ? '+' : ''}${Utils.formatCurrency(profitLoss)} (${profitLossPercent}%)
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async renderGoldSummary() {
        const container = document.getElementById('goldSummary');
        if (!container) return;
        
        const [wallets, currentPrice] = await Promise.all([DB.getGoldWallets(), DB.getGoldPrice()]);
        
        const totalWeight = wallets.reduce((sum, w) => sum + w.weight, 0);
        const totalInvestment = wallets.reduce((sum, w) => sum + (w.weight * w.avgBuyPrice), 0);
        const currentValue = totalWeight * currentPrice.buy;
        const profitLoss = currentValue - totalInvestment;
        const profitLossPercent = totalInvestment > 0 ? ((profitLoss / totalInvestment) * 100).toFixed(2) : 0;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); padding: var(--spacing-md);">
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: #666;">Total Berat</div>
                    <div style="font-size: 20px; font-weight: bold;">${totalWeight.toFixed(3)} gram</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: #666;">Total Investasi</div>
                    <div style="font-size: 20px; font-weight: bold;">${Utils.formatCurrency(totalInvestment)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: #666;">Nilai Sekarang</div>
                    <div style="font-size: 20px; font-weight: bold; color: var(--success-color);">${Utils.formatCurrency(currentValue)}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: #666;">Profit/Loss</div>
                    <div style="font-size: 20px; font-weight: bold; color: ${profitLoss >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">
                        ${profitLoss >= 0 ? '+' : ''}${Utils.formatCurrency(profitLoss)} (${profitLossPercent}%)
                    </div>
                </div>
            </div>
        `;
    }

    async renderGoldTransactions() {
        const container = document.getElementById('goldTransactions');
        if (!container) return;
        
        const transactions = await DB.getGoldTransactions();
        const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">📝</div>
                    <p>Belum ada transaksi emas.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sortedTransactions.map(transaction => {
            const typeClass = transaction.type === 'buy' ? 'income' : 
                            transaction.type === 'sell' ? 'expense' : 'transfer';
            const typeText = transaction.type === 'buy' ? 'Beli' : 
                           transaction.type === 'sell' ? 'Jual' : 'Awal';
            const amountPrefix = transaction.type === 'buy' ? '-' : 
                               transaction.type === 'sell' ? '+' : '';

            return `
                <div class="transaction-item ${typeClass}">
                    <div class="transaction-info">
                        <div class="transaction-category">${typeText} Emas</div>
                        <div class="transaction-wallet">${transaction.weight.toFixed(3)} gram • ${Utils.formatDateShort(transaction.date)}</div>
                        ${transaction.notes ? `<div class="transaction-notes">${transaction.notes}</div>` : ''}
                    </div>
                    <div class="transaction-amount ${typeClass}">
                        ${amountPrefix}${Utils.formatCurrency(transaction.totalAmount)}
                    </div>
                </div>
            `;
        }).join('');
    }

    async showBuyGoldModal() {
        const [cashWallets, goldWallets, goldPrice] = await Promise.all([
            DB.getWallets(),
            DB.getGoldWallets(),
            DB.getGoldPrice()
        ]);

        if (cashWallets.length === 0) {
            return Utils.showToast('Tambahkan dompet tunai terlebih dahulu!', 'error');
        }

        const walletOptions = cashWallets.map(w => `<option value="${w.id}">${w.emoji} ${w.name} - ${Utils.formatCurrency(w.balance)}</option>`).join('');
        const goldWalletOptions = goldWallets.map(w => `<option value="${w.id}">${w.emoji} ${w.name}</option>`).join('');

        const content = `
            <form id="buyGoldForm">
                <div class="form-group">
                    <label>Dari Dompet Tunai</label>
                    <select class="form-control" id="fromWalletId" required>
                        ${walletOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Ke Dompet Emas</label>
                    <select class="form-control" id="toGoldWalletId" required>
                        ${goldWalletOptions.length > 0 ? goldWalletOptions : '<option value="">Buat dompet emas baru</option>'}
                    </select>
                </div>
                <div class="form-group">
                    <label>Nama Dompet Emas Baru (jika membuat baru)</label>
                    <input type="text" class="form-control" id="newGoldWalletName" placeholder="Dompet Emas Baru">
                </div>
                <div class="form-group">
                    <label>Berat Emas (gram)</label>
                    <input type="number" class="form-control" id="gramAmount" step="0.001" required min="0.001">
                </div>
                <div class="form-group">
                    <label>Harga per Gram</label>
                    <input type="number" class="form-control" id="pricePerGram" value="${goldPrice.buy}" required min="1">
                </div>
                <div class="form-group">
                    <label>Total Biaya</label>
                    <input type="number" class="form-control" id="totalCost" readonly>
                </div>
                <div class="form-group">
                    <label>Tanggal Transaksi</label>
                    <input type="date" class="form-control" id="transactionDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Catatan (Opsional)</label>
                    <input type="text" class="form-control" id="transactionNotes" placeholder="Catatan transaksi">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Beli Emas</button>
            </form>
        `;

        Utils.createModal('buyGoldModal', 'Beli Emas', content);
        Utils.openModal('buyGoldModal');

        // Hitung total biaya otomatis
        document.getElementById('gramAmount').addEventListener('input', this.calculateBuyTotal);
        document.getElementById('pricePerGram').addEventListener('input', this.calculateBuyTotal);

        document.getElementById('buyGoldForm').onsubmit = (e) => {
            e.preventDefault();
            this.processBuyGold();
        };
    }

    calculateBuyTotal() {
        const gramAmount = parseFloat(document.getElementById('gramAmount').value) || 0;
        const pricePerGram = parseFloat(document.getElementById('pricePerGram').value) || 0;
        const totalCost = gramAmount * pricePerGram;
        document.getElementById('totalCost').value = totalCost.toFixed(2);
    }

    async processBuyGold() {
        const fromWalletId = document.getElementById('fromWalletId').value;
        const toGoldWalletId = document.getElementById('toGoldWalletId').value;
        const newGoldWalletName = document.getElementById('newGoldWalletName').value;
        const gramAmount = parseFloat(document.getElementById('gramAmount').value);
        const pricePerGram = parseFloat(document.getElementById('pricePerGram').value);
        const totalCost = gramAmount * pricePerGram;
        const date = document.getElementById('transactionDate').value;
        const notes = document.getElementById('transactionNotes').value;

        const [cashWallets, goldWallets, transactions, goldTransactions] = await Promise.all([
            DB.getWallets(), DB.getGoldWallets(), DB.getTransactions(), DB.getGoldTransactions()
        ]);

        const cashWallet = cashWallets.find(w => w.id === fromWalletId);
        
        // Validasi
        if (!cashWallet || cashWallet.balance < totalCost) {
            return Utils.showToast('Saldo dompet tidak cukup!', 'error');
        }

        if (gramAmount <= 0 || pricePerGram <= 0) {
            return Utils.showToast('Jumlah gram dan harga harus lebih dari 0', 'error');
        }

        let goldWallet;
        if (toGoldWalletId) {
            goldWallet = goldWallets.find(w => w.id === toGoldWalletId);
        } else if (newGoldWalletName) {
            goldWallet = {
                id: DB.generateId(),
                name: newGoldWalletName,
                emoji: '🪙',
                weight: 0,
                avgBuyPrice: 0,
                totalInvestment: 0
            };
            goldWallets.push(goldWallet);
        } else {
            return Utils.showToast('Pilih atau buat dompet emas', 'error');
        }

        // Update saldo tunai
        cashWallet.balance -= totalCost;

        // Update portfolio emas
        const totalInvestment = goldWallet.weight * goldWallet.avgBuyPrice;
        const newTotalInvestment = totalInvestment + totalCost;
        const newTotalWeight = goldWallet.weight + gramAmount;
        goldWallet.avgBuyPrice = newTotalInvestment / newTotalWeight;
        goldWallet.weight = newTotalWeight;
        goldWallet.totalInvestment = newTotalInvestment;

        // Buat transaksi tunai
        const goldCategoryId = await this.getOrCreateGoldCategory();
        transactions.push({
            id: DB.generateId(),
            type: 'expense',
            amount: totalCost,
            walletId: fromWalletId,
            categoryId: goldCategoryId,
            date: date,
            notes: notes || `Beli emas ${gramAmount.toFixed(3)}g`
        });

        // Buat transaksi emas
        goldTransactions.push({
            id: DB.generateId(),
            type: 'buy',
            weight: gramAmount,
            pricePerGram: pricePerGram,
            totalAmount: totalCost,
            walletId: fromWalletId,
            goldWalletId: goldWallet.id,
            date: date,
            notes: notes
        });

        // Simpan semua perubahan
        await Promise.all([
            DB.saveWallets(cashWallets),
            DB.saveGoldWallets(goldWallets),
            DB.saveTransactions(transactions),
            DB.saveGoldTransactions(goldTransactions)
        ]);
        
        Utils.closeModal('buyGoldModal');
        await this.app.render();
        await this.app.updateTotalBalance();
        Utils.showToast('Berhasil membeli emas!', 'success');
    }

    async showSellGoldModal() {
        const [goldWallets, cashWallets, goldPrice] = await Promise.all([
            DB.getGoldWallets(),
            DB.getWallets(),
            DB.getGoldPrice()
        ]);

        if (goldWallets.length === 0) {
            return Utils.showToast('Belum ada emas untuk dijual!', 'error');
        }

        const goldWalletOptions = goldWallets.map(w => `<option value="${w.id}">${w.emoji} ${w.name} - ${w.weight.toFixed(3)}g</option>`).join('');
        const cashWalletOptions = cashWallets.map(w => `<option value="${w.id}">${w.emoji} ${w.name}</option>`).join('');

        const content = `
            <form id="sellGoldForm">
                <div class="form-group">
                    <label>Dari Dompet Emas</label>
                    <select class="form-control" id="fromGoldWalletId" required>
                        ${goldWalletOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Ke Dompet Tunai</label>
                    <select class="form-control" id="toWalletId" required>
                        ${cashWalletOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Berat Emas (gram)</label>
                    <input type="number" class="form-control" id="sellGramAmount" step="0.001" required min="0.001">
                </div>
                <div class="form-group">
                    <label>Harga Jual per Gram</label>
                    <input type="number" class="form-control" id="sellPricePerGram" value="${goldPrice.sell}" required min="1">
                </div>
                <div class="form-group">
                    <label>Total Penerimaan</label>
                    <input type="number" class="form-control" id="sellTotalAmount" readonly>
                </div>
                <div class="form-group">
                    <label>Tanggal Transaksi</label>
                    <input type="date" class="form-control" id="sellTransactionDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Catatan (Opsional)</label>
                    <input type="text" class="form-control" id="sellTransactionNotes" placeholder="Catatan transaksi">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Jual Emas</button>
            </form>
        `;

        Utils.createModal('sellGoldModal', 'Jual Emas', content);
        Utils.openModal('sellGoldModal');

        // Hitung total penerimaan otomatis
        document.getElementById('sellGramAmount').addEventListener('input', this.calculateSellTotal);
        document.getElementById('sellPricePerGram').addEventListener('input', this.calculateSellTotal);

        document.getElementById('sellGoldForm').onsubmit = (e) => {
            e.preventDefault();
            this.processSellGold();
        };
    }

    calculateSellTotal() {
        const gramAmount = parseFloat(document.getElementById('sellGramAmount').value) || 0;
        const pricePerGram = parseFloat(document.getElementById('sellPricePerGram').value) || 0;
        const totalAmount = gramAmount * pricePerGram;
        document.getElementById('sellTotalAmount').value = totalAmount.toFixed(2);
    }

    async processSellGold() {
        const fromGoldWalletId = document.getElementById('fromGoldWalletId').value;
        const toWalletId = document.getElementById('toWalletId').value;
        const gramAmount = parseFloat(document.getElementById('sellGramAmount').value);
        const pricePerGram = parseFloat(document.getElementById('sellPricePerGram').value);
        const totalAmount = gramAmount * pricePerGram;
        const date = document.getElementById('sellTransactionDate').value;
        const notes = document.getElementById('sellTransactionNotes').value;

        const [goldWallets, cashWallets, transactions, goldTransactions] = await Promise.all([
            DB.getGoldWallets(), DB.getWallets(), DB.getTransactions(), DB.getGoldTransactions()
        ]);

        const goldWallet = goldWallets.find(w => w.id === fromGoldWalletId);
        const cashWallet = cashWallets.find(w => w.id === toWalletId);

        // Validasi
        if (!goldWallet || goldWallet.weight < gramAmount) {
            return Utils.showToast('Berat emas tidak mencukupi!', 'error');
        }

        if (gramAmount <= 0 || pricePerGram <= 0) {
            return Utils.showToast('Jumlah gram dan harga harus lebih dari 0', 'error');
        }

        // Update portfolio emas
        goldWallet.weight -= gramAmount;
        if (goldWallet.weight === 0) {
            goldWallet.avgBuyPrice = 0;
            goldWallet.totalInvestment = 0;
        }

        // Update saldo tunai
        cashWallet.balance += totalAmount;

        // Buat transaksi tunai
        const goldCategoryId = await this.getOrCreateGoldCategory();
        transactions.push({
            id: DB.generateId(),
            type: 'income',
            amount: totalAmount,
            walletId: toWalletId,
            categoryId: goldCategoryId,
            date: date,
            notes: notes || `Jual emas ${gramAmount.toFixed(3)}g`
        });

        // Buat transaksi emas
        goldTransactions.push({
            id: DB.generateId(),
            type: 'sell',
            weight: gramAmount,
            pricePerGram: pricePerGram,
            totalAmount: totalAmount,
            walletId: toWalletId,
            goldWalletId: goldWallet.id,
            date: date,
            notes: notes
        });

        await Promise.all([
            DB.saveWallets(cashWallets),
            DB.saveGoldWallets(goldWallets),
            DB.saveTransactions(transactions),
            DB.saveGoldTransactions(goldTransactions)
        ]);

        Utils.closeModal('sellGoldModal');
        await this.app.render();
        await this.app.updateTotalBalance();
        Utils.showToast('Berhasil menjual emas!', 'success');
    }

    async showGoldCalculator() {
        const goldPrice = await DB.getGoldPrice();
        const content = `
            <div style="display: grid; gap: var(--spacing-md);">
                <div class="form-group">
                    <label>Harga Emas per Gram</label>
                    <input type="number" class="form-control" id="calcGoldPrice" value="${goldPrice.buy}">
                </div>
                <div class="form-group">
                    <label>Berat Emas (gram)</label>
                    <input type="number" class="form-control" id="calcGoldWeight" step="0.001" placeholder="0.000">
                </div>
                <div class="form-group">
                    <label>Jumlah Uang (IDR)</label>
                    <input type="number" class="form-control" id="calcGoldMoney" placeholder="0">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
                    <button class="btn btn-primary" onclick="window.app.goldModule.calculateGoldFromIDR()">Hitung Gram</button>
                    <button class="btn btn-secondary" onclick="window.app.goldModule.calculateIDRFromGold()">Hitung IDR</button>
                </div>
                <div id="calcResult" style="padding: var(--spacing-md); background: var(--light-color); border-radius: var(--border-radius-sm); text-align: center; font-weight: bold;"></div>
            </div>
        `;
        
        Utils.createModal('goldCalculatorModal', 'Kalkulator Emas', content);
        Utils.openModal('goldCalculatorModal');
    }
    
    calculateGoldFromIDR() {
        const price = parseFloat(document.getElementById('calcGoldPrice').value) || 0;
        const money = parseFloat(document.getElementById('calcGoldMoney').value) || 0;
        
        if (price <= 0 || money <= 0) {
            document.getElementById('calcResult').textContent = 'Masukkan harga dan jumlah uang yang valid';
            return;
        }
        
        const weight = money / price;
        document.getElementById('calcResult').textContent = 
            `Dengan ${Utils.formatCurrency(money)}, Anda bisa membeli ${weight.toFixed(3)} gram emas`;
        
        document.getElementById('calcGoldWeight').value = weight.toFixed(3);
    }
    
    calculateIDRFromGold() {
        const price = parseFloat(document.getElementById('calcGoldPrice').value) || 0;
        const weight = parseFloat(document.getElementById('calcGoldWeight').value) || 0;
        
        if (price <= 0 || weight <= 0) {
            document.getElementById('calcResult').textContent = 'Masukkan harga dan berat yang valid';
            return;
        }
        
        const money = weight * price;
        document.getElementById('calcResult').textContent = 
            `${weight.toFixed(3)} gram emas bernilai ${Utils.formatCurrency(money)}`;
        
        document.getElementById('calcGoldMoney').value = money;
    }

    async getOrCreateGoldCategory() {
        const categories = await DB.getCategories();
        let goldCategory = categories.find(c => c.name === 'Investasi Emas' && c.type === 'expense');
        
        if (!goldCategory) {
            goldCategory = { id: DB.generateId(), name: 'Investasi Emas', type: 'expense', emoji: '🪙' };
            categories.push(goldCategory);
            await DB.saveCategories(categories);
        }
        return goldCategory.id;
    }
}
