// js/modules/reports.js (Versi Final dengan async/await - FIXED)
import { DB } from '../database.js';
import { Utils } from '../utils.js';

export class ReportsModule {
    constructor(app) {
        this.app = app;
    }

    async render(container) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📈 Laporan Bulanan</h3>
                    <div>
                        <select id="reportMonth" class="form-control" style="width: auto; display: inline-block;">
                            ${this.generateMonthOptions()}
                        </select>
                        <select id="reportYear" class="form-control" style="width: auto; display: inline-block;">
                            ${this.generateYearOptions()}
                        </select>
                        <button class="btn btn-primary" id="generateReportBtn">
                            Generate
                        </button>
                    </div>
                </div>
                <div id="reportContent">
                    <div class="empty-state">
                        <div class="emoji">📊</div>
                        <p>Pilih bulan dan tahun untuk generate laporan</p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📊 Charts & Analytics</h3>
                </div>
                <div id="chartsContainer">
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div class="emoji">📈</div>
                        <p>Grafik akan muncul di sini setelah generate laporan</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('generateReportBtn').addEventListener('click', () => this.generateReport());

        // Generate laporan awal saat tab dibuka
        await this.generateReport();
    }

    generateMonthOptions() {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const currentMonth = new Date().getMonth();
        return months.map((month, index) => `<option value="${index + 1}" ${index === currentMonth ? 'selected' : ''}>${month}</option>`).join('');
    }

    generateYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        for (let i = currentYear - 5; i <= currentYear; i++) {
            options += `<option value="${i}" ${i === currentYear ? 'selected' : ''}>${i}</option>`;
        }
        return options;
    }

    async generateReport() {
        const reportMonth = document.getElementById('reportMonth')?.value;
        const reportYear = document.getElementById('reportYear')?.value;
        const reportContentDiv = document.getElementById('reportContent');
        const chartsContainerDiv = document.getElementById('chartsContainer');

        if (!reportMonth || !reportYear || !reportContentDiv || !chartsContainerDiv) return;

        // Tampilkan loading
        reportContentDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="emoji">⏳</div>
                <p>Memuat data laporan...</p>
            </div>
        `;

        chartsContainerDiv.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="emoji">📊</div>
                <p>Menyiapkan grafik...</p>
            </div>
        `;

        // Ambil semua data yang dibutuhkan secara paralel untuk efisiensi
        const [transactions, categories, wallets] = await Promise.all([
            DB.getTransactions(),
            DB.getCategories(),
            DB.getWallets()
        ]);

        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() + 1 === parseInt(reportMonth) &&
                   transactionDate.getFullYear() === parseInt(reportYear);
        });

        if (filteredTransactions.length === 0) {
            reportContentDiv.innerHTML = `
                <div class="empty-state">
                    <div class="emoji">📝</div>
                    <p>Tidak ada transaksi untuk bulan ini.</p>
                    <button class="btn btn-primary" onclick="window.app.showAddTransactionModal()" style="margin-top: 10px;">
                        + Tambah Transaksi Pertama
                    </button>
                </div>
            `;
            chartsContainerDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div class="emoji">📈</div>
                    <p>Tidak ada data untuk menampilkan grafik</p>
                </div>
            `;
            return;
        }

        let totalIncome = 0;
        let totalExpense = 0;
        const categorySummary = {};
        const expenseDataForChart = {};
        const incomeDataForChart = {};
        const walletSummary = {};

        filteredTransactions.forEach(t => {
            const category = categories.find(c => c.id === t.categoryId);
            const categoryName = category ? category.name : 'Uncategorized';
            const wallet = wallets.find(w => w.id === t.walletId);
            const walletName = wallet ? wallet.name : 'Unknown';

            // Initialize category summary
            if (!categorySummary[categoryName]) {
                categorySummary[categoryName] = { income: 0, expense: 0, count: 0 };
            }

            // Initialize wallet summary
            if (!walletSummary[walletName]) {
                walletSummary[walletName] = { income: 0, expense: 0, count: 0 };
            }

            if (t.type === 'income') {
                totalIncome += t.amount;
                categorySummary[categoryName].income += t.amount;
                categorySummary[categoryName].count++;
                walletSummary[walletName].income += t.amount;
                walletSummary[walletName].count++;
                
                // Data untuk chart pemasukan
                incomeDataForChart[categoryName] = (incomeDataForChart[categoryName] || 0) + t.amount;
            } else if (t.type === 'expense') {
                totalExpense += t.amount;
                categorySummary[categoryName].expense += t.amount;
                categorySummary[categoryName].count++;
                walletSummary[walletName].expense += t.amount;
                walletSummary[walletName].count++;
                
                // Data untuk chart pengeluaran
                expenseDataForChart[categoryName] = (expenseDataForChart[categoryName] || 0) + t.amount;
            }
        });

        const netBalance = totalIncome - totalExpense;
        const monthName = new Date(reportYear, reportMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        // Render Laporan Teks
        reportContentDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                <h4 style="margin-bottom: 10px;">Ringkasan untuk ${monthName}</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                    <div style="text-align: center; padding: var(--spacing-md); background: rgba(46, 204, 113, 0.1); border-radius: var(--border-radius-sm);">
                        <div style="font-size: 12px; color: #666;">Total Pemasukan</div>
                        <div style="font-size: 18px; font-weight: bold; color: var(--success-color);">${Utils.formatCurrency(totalIncome)}</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-md); background: rgba(231, 76, 60, 0.1); border-radius: var(--border-radius-sm);">
                        <div style="font-size: 12px; color: #666;">Total Pengeluaran</div>
                        <div style="font-size: 18px; font-weight: bold; color: var(--danger-color);">${Utils.formatCurrency(totalExpense)}</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-md); background: rgba(52, 152, 219, 0.1); border-radius: var(--border-radius-sm);">
                        <div style="font-size: 12px; color: #666;">Saldo Bersih</div>
                        <div style="font-size: 18px; font-weight: bold; color: ${netBalance >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">${Utils.formatCurrency(netBalance)}</div>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <div>
                    <h5 style="margin-bottom: var(--spacing-md);">📊 Ringkasan Berdasarkan Kategori</h5>
                    ${this.renderCategorySummary(categorySummary)}
                </div>
                <div>
                    <h5 style="margin-bottom: var(--spacing-md);">💰 Ringkasan Berdasarkan Dompet</h5>
                    ${this.renderWalletSummary(walletSummary)}
                </div>
            </div>
        `;
        
        // Render Charts Container
        chartsContainerDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);">
                <div class="chart-container">
                    <h5 style="text-align: center; margin-bottom: var(--spacing-md);">📉 Pengeluaran Berdasarkan Kategori</h5>
                    <div style="height: 300px; position: relative;">
                        <canvas id="expenseChart"></canvas>
                    </div>
                </div>
                <div class="chart-container">
                    <h5 style="text-align: center; margin-bottom: var(--spacing-md);">📈 Pemasukan Berdasarkan Kategori</h5>
                    <div style="height: 300px; position: relative;">
                        <canvas id="incomeChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="chart-container">
                <h5 style="text-align: center; margin-bottom: var(--spacing-md);">📊 Pemasukan vs Pengeluaran Harian</h5>
                <div style="height: 400px; position: relative;">
                    <canvas id="incomeExpenseChart"></canvas>
                </div>
            </div>
        `;

        // Beri sedikit delay untuk memastikan DOM sudah siap
        setTimeout(() => {
            this.renderExpensePieChart(expenseDataForChart);
            this.renderIncomePieChart(incomeDataForChart);
            this.renderIncomeExpenseBarChart(filteredTransactions);
        }, 100);
    }

    renderCategorySummary(categorySummary) {
        const categories = Object.keys(categorySummary);
        if (categories.length === 0) return '<p style="text-align: center; color: #666;">Tidak ada data</p>';
        
        return categories.map(category => {
            const data = categorySummary[category];
            const total = data.income + data.expense;
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>${category}</span>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: bold;">${Utils.formatCurrency(total)}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${data.income > 0 ? `+${Utils.formatCurrency(data.income)}` : ''} 
                            ${data.expense > 0 ? `-${Utils.formatCurrency(data.expense)}` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderWalletSummary(walletSummary) {
        const wallets = Object.keys(walletSummary);
        if (wallets.length === 0) return '<p style="text-align: center; color: #666;">Tidak ada data</p>';
        
        return wallets.map(wallet => {
            const data = walletSummary[wallet];
            const net = data.income - data.expense;
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>${wallet}</span>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: bold; color: ${net >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">${Utils.formatCurrency(net)}</div>
                        <div style="font-size: 12px; color: #666;">
                            ${data.income > 0 ? `+${Utils.formatCurrency(data.income)}` : ''} 
                            ${data.expense > 0 ? `-${Utils.formatCurrency(data.expense)}` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderExpensePieChart(expenseData) {
        const expenseCtx = document.getElementById('expenseChart');
        if (!expenseCtx || Object.keys(expenseData).length === 0) {
            const container = expenseCtx?.closest('.chart-container');
            if (container) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Tidak ada data pengeluaran</p>';
            }
            return;
        }
        
        // Hancurkan chart lama jika ada untuk mencegah error
        if (window.expenseChartInstance) {
            window.expenseChartInstance.destroy();
        }

        const backgroundColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ];

        window.expenseChartInstance = new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(expenseData),
                datasets: [{
                    data: Object.values(expenseData),
                    backgroundColor: backgroundColors.slice(0, Object.keys(expenseData).length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            boxWidth: 12,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            }
        });
    }

    renderIncomePieChart(incomeData) {
        const incomeCtx = document.getElementById('incomeChart');
        if (!incomeCtx || Object.keys(incomeData).length === 0) {
            const container = incomeCtx?.closest('.chart-container');
            if (container) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Tidak ada data pemasukan</p>';
            }
            return;
        }

        // Hancurkan chart lama jika ada untuk mencegah error
        if (window.incomeChartInstance) {
            window.incomeChartInstance.destroy();
        }

        const backgroundColors = [
            '#2ecc71', '#3498db', '#9b59b6', '#1abc9c',
            '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6'
        ];

        window.incomeChartInstance = new Chart(incomeCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(incomeData),
                datasets: [{
                    data: Object.values(incomeData),
                    backgroundColor: backgroundColors.slice(0, Object.keys(incomeData).length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            boxWidth: 12,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                }
            }
        });
    }

    renderIncomeExpenseBarChart(transactions) {
        const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
        if (!incomeExpenseCtx) return;

        // Logika untuk chart Pemasukan vs Pengeluaran
        const dailyData = {};
        transactions.forEach(t => {
            const day = new Date(t.date).getDate();
            if (!dailyData[day]) dailyData[day] = { income: 0, expense: 0 };
            if (t.type === 'income') dailyData[day].income += t.amount;
            if (t.type === 'expense') dailyData[day].expense += t.amount;
        });

        const days = Object.keys(dailyData).sort((a,b) => a - b);
        if (days.length === 0) {
            const container = incomeExpenseCtx.closest('.chart-container');
            if (container) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Tidak ada data untuk grafik harian</p>';
            }
            return;
        }

        const labels = days.map(day => `Tgl ${day}`);
        const incomeData = days.map(day => dailyData[day].income);
        const expenseData = days.map(day => dailyData[day].expense);

        if (window.incomeExpenseChartInstance) {
            window.incomeExpenseChartInstance.destroy();
        }

        window.incomeExpenseChartInstance = new Chart(incomeExpenseCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { 
                        label: 'Pemasukan', 
                        data: incomeData, 
                        backgroundColor: 'rgba(46, 204, 113, 0.8)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    },
                    { 
                        label: 'Pengeluaran', 
                        data: expenseData, 
                        backgroundColor: 'rgba(231, 76, 60, 0.8)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return 'Rp ' + (value / 1000000).toFixed(1) + 'Jt';
                                } else if (value >= 1000) {
                                    return 'Rp ' + (value / 1000).toFixed(0) + 'Rb';
                                }
                                return 'Rp ' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}
