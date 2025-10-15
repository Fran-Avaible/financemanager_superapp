// js/modules/financial-planning.js (Gabungan Budget & Liabilities)
import { DB } from '../database.js';
import { Utils } from '../utils.js';

export class FinancialPlanningModule {
    constructor(app) {
        this.app = app;
        this.activeSubTab = 'budget'; // Default sub-tab
    }

    async render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📊 Financial Planning</h3>
                    <div class="sub-tab-navigation">
                        <button class="btn btn-outline btn-sm ${this.activeSubTab === 'budget' ? 'active' : ''}" 
                                id="tabBudget" data-sub-tab="budget">
                            🎯 Budget & Tabungan
                        </button>
                        <button class="btn btn-outline btn-sm ${this.activeSubTab === 'liabilities' ? 'active' : ''}" 
                                id="tabLiabilities" data-sub-tab="liabilities">
                            🏦 Liabilitas & Tagihan
                        </button>
                    </div>
                </div>
                <div id="financialPlanningSubContent"></div>
            </div>
        `;

        await this.renderSubContent();
        
        document.getElementById('tabBudget').addEventListener('click', (e) => this.switchSubTab('budget', e));
        document.getElementById('tabLiabilities').addEventListener('click', (e) => this.switchSubTab('liabilities', e));
    }

    async switchSubTab(subTab, event) {
        this.activeSubTab = subTab;
        
        document.querySelectorAll('.sub-tab-navigation .btn').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        await this.renderSubContent();
    }

    async renderSubContent() {
        const container = document.getElementById('financialPlanningSubContent');
        if (!container) return;

        if (this.activeSubTab === 'budget') {
            await this.renderBudgetContent(container);
        } else {
            await this.renderLiabilitiesContent(container);
        }
    }

    // ====================================================================
    // BUDGET SECTION (Diambil dari budget.js)
    // ====================================================================

    async renderBudgetContent(container) {
        container.innerHTML = `
            <div style="text-align: right; margin-bottom: 15px;">
                <button class="btn btn-primary" id="addBudgetBtn">+ Tambah Budget</button>
                <button class="btn btn-outline" id="addSavingsGoalBtn">+ Target Tabungan</button>
            </div>
            <div id="budgetsList"></div>
            <div class="card" style="margin-top: 20px;">
                <div class="card-header"><h3 class="card-title">📊 Progress Budget</h3></div>
                <div id="budgetProgress"></div>
            </div>
            <div class="card" style="margin-top: 20px;">
                <div class="card-header"><h3 class="card-title">💰 Progress Menabung</h3></div>
                <div id="savingsProgress"></div>
            </div>
        `;
        
        document.getElementById('addBudgetBtn').addEventListener('click', () => this.showAddBudgetModal());
        document.getElementById('addSavingsGoalBtn').addEventListener('click', () => this.showAddSavingsGoalModal());
        
        await this.renderBudgets();
        await this.renderSavingsProgress();
    }

    async renderBudgets() {
        const [budgets, categories, transactions] = await Promise.all([
            DB.getBudgets(), 
            DB.getCategories(), 
            DB.getTransactions()
        ]);
        
        const container = document.getElementById('budgetsList');
        const progressContainer = document.getElementById('budgetProgress');
        
        if (!container || !progressContainer) return;

        if (budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">🎯</div>
                    <p>Belum ada anggaran. Tambahkan satu!</p>
                </div>
            `;
            progressContainer.innerHTML = '';
            return;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let budgetListHtml = '';
        let budgetProgressHtml = '';

        budgets.forEach(budget => {
            const category = categories.find(c => c.id === budget.categoryId);
            if (!category) return;
            
            const spent = transactions.filter(t => {
                const tDate = new Date(t.date);
                return t.categoryId === budget.categoryId && 
                       t.type === 'expense' && 
                       tDate.getMonth() === currentMonth && 
                       tDate.getFullYear() === currentYear;
            }).reduce((sum, t) => sum + t.amount, 0);
            
            const remaining = budget.amount - spent;
            const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
            const progressBarColor = percentage >= 100 ? 'var(--danger-color)' : 
                                   percentage > 75 ? 'var(--warning-color)' : 
                                   'var(--success-color)';

            budgetListHtml += `
                <div class="card" style="margin-bottom: var(--spacing-md);">
                    <div class="card-header">
                        <h4 class="card-title">${category.emoji} ${category.name}</h4>
                        <div>
                            <button class="btn btn-sm btn-info edit-budget-btn" data-budget-id="${budget.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-budget-btn" data-budget-id="${budget.id}">Hapus</button>
                        </div>
                    </div>
                    <p>Anggaran: ${Utils.formatCurrency(budget.amount)}</p>
                    <p>Terpakai: ${Utils.formatCurrency(spent)}</p>
                    <p>Sisa: <span style="color: ${remaining >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">
                        ${Utils.formatCurrency(remaining)}
                    </span></p>
                </div>`;
                
            budgetProgressHtml += `
                <div class="card progress-card">
                    <div class="card-header">
                        <h4 class="card-title">${category.emoji} ${category.name}</h4>
                        <span>${Math.round(percentage)}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percentage}%; background: ${progressBarColor};"></div>
                    </div>
                    <p class="progress-text">${Utils.formatCurrency(spent)} dari ${Utils.formatCurrency(budget.amount)}</p>
                </div>`;
        });

        container.innerHTML = budgetListHtml;
        progressContainer.innerHTML = budgetProgressHtml;
        
        container.querySelectorAll('.edit-budget-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.showEditBudgetModal(e.target.dataset.budgetId))
        );
        container.querySelectorAll('.delete-budget-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.deleteBudget(e.target.dataset.budgetId))
        );
    }

    async renderSavingsProgress() {
        const goals = await DB.getSavingsGoals();
        const container = document.getElementById('savingsProgress');
        if (!container) return;

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">💰</div>
                    <p>Belum ada target tabungan</p>
                </div>
            `;
            return;
        }

        const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
        const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
        const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h4>Total Tabungan</h4>
                <p style="font-size: 24px; font-weight: bold; color: var(--success-color);">
                    ${Utils.formatCurrency(totalCurrent)} / ${Utils.formatCurrency(totalTarget)}
                </p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${overallProgress}%; background: var(--success-color);"></div>
                </div>
                <p style="margin-top: 10px; color: #666;">
                    ${Math.round(overallProgress)}% tercapai
                </p>
            </div>
            
            <div id="savingsGoalsList" style="margin-top: 20px;"></div>
        `;

        await this.renderSavingsGoalsList();
    }

    async renderSavingsGoalsList() {
        const goals = await DB.getSavingsGoals();
        const container = document.getElementById('savingsGoalsList');
        if (!container) return;

        container.innerHTML = goals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysLeft = this.calculateDaysLeft(goal.targetDate);
            const savedPercentage = Math.min(progress, 100);
            
            let progressColor = '';
            if (savedPercentage >= 100) {
                progressColor = 'var(--success-color)';
            } else if (daysLeft < 0) {
                progressColor = 'var(--danger-color)';
            } else if (savedPercentage >= 70) {
                progressColor = '#FFA500';
            } else if (savedPercentage >= 40) {
                progressColor = '#2196F3';
            } else {
                progressColor = '#FF9800';
            }

            let statusClass = '';
            let statusText = '';
            
            if (savedPercentage >= 100) {
                statusClass = 'success';
                statusText = '🎉 Tercapai!';
            } else if (daysLeft < 0) {
                statusClass = 'danger';
                statusText = '⏰ Terlambat';
            } else {
                statusText = `${daysLeft} hari lagi`;
            }

            return `
                <div class="card" style="margin-bottom: 15px; border-left: 4px solid ${progressColor};">
                    <div class="card-header">
                        <h4 class="card-title">${goal.emoji} ${goal.name}</h4>
                        <span style="color: var(--${statusClass}-color); font-weight: bold;">${statusText}</span>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                            <span>Terkumpul: <strong>${Utils.formatCurrency(goal.currentAmount)}</strong></span>
                            <span>Target: <strong>${Utils.formatCurrency(goal.targetAmount)}</strong></span>
                        </div>
                        
                        <div style="background: #e0e0e0; border-radius: 10px; height: 20px; overflow: hidden; position: relative; width: 100%;">
                            <div style="width: ${savedPercentage}%; 
                                     background: ${progressColor}; 
                                     height: 100%; 
                                     border-radius: 10px;
                                     transition: width 0.5s ease-in-out;
                                     position: relative;
                                     display: flex;
                                     align-items: center;
                                     justify-content: flex-end;
                                     padding-right: 8px;
                                     font-size: 12px;
                                     font-weight: bold;
                                     color: ${savedPercentage > 50 ? 'white' : '#333'};">
                                ${Math.round(savedPercentage)}%
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 5px;">
                            <span>${Math.round(savedPercentage)}% tercapai</span>
                            <span>${Utils.formatCurrency(goal.targetAmount - goal.currentAmount)} lagi</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-success btn-sm add-savings-btn" data-goal-id="${goal.id}">💰 Tambah</button>
                        <button class="btn btn-info btn-sm edit-savings-btn" data-goal-id="${goal.id}">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm delete-savings-btn" data-goal-id="${goal.id}">🗑️ Hapus</button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.add-savings-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.showAddToSavingsModal(e.target.dataset.goalId))
        );
        container.querySelectorAll('.edit-savings-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.showEditSavingsGoalModal(e.target.dataset.goalId))
        );
        container.querySelectorAll('.delete-savings-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.deleteSavingsGoal(e.target.dataset.goalId))
        );
    }

    // Modal methods untuk budget dan savings (diambil dari budget.js)
    async showAddBudgetModal() {
        const categories = await DB.getCategories().then(cats => cats.filter(c => c.type === 'expense'));
        if (categories.length === 0) {
            return Utils.showToast('Tambahkan kategori pengeluaran terlebih dahulu!', 'error');
        }
        
        const categoryOptions = categories.map(c => 
            `<option value="${c.id}">${c.emoji} ${c.name}</option>`
        ).join('');
        
        const content = `
            <form id="addBudgetForm">
                <div class="form-group">
                    <label>Kategori</label>
                    <select class="form-control" id="budgetCategory" required>${categoryOptions}</select>
                </div>
                <div class="form-group">
                    <label>Jumlah Anggaran (Bulanan)</label>
                    <input type="number" class="form-control" id="budgetAmount" required min="1">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Tambah Budget</button>
            </form>
        `;
        
        Utils.createModal('addBudgetModal', 'Tambah Budget', content);
        Utils.openModal('addBudgetModal');

        document.getElementById('addBudgetForm').onsubmit = async (e) => {
            e.preventDefault();
            const categoryId = document.getElementById('budgetCategory').value;
            const amount = parseFloat(document.getElementById('budgetAmount').value);
            
            const budgets = await DB.getBudgets();
            if (budgets.find(b => b.categoryId === categoryId)) {
                return Utils.showToast('Budget untuk kategori ini sudah ada!', 'error');
            }
            
            budgets.push({ 
                id: DB.generateId(), 
                categoryId, 
                amount, 
                period: 'monthly' 
            });
            
            await DB.saveBudgets(budgets);
            Utils.closeModal('addBudgetModal');
            await this.renderBudgets();
            Utils.showToast('Budget berhasil ditambahkan!', 'success');
        };
    }

    async showEditBudgetModal(budgetId) {
        const budgets = await DB.getBudgets();
        const budget = budgets.find(b => b.id === budgetId);
        if (!budget) return;
        
        const categories = await DB.getCategories().then(cats => cats.filter(c => c.type === 'expense'));
        const categoryOptions = categories.map(c => 
            `<option value="${c.id}" ${c.id === budget.categoryId ? 'selected' : ''}>${c.emoji} ${c.name}</option>`
        ).join('');
        
        const content = `
            <form id="editBudgetForm">
                <div class="form-group">
                    <label>Kategori</label>
                    <select class="form-control" id="editBudgetCategory" required>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Jumlah Anggaran (Bulanan)</label>
                    <input type="number" class="form-control" id="editBudgetAmount" value="${budget.amount}" required min="1">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Update Budget</button>
            </form>
        `;
        
        Utils.createModal('editBudgetModal', 'Edit Budget', content);
        Utils.openModal('editBudgetModal');

        document.getElementById('editBudgetForm').onsubmit = async (e) => {
            e.preventDefault();
            const categoryId = document.getElementById('editBudgetCategory').value;
            const amount = parseFloat(document.getElementById('editBudgetAmount').value);
            
            const updatedBudgets = budgets.map(b => 
                b.id === budgetId ? { ...b, categoryId, amount } : b
            );
            
            await DB.saveBudgets(updatedBudgets);
            Utils.closeModal('editBudgetModal');
            await this.renderBudgets();
            Utils.showToast('Budget berhasil diperbarui!', 'success');
        };
    }

    async deleteBudget(budgetId) {
        if (confirm('Hapus budget ini?')) {
            const budgets = await DB.getBudgets();
            const updatedBudgets = budgets.filter(b => b.id !== budgetId);
            await DB.saveBudgets(updatedBudgets);
            await this.renderBudgets();
            Utils.showToast('Budget berhasil dihapus!', 'success');
        }
    }

    async showAddSavingsGoalModal() {
        const wallets = await DB.getWallets();
        const walletOptions = wallets.map(w => 
            `<option value="${w.id}">${w.emoji} ${w.name}</option>`
        ).join('');
        
        const content = `
            <form id="addSavingsGoalForm">
                <div class="form-group">
                    <label>Nama Target Tabungan</label>
                    <input type="text" class="form-control" id="savingsGoalName" required>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="savingsGoalEmoji" value="💰" required>
                </div>
                <div class="form-group">
                    <label>Target Amount</label>
                    <input type="number" class="form-control" id="savingsGoalTargetAmount" required min="1">
                </div>
                <div class="form-group">
                    <label>Tanggal Target</label>
                    <input type="date" class="form-control" id="savingsGoalTargetDate" required>
                </div>
                <div class="form-group">
                    <label>Dompet</label>
                    <select class="form-control" id="savingsGoalWallet" required>
                        ${walletOptions}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Buat Target Tabungan</button>
            </form>
        `;
        
        Utils.createModal('addSavingsGoalModal', 'Buat Target Tabungan', content);
        Utils.openModal('addSavingsGoalModal');

        document.getElementById('addSavingsGoalForm').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('savingsGoalName').value;
            const emoji = document.getElementById('savingsGoalEmoji').value;
            const targetAmount = parseFloat(document.getElementById('savingsGoalTargetAmount').value);
            const targetDate = document.getElementById('savingsGoalTargetDate').value;
            const walletId = document.getElementById('savingsGoalWallet').value;

            const goals = await DB.getSavingsGoals();
            goals.push({ 
                id: DB.generateId(), 
                name, 
                emoji, 
                targetAmount, 
                currentAmount: 0, 
                targetDate, 
                walletId 
            });
            
            await DB.saveSavingsGoals(goals);
            Utils.closeModal('addSavingsGoalModal');
            await this.renderSavingsProgress();
            Utils.showToast('Target tabungan berhasil dibuat!', 'success');
        };
    }

    async showEditSavingsGoalModal(goalId) {
        const goals = await DB.getSavingsGoals();
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        
        const wallets = await DB.getWallets();
        const walletOptions = wallets.map(w => 
            `<option value="${w.id}" ${w.id === goal.walletId ? 'selected' : ''}>${w.emoji} ${w.name}</option>`
        ).join('');
        
        const content = `
            <form id="editSavingsGoalForm">
                <div class="form-group">
                    <label>Nama Target Tabungan</label>
                    <input type="text" class="form-control" id="editSavingsGoalName" value="${goal.name}" required>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="editSavingsGoalEmoji" value="${goal.emoji}" required>
                </div>
                <div class="form-group">
                    <label>Target Amount</label>
                    <input type="number" class="form-control" id="editSavingsGoalTargetAmount" value="${goal.targetAmount}" required min="1">
                </div>
                <div class="form-group">
                    <label>Tanggal Target</label>
                    <input type="date" class="form-control" id="editSavingsGoalTargetDate" value="${goal.targetDate}" required>
                </div>
                <div class="form-group">
                    <label>Dompet</label>
                    <select class="form-control" id="editSavingsGoalWallet" required>
                        ${walletOptions}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Update Target Tabungan</button>
            </form>
        `;
        
        Utils.createModal('editSavingsGoalModal', 'Edit Target Tabungan', content);
        Utils.openModal('editSavingsGoalModal');

        document.getElementById('editSavingsGoalForm').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('editSavingsGoalName').value;
            const emoji = document.getElementById('editSavingsGoalEmoji').value;
            const targetAmount = parseFloat(document.getElementById('editSavingsGoalTargetAmount').value);
            const targetDate = document.getElementById('editSavingsGoalTargetDate').value;
            const walletId = document.getElementById('editSavingsGoalWallet').value;

            const updatedGoals = goals.map(g => 
                g.id === goalId ? { ...g, name, emoji, targetAmount, targetDate, walletId } : g
            );
            
            await DB.saveSavingsGoals(updatedGoals);
            Utils.closeModal('editSavingsGoalModal');
            await this.renderSavingsProgress();
            Utils.showToast('Target tabungan berhasil diperbarui!', 'success');
        };
    }

    async showAddToSavingsModal(goalId) {
        const goals = await DB.getSavingsGoals();
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        
        const wallets = await DB.getWallets();
        const walletOptions = wallets.map(w => 
            `<option value="${w.id}">${w.emoji} ${w.name}</option>`
        ).join('');
        
        const content = `
            <form id="addToSavingsForm">
                <div class="form-group">
                    <label>Jumlah</label>
                    <input type="number" class="form-control" id="savingsAddAmount" required min="1" max="${goal.targetAmount - goal.currentAmount}">
                    <small>Sisa target: ${Utils.formatCurrency(goal.targetAmount - goal.currentAmount)}</small>
                </div>
                <div class="form-group">
                    <label>Dari Dompet</label>
                    <select class="form-control" id="savingsSourceWallet" required>
                        ${walletOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" class="form-control" id="savingsAddDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Catatan (Opsional)</label>
                    <input type="text" class="form-control" id="savingsAddNotes">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Tambah Tabungan</button>
            </form>
        `;
        
        Utils.createModal('addToSavingsModal', 'Tambah Tabungan', content);
        Utils.openModal('addToSavingsModal');

        document.getElementById('addToSavingsForm').onsubmit = (e) => {
            e.preventDefault();
            this.processAddToSavings(goalId);
        };
    }

    async processAddToSavings(goalId) {
        const amount = parseFloat(document.getElementById('savingsAddAmount').value);
        const walletId = document.getElementById('savingsSourceWallet').value;
        const date = document.getElementById('savingsAddDate').value;
        const notes = document.getElementById('savingsAddNotes').value;

        const [goals, wallets, transactions, savingsTransactions] = await Promise.all([
            DB.getSavingsGoals(), 
            DB.getWallets(), 
            DB.getTransactions(), 
            DB.getSavingsTransactions()
        ]);

        const goalIndex = goals.findIndex(g => g.id === goalId);
        const wallet = wallets.find(w => w.id === walletId);
        
        if (!wallet || wallet.balance < amount) {
            return Utils.showToast('Saldo tidak cukup!', 'error');
        }

        wallet.balance -= amount;
        goals[goalIndex].currentAmount += amount;
        
        const categoryId = await this.getOrCreateSavingsCategory();
        
        transactions.push({ 
            id: DB.generateId(), 
            type: 'expense', 
            amount, 
            walletId, 
            categoryId, 
            date, 
            notes: `Tabungan: ${goals[goalIndex].name}` 
        });
        
        savingsTransactions.push({ 
            id: DB.generateId(), 
            goalId, 
            amount, 
            walletId, 
            date, 
            notes 
        });

        await Promise.all([
            DB.saveWallets(wallets),
            DB.saveSavingsGoals(goals),
            DB.saveTransactions(transactions),
            DB.saveSavingsTransactions(savingsTransactions)
        ]);
        
        Utils.closeModal('addToSavingsModal');
        await this.renderSavingsProgress();
        await this.app.updateTotalBalance();
        Utils.showToast('Berhasil menambahkan ke tabungan!', 'success');
    }

    async deleteSavingsGoal(goalId) {
        if (!confirm('Hapus target tabungan ini? Progress akan hilang.')) return;
        
        let [goals, savingsTransactions] = await Promise.all([
            DB.getSavingsGoals(), 
            DB.getSavingsTransactions()
        ]);
        
        goals = goals.filter(g => g.id !== goalId);
        savingsTransactions = savingsTransactions.filter(t => t.goalId !== goalId);
        
        await Promise.all([
            DB.saveSavingsGoals(goals), 
            DB.saveSavingsTransactions(savingsTransactions)
        ]);
        
        await this.renderSavingsProgress();
        Utils.showToast('Target tabungan berhasil dihapus!', 'success');
    }

    async getOrCreateSavingsCategory() {
        const categories = await DB.getCategories();
        let savingsCategory = categories.find(c => c.name === 'Tabungan' && c.type === 'expense');
        
        if (!savingsCategory) {
            savingsCategory = { 
                id: DB.generateId(), 
                name: 'Tabungan', 
                type: 'expense', 
                emoji: '💰' 
            };
            categories.push(savingsCategory);
            await DB.saveCategories(categories);
        }
        return savingsCategory.id;
    }

    // ====================================================================
    // LIABILITIES SECTION (Diambil dari liabilities.js)
    // ====================================================================

    async renderLiabilitiesContent(container) {
        container.innerHTML = `
            <div style="text-align: right; margin-bottom: 15px;">
                <button class="btn btn-primary" id="addLiabilityBtn">+ Tambah Hutang</button>
                <button class="btn btn-outline" id="addBillBtn">+ Tagihan Baru</button>
            </div>
            
            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header"><h3 class="card-title">💰 Hutang</h3></div>
                <div id="liabilitiesList"></div>
            </div>
            
            <div class="card" style="margin-bottom: 20px;">
                <div class="card-header"><h3 class="card-title">📅 Tagihan</h3></div>
                <div id="billRemindersList"></div>
            </div>
            
            <div class="card">
                <div class="card-header"><h3 class="card-title">📊 Ringkasan</h3></div>
                <div id="liabilitiesSummary"></div>
            </div>
        `;
        
        document.getElementById('addLiabilityBtn').addEventListener('click', () => this.showAddLiabilityModal());
        document.getElementById('addBillBtn').addEventListener('click', () => this.showAddBillModal());
        
        await this.renderLiabilitiesList();
        await this.renderBillReminders();
        await this.renderLiabilitiesSummary();
    }

    async renderLiabilitiesList() {
        const container = document.getElementById('liabilitiesList');
        if (!container) return;
        
        const [liabilities, payments] = await Promise.all([
            DB.getLiabilities(), 
            DB.getLiabilityPayments()
        ]);
        
        if (liabilities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">😊</div>
                    <p>Tidak ada hutang</p>
                </div>
            `;
            return;
        }

        container.innerHTML = liabilities.map(liability => {
            const paidAmount = this.calculatePaidAmount(liability.id, payments);
            const remaining = liability.amount - paidAmount;
            const progressPercent = (paidAmount / liability.amount) * 100;
            const daysLeft = this.calculateDaysLeft(liability.dueDate);
            
            let statusClass = '';
            let statusText = '';
            
            if (remaining <= 0) {
                statusClass = 'success';
                statusText = '✅ Lunas';
            } else if (daysLeft < 0) {
                statusClass = 'danger';
                statusText = '⏰ Terlambat';
            } else if (daysLeft <= 7) {
                statusClass = 'warning';
                statusText = `${daysLeft} hari lagi`;
            } else {
                statusText = `${daysLeft} hari lagi`;
            }

            return `
                <div class="card" style="margin-bottom: 15px; border-left: 4px solid var(--${statusClass}-color);">
                    <div class="card-header">
                        <h4 class="card-title">${liability.emoji} ${liability.name}</h4>
                        <span style="color: var(--${statusClass}-color); font-weight: bold;">${statusText}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                        <span>Total: <strong>${Utils.formatCurrency(liability.amount)}</strong></span>
                        <span>Tersisa: <strong style="color: var(--${statusClass}-color);">${Utils.formatCurrency(remaining)}</strong></span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progressPercent}%;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 4px;">
                        <span>Terbayar: ${Utils.formatCurrency(paidAmount)}</span>
                        <span>Jatuh tempo: ${Utils.formatDateShort(liability.dueDate)}</span>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn btn-success btn-sm pay-liability-btn" data-liability-id="${liability.id}">💸 Bayar</button>
                        <button class="btn btn-info btn-sm edit-liability-btn" data-liability-id="${liability.id}">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm delete-liability-btn" data-liability-id="${liability.id}">🗑️ Hapus</button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.pay-liability-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.showPayLiabilityModal(e.target.dataset.liabilityId))
        );
        container.querySelectorAll('.edit-liability-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.showEditLiabilityModal(e.target.dataset.liabilityId))
        );
        container.querySelectorAll('.delete-liability-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.deleteLiability(e.target.dataset.liabilityId))
        );
    }

    async renderBillReminders() {
        const container = document.getElementById('billRemindersList');
        if (!container) return;
        
        const bills = await DB.getBillReminders();
        const now = new Date();
        
        if (bills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">📅</div>
                    <p>Tidak ada tagihan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = bills.map(bill => {
            const daysLeft = this.calculateDaysLeft(bill.dueDate);
            let statusClass = '';
            let statusText = '';
            
            if (bill.paid) {
                statusClass = 'success';
                statusText = '✅ Lunas';
            } else if (daysLeft < 0) {
                statusClass = 'danger';
                statusText = '⏰ Terlambat';
            } else if (daysLeft <= 3) {
                statusClass = 'warning';
                statusText = `${daysLeft} hari lagi`;
            } else {
                statusText = `${daysLeft} hari lagi`;
            }

            return `
                <div class="card" style="margin-bottom: 15px; border-left: 4px solid var(--${statusClass}-color);">
                    <div class="card-header">
                        <h4 class="card-title">${bill.emoji} ${bill.name}</h4>
                        <span style="color: var(--${statusClass}-color); font-weight: bold;">${statusText}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="margin: 0; font-size: 16px; font-weight: bold;">${Utils.formatCurrency(bill.amount)}</p>
                            <p style="margin: 0; font-size: 12px; color: #666;">Jatuh tempo: ${Utils.formatDateShort(bill.dueDate)}</p>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-success btn-sm pay-bill-btn" data-bill-id="${bill.id}">💸 Bayar</button>
                            <button class="btn btn-info btn-sm edit-bill-btn" data-bill-id="${bill.id}">✏️ Edit</button>
                            <button class="btn btn-danger btn-sm delete-bill-btn" data-bill-id="${bill.id}">🗑️ Hapus</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.pay-bill-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.payBill(e.target.dataset.billId))
        );
        container.querySelectorAll('.edit-bill-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.showEditBillModal(e.target.dataset.billId))
        );
        container.querySelectorAll('.delete-bill-btn').forEach(btn => 
            btn.addEventListener('click', (e) => this.deleteBill(e.target.dataset.billId))
        );
    }

    async renderLiabilitiesSummary() {
        const container = document.getElementById('liabilitiesSummary');
        if (!container) return;
        
        const [liabilities, payments, bills] = await Promise.all([
            DB.getLiabilities(), 
            DB.getLiabilityPayments(), 
            DB.getBillReminders()
        ]);
        
        const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalRemaining = totalLiabilities - totalPaid;
        
        const unpaidBills = bills.filter(b => !b.paid);
        const totalBillsDue = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
        
        const now = new Date();
        const overdueLiabilities = liabilities.filter(l => {
            const dueDate = new Date(l.dueDate);
            return dueDate < now && (l.amount - this.calculatePaidAmount(l.id, payments)) > 0;
        });
        const totalOverdue = overdueLiabilities.reduce((sum, l) => sum + (l.amount - this.calculatePaidAmount(l.id, payments)), 0);
        
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="card text-center">
                    <h4 style="color: var(--danger-color); margin: 0;">${Utils.formatCurrency(totalRemaining)}</h4>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Total Hutang</p>
                </div>
                <div class="card text-center">
                    <h4 style="color: var(--warning-color); margin: 0;">${Utils.formatCurrency(totalBillsDue)}</h4>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Tagihan Belum Bayar</p>
                </div>
                <div class="card text-center">
                    <h4 style="color: var(--danger-color); margin: 0;">${Utils.formatCurrency(totalOverdue)}</h4>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Hutang Terlambat</p>
                </div>
                <div class="card text-center">
                    <h4 style="color: var(--success-color); margin: 0;">${Utils.formatCurrency(totalPaid)}</h4>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Total Terbayar</p>
                </div>
            </div>
        `;
    }

    // Modal methods untuk liabilities (diambil dari liabilities.js)
    async showAddLiabilityModal() {
        const wallets = await DB.getWallets();
        const walletOptions = wallets.map(w => 
            `<option value="${w.id}">${w.emoji} ${w.name}</option>`
        ).join('');
        
        const content = `
            <form id="addLiabilityForm">
                <div class="form-group">
                    <label>Nama Hutang</label>
                    <input type="text" class="form-control" id="liabilityName" required>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="liabilityEmoji" value="💳" required>
                </div>
                <div class="form-group">
                    <label>Jumlah Hutang</label>
                    <input type="number" class="form-control" id="liabilityAmount" required min="1">
                </div>
                <div class="form-group">
                    <label>Tanggal Jatuh Tempo</label>
                    <input type="date" class="form-control" id="liabilityDueDate" required>
                </div>
                <div class="form-group">
                    <label>Kreditur (Pemberi Hutang)</label>
                    <input type="text" class="form-control" id="liabilityCreditor">
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea class="form-control" id="liabilityNotes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Tambah Hutang</button>
            </form>
        `;
        
        Utils.createModal('addLiabilityModal', 'Tambah Hutang', content);
        Utils.openModal('addLiabilityModal');

        document.getElementById('addLiabilityForm').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('liabilityName').value;
            const emoji = document.getElementById('liabilityEmoji').value;
            const amount = parseFloat(document.getElementById('liabilityAmount').value);
            const dueDate = document.getElementById('liabilityDueDate').value;
            const creditor = document.getElementById('liabilityCreditor').value;
            const notes = document.getElementById('liabilityNotes').value;

            const liabilities = await DB.getLiabilities();
            liabilities.push({ 
                id: DB.generateId(), 
                name, 
                emoji, 
                amount, 
                dueDate, 
                creditor, 
                notes 
            });
            
            await DB.saveLiabilities(liabilities);
            Utils.closeModal('addLiabilityModal');
            await this.renderLiabilitiesList();
            await this.renderLiabilitiesSummary();
            Utils.showToast('Hutang berhasil ditambahkan!', 'success');
        };
    }

    async showEditLiabilityModal(liabilityId) {
        const liabilities = await DB.getLiabilities();
        const liability = liabilities.find(l => l.id === liabilityId);
        if (!liability) return;
        
        const content = `
            <form id="editLiabilityForm">
                <div class="form-group">
                    <label>Nama Hutang</label>
                    <input type="text" class="form-control" id="editLiabilityName" value="${liability.name}" required>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="editLiabilityEmoji" value="${liability.emoji}" required>
                </div>
                <div class="form-group">
                    <label>Jumlah Hutang</label>
                    <input type="number" class="form-control" id="editLiabilityAmount" value="${liability.amount}" required min="1">
                </div>
                <div class="form-group">
                    <label>Tanggal Jatuh Tempo</label>
                    <input type="date" class="form-control" id="editLiabilityDueDate" value="${liability.dueDate}" required>
                </div>
                <div class="form-group">
                    <label>Kreditur (Pemberi Hutang)</label>
                    <input type="text" class="form-control" id="editLiabilityCreditor" value="${liability.creditor || ''}">
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea class="form-control" id="editLiabilityNotes" rows="3">${liability.notes || ''}</textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Update Hutang</button>
            </form>
        `;
        
        Utils.createModal('editLiabilityModal', 'Edit Hutang', content);
        Utils.openModal('editLiabilityModal');

        document.getElementById('editLiabilityForm').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('editLiabilityName').value;
            const emoji = document.getElementById('editLiabilityEmoji').value;
            const amount = parseFloat(document.getElementById('editLiabilityAmount').value);
            const dueDate = document.getElementById('editLiabilityDueDate').value;
            const creditor = document.getElementById('editLiabilityCreditor').value;
            const notes = document.getElementById('editLiabilityNotes').value;

            const updatedLiabilities = liabilities.map(l => 
                l.id === liabilityId ? { ...l, name, emoji, amount, dueDate, creditor, notes } : l
            );
            
            await DB.saveLiabilities(updatedLiabilities);
            Utils.closeModal('editLiabilityModal');
            await this.renderLiabilitiesList();
            await this.renderLiabilitiesSummary();
            Utils.showToast('Hutang berhasil diperbarui!', 'success');
        };
    }

    async deleteLiability(liabilityId) {
        if (!confirm('Hapus hutang ini?')) return;
        
        const [liabilities, payments] = await Promise.all([
            DB.getLiabilities(), 
            DB.getLiabilityPayments()
        ]);
        
        const updatedLiabilities = liabilities.filter(l => l.id !== liabilityId);
        const updatedPayments = payments.filter(p => p.liabilityId !== liabilityId);
        
        await Promise.all([
            DB.saveLiabilities(updatedLiabilities), 
            DB.saveLiabilityPayments(updatedPayments)
        ]);
        
        await this.renderLiabilitiesList();
        await this.renderLiabilitiesSummary();
        Utils.showToast('Hutang berhasil dihapus!', 'success');
    }

    async showPayLiabilityModal(liabilityId) {
        const [liabilities, payments, wallets] = await Promise.all([
            DB.getLiabilities(), 
            DB.getLiabilityPayments(), 
            DB.getWallets()
        ]);
        
        const liability = liabilities.find(l => l.id === liabilityId);
        if (!liability) return;
        
        const paidAmount = this.calculatePaidAmount(liabilityId, payments);
        const remaining = liability.amount - paidAmount;
        
        const walletOptions = wallets.map(w => 
            `<option value="${w.id}">${w.emoji} ${w.name} (${Utils.formatCurrency(w.balance)})</option>`
        ).join('');
        
        const content = `
            <form id="payLiabilityForm">
                <div class="form-group">
                    <label>Jumlah Bayar</label>
                    <input type="number" class="form-control" id="paymentAmount" 
                           required min="1" max="${remaining}" value="${remaining}">
                    <small>Sisa hutang: ${Utils.formatCurrency(remaining)}</small>
                </div>
                <div class="form-group">
                    <label>Dari Dompet</label>
                    <select class="form-control" id="paymentWallet" required>
                        ${walletOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tanggal Bayar</label>
                    <input type="date" class="form-control" id="paymentDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Catatan (Opsional)</label>
                    <input type="text" class="form-control" id="paymentNotes">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Bayar</button>
            </form>
        `;
        
        Utils.createModal('payLiabilityModal', 'Bayar Hutang', content);
        Utils.openModal('payLiabilityModal');

        document.getElementById('payLiabilityForm').onsubmit = (e) => {
            e.preventDefault();
            this.processLiabilityPayment(liabilityId);
        };
    }

    async processLiabilityPayment(liabilityId) {
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const walletId = document.getElementById('paymentWallet').value;
        const date = document.getElementById('paymentDate').value;
        const notes = document.getElementById('paymentNotes').value;

        const [liabilities, payments, wallets, transactions] = await Promise.all([
            DB.getLiabilities(), 
            DB.getLiabilityPayments(), 
            DB.getWallets(), 
            DB.getTransactions()
        ]);
        
        const liability = liabilities.find(l => l.id === liabilityId);
        const wallet = wallets.find(w => w.id === walletId);
        
        if (!wallet || wallet.balance < amount) {
            return Utils.showToast('Saldo tidak cukup!', 'error');
        }

        wallet.balance -= amount;
        
        payments.push({ 
            id: DB.generateId(), 
            liabilityId, 
            amount, 
            walletId, 
            date, 
            notes 
        });
        
        const categoryId = await this.getOrCreateLiabilityCategory();
        transactions.push({ 
            id: DB.generateId(), 
            type: 'expense', 
            amount, 
            walletId, 
            categoryId, 
            date, 
            notes: `Bayar hutang: ${liability.name}` 
        });

        await Promise.all([
            DB.saveWallets(wallets),
            DB.saveLiabilityPayments(payments),
            DB.saveTransactions(transactions)
        ]);
        
        Utils.closeModal('payLiabilityModal');
        await this.renderLiabilitiesList();
        await this.renderLiabilitiesSummary();
        await this.app.updateTotalBalance();
        Utils.showToast('Pembayaran hutang berhasil!', 'success');
    }

    async showAddBillModal() {
        const content = `
            <form id="addBillForm">
                <div class="form-group">
                    <label>Nama Tagihan</label>
                    <input type="text" class="form-control" id="billName" required>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="billEmoji" value="📅" required>
                </div>
                <div class="form-group">
                    <label>Jumlah Tagihan</label>
                    <input type="number" class="form-control" id="billAmount" required min="1">
                </div>
                <div class="form-group">
                    <label>Tanggal Jatuh Tempo</label>
                    <input type="date" class="form-control" id="billDueDate" required>
                </div>
                <div class="form-group">
                    <label>Kategori Tagihan</label>
                    <select class="form-control" id="billCategory">
                        <option value="listrik">⚡ Listrik</option>
                        <option value="air">💧 Air</option>
                        <option value="internet">🌐 Internet</option>
                        <option value="telepon">📱 Telepon</option>
                        <option value="sewa">🏠 Sewa</option>
                        <option value="lainnya">📋 Lainnya</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea class="form-control" id="billNotes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Tambah Tagihan</button>
            </form>
        `;
        
        Utils.createModal('addBillModal', 'Tambah Tagihan', content);
        Utils.openModal('addBillModal');

        document.getElementById('addBillForm').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('billName').value;
            const emoji = document.getElementById('billEmoji').value;
            const amount = parseFloat(document.getElementById('billAmount').value);
            const dueDate = document.getElementById('billDueDate').value;
            const category = document.getElementById('billCategory').value;
            const notes = document.getElementById('billNotes').value;

            const bills = await DB.getBillReminders();
            bills.push({ 
                id: DB.generateId(), 
                name, 
                emoji, 
                amount, 
                dueDate, 
                category, 
                notes, 
                paid: false 
            });
            
            await DB.saveBillReminders(bills);
            Utils.closeModal('addBillModal');
            await this.renderBillReminders();
            await this.renderLiabilitiesSummary();
            Utils.showToast('Tagihan berhasil ditambahkan!', 'success');
        };
    }

    async showEditBillModal(billId) {
        const bills = await DB.getBillReminders();
        const bill = bills.find(b => b.id === billId);
        if (!bill) return;
        
        const content = `
            <form id="editBillForm">
                <div class="form-group">
                    <label>Nama Tagihan</label>
                    <input type="text" class="form-control" id="editBillName" value="${bill.name}" required>
                </div>
                <div class="form-group">
                    <label>Emoji</label>
                    <input type="text" class="form-control" id="editBillEmoji" value="${bill.emoji}" required>
                </div>
                <div class="form-group">
                    <label>Jumlah Tagihan</label>
                    <input type="number" class="form-control" id="editBillAmount" value="${bill.amount}" required min="1">
                </div>
                <div class="form-group">
                    <label>Tanggal Jatuh Tempo</label>
                    <input type="date" class="form-control" id="editBillDueDate" value="${bill.dueDate}" required>
                </div>
                <div class="form-group">
                    <label>Kategori Tagihan</label>
                    <select class="form-control" id="editBillCategory">
                        <option value="listrik" ${bill.category === 'listrik' ? 'selected' : ''}>⚡ Listrik</option>
                        <option value="air" ${bill.category === 'air' ? 'selected' : ''}>💧 Air</option>
                        <option value="internet" ${bill.category === 'internet' ? 'selected' : ''}>🌐 Internet</option>
                        <option value="telepon" ${bill.category === 'telepon' ? 'selected' : ''}>📱 Telepon</option>
                        <option value="sewa" ${bill.category === 'sewa' ? 'selected' : ''}>🏠 Sewa</option>
                        <option value="lainnya" ${bill.category === 'lainnya' ? 'selected' : ''}>📋 Lainnya</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea class="form-control" id="editBillNotes" rows="3">${bill.notes || ''}</textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Update Tagihan</button>
            </form>
        `;
        
        Utils.createModal('editBillModal', 'Edit Tagihan', content);
        Utils.openModal('editBillModal');

        document.getElementById('editBillForm').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('editBillName').value;
            const emoji = document.getElementById('editBillEmoji').value;
            const amount = parseFloat(document.getElementById('editBillAmount').value);
            const dueDate = document.getElementById('editBillDueDate').value;
            const category = document.getElementById('editBillCategory').value;
            const notes = document.getElementById('editBillNotes').value;

            const updatedBills = bills.map(b => 
                b.id === billId ? { ...b, name, emoji, amount, dueDate, category, notes } : b
            );
            
            await DB.saveBillReminders(updatedBills);
            Utils.closeModal('editBillModal');
            await this.renderBillReminders();
            await this.renderLiabilitiesSummary();
            Utils.showToast('Tagihan berhasil diperbarui!', 'success');
        };
    }

    async deleteBill(billId) {
        if (!confirm('Hapus tagihan ini?')) return;
        
        const bills = await DB.getBillReminders();
        const updatedBills = bills.filter(b => b.id !== billId);
        await DB.saveBillReminders(updatedBills);
        
        await this.renderBillReminders();
        await this.renderLiabilitiesSummary();
        Utils.showToast('Tagihan berhasil dihapus!', 'success');
    }

    async payBill(billId) {
        const [bills, wallets] = await Promise.all([
            DB.getBillReminders(), 
            DB.getWallets()
        ]);
        
        const bill = bills.find(b => b.id === billId);
        if (!bill) return;
        
        if (bill.paid) {
            return Utils.showToast('Tagihan sudah dibayar!', 'error');
        }
        
        const walletOptions = wallets.map(w => 
            `<option value="${w.id}">${w.emoji} ${w.name} (${Utils.formatCurrency(w.balance)})</option>`
        ).join('');
        
        const content = `
            <form id="payBillForm">
                <div class="form-group">
                    <label>Jumlah Bayar</label>
                    <input type="number" class="form-control" id="billPaymentAmount" value="${bill.amount}" required min="1">
                </div>
                <div class="form-group">
                    <label>Dari Dompet</label>
                    <select class="form-control" id="billPaymentWallet" required>
                        ${walletOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tanggal Bayar</label>
                    <input type="date" class="form-control" id="billPaymentDate" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Catatan (Opsional)</label>
                    <input type="text" class="form-control" id="billPaymentNotes" value="Bayar tagihan ${bill.name}">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Bayar Tagihan</button>
            </form>
        `;
        
        Utils.createModal('payBillModal', 'Bayar Tagihan', content);
        Utils.openModal('payBillModal');

        document.getElementById('payBillForm').onsubmit = async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('billPaymentAmount').value);
            const walletId = document.getElementById('billPaymentWallet').value;
            const date = document.getElementById('billPaymentDate').value;
            const notes = document.getElementById('billPaymentNotes').value;

            const [wallets, transactions] = await Promise.all([
                DB.getWallets(), 
                DB.getTransactions()
            ]);
            
            const wallet = wallets.find(w => w.id === walletId);
            
            if (!wallet || wallet.balance < amount) {
                return Utils.showToast('Saldo tidak cukup!', 'error');
            }

            wallet.balance -= amount;
            bill.paid = true;
            
            const categoryId = await this.getOrCreateBillCategory(bill.category);
            transactions.push({ 
                id: DB.generateId(), 
                type: 'expense', 
                amount, 
                walletId, 
                categoryId, 
                date, 
                notes 
            });

            await Promise.all([
                DB.saveWallets(wallets),
                DB.saveBillReminders(bills),
                DB.saveTransactions(transactions)
            ]);
            
            Utils.closeModal('payBillModal');
            await this.renderBillReminders();
            await this.renderLiabilitiesSummary();
            await this.app.updateTotalBalance();
            Utils.showToast('Tagihan berhasil dibayar!', 'success');
        };
    }

    // ====================================================================
    // HELPER METHODS
    // ====================================================================

    calculateDaysLeft(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    calculatePaidAmount(liabilityId, payments) {
        return payments
            .filter(p => p.liabilityId === liabilityId)
            .reduce((sum, p) => sum + p.amount, 0);
    }

    async getOrCreateLiabilityCategory() {
        const categories = await DB.getCategories();
        let liabilityCategory = categories.find(c => c.name === 'Pembayaran Hutang' && c.type === 'expense');
        
        if (!liabilityCategory) {
            liabilityCategory = { 
                id: DB.generateId(), 
                name: 'Pembayaran Hutang', 
                type: 'expense', 
                emoji: '💸' 
            };
            categories.push(liabilityCategory);
            await DB.saveCategories(categories);
        }
        return liabilityCategory.id;
    }

    async getOrCreateBillCategory(categoryType) {
        const categories = await DB.getCategories();
        const categoryNames = {
            'listrik': 'Listrik',
            'air': 'Air',
            'internet': 'Internet',
            'telepon': 'Telepon',
            'sewa': 'Sewa',
            'lainnya': 'Tagihan Lainnya'
        };
        
        const categoryName = categoryNames[categoryType] || 'Tagihan Lainnya';
        let billCategory = categories.find(c => c.name === categoryName && c.type === 'expense');
        
        if (!billCategory) {
            const emojis = {
                'listrik': '⚡',
                'air': '💧',
                'internet': '🌐',
                'telepon': '📱',
                'sewa': '🏠',
                'lainnya': '📋'
            };
            
            billCategory = { 
                id: DB.generateId(), 
                name: categoryName, 
                type: 'expense', 
                emoji: emojis[categoryType] || '📋'
            };
            categories.push(billCategory);
            await DB.saveCategories(categories);
        }
        return billCategory.id;
    }
}