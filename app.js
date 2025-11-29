// 支出追踪器主应用类
class ExpenseTracker {
    constructor() {
        this.expenses = this.loadExpenses();
        this.budget = this.loadBudget();
        this.currentFilter = {
            category: '',
            month: ''
        };
        this.init();
    }

    // 初始化应用
    init() {
        this.renderExpenses();
        this.renderStats();
        this.renderBudget();
        this.setupEventListeners();
        this.setDefaultDate();
    }

    // 设置事件监听器
    setupEventListeners() {
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // 监听筛选器变化
        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.currentFilter.category = e.target.value;
            this.filterExpenses();
        });

        document.getElementById('filter-month').addEventListener('change', (e) => {
            this.currentFilter.month = e.target.value;
            this.filterExpenses();
        });
    }

    // 设置默认日期为今天
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    // 添加支出
    addExpense() {
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value.trim();

        // 验证输入
        if (!date || !category || !amount || amount <= 0) {
            this.showMessage('请填写完整且有效的支出信息！', 'error');
            return;
        }

        const expense = {
            id: Date.now(),
            date,
            category,
            amount,
            description
        };

        this.expenses.push(expense);
        this.saveExpenses();
        this.renderExpenses();
        this.renderStats();
        this.renderBudget();
        
        // 重置表单
        document.getElementById('expense-form').reset();
        this.setDefaultDate();
        
        this.showMessage('支出记录添加成功！', 'success');
    }

    // 删除支出
    deleteExpense(id) {
        if (confirm('确定要删除这条支出记录吗？此操作不可撤销。')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.renderExpenses();
            this.renderStats();
            this.renderBudget();
            this.showMessage('支出记录已删除！', 'success');
        }
    }

    // 筛选支出
    filterExpenses() {
        this.renderExpenses();
    }

    // 获取筛选后的支出
    getFilteredExpenses() {
        let filtered = [...this.expenses];

        if (this.currentFilter.category) {
            filtered = filtered.filter(expense => expense.category === this.currentFilter.category);
        }

        if (this.currentFilter.month) {
            filtered = filtered.filter(expense => expense.date.startsWith(this.currentFilter.month));
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 渲染支出列表
    renderExpenses() {
        const container = document.getElementById('expenses-container');
        const filteredExpenses = this.getFilteredExpenses();

        if (filteredExpenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📭 暂无支出记录</p>
                    <p class="empty-hint">尝试添加第一条支出记录或调整筛选条件</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <span class="expense-date">${this.formatDate(expense.date)}</span>
                    <span class="expense-category category-${expense.category}">
                        ${this.getCategoryName(expense.category)}
                    </span>
                    <span class="expense-description">${expense.description || '无备注'}</span>
                </div>
                <div class="expense-actions">
                    <span class="expense-amount">¥${expense.amount.toFixed(2)}</span>
                    <button onclick="tracker.deleteExpense(${expense.id})" class="delete-btn">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 渲染统计信息
    renderStats() {
        const container = document.getElementById('stats-container');
        const stats = this.calculateStats();
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <h3>总支出</h3>
                    <p class="stat-number">¥${stats.total.toFixed(2)}</p>
                </div>
                <div class="stat-item">
                    <h3>本月支出</h3>
                    <p class="stat-number">¥${stats.monthly.toFixed(2)}</p>
                </div>
                <div class="stat-item">
                    <h3>平均每日</h3>
                    <p class="stat-number">¥${stats.daily.toFixed(2)}</p>
                </div>
                <div class="stat-item">
                    <h3>支出笔数</h3>
                    <p class="stat-number">${stats.count}</p>
                </div>
            </div>
            <div class="category-stats">
                <h4>📈 按类别统计</h4>
                ${Object.entries(stats.byCategory)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, amount]) => `
                    <div class="category-stat">
                        <span>${this.getCategoryName(category)}</span>
                        <span>¥${amount.toFixed(2)} (${((amount / stats.total) * 100).toFixed(1)}%)</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 渲染预算信息
    renderBudget() {
        const display = document.getElementById('budget-display');
        if (!this.budget) {
            display.innerHTML = '<p class="budget-hint">💡 设置月度预算可以更好地管理您的支出</p>';
            return;
        }

        const monthlySpent = this.getMonthlyTotal();
        const remaining = this.budget - monthlySpent;
        const percentage = (monthlySpent / this.budget) * 100;

        let budgetStatus = '良好';
        let statusColor = 'var(--success-color)';
        
        if (percentage >= 80) {
            budgetStatus = '警告';
            statusColor = 'var(--warning-color)';
        }
        if (percentage >= 100) {
            budgetStatus = '超支';
            statusColor = 'var(--danger-color)';
        }

        display.innerHTML = `
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background: ${statusColor};"></div>
                </div>
                <div class="budget-numbers">
                    <span>已用: ¥${monthlySpent.toFixed(2)}</span>
                    <span>剩余: ¥${remaining.toFixed(2)}</span>
                    <span>预算: ¥${this.budget.toFixed(2)}</span>
                    <span style="color: ${statusColor}">状态: ${budgetStatus}</span>
                </div>
            </div>
        `;
    }

    // 计算统计数据
    calculateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 本月支出
        const monthlyExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });

        const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const monthly = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const count = this.expenses.length;
        
        // 按类别统计
        const byCategory = {};
        this.expenses.forEach(expense => {
            byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
        });

        // 计算日均支出（基于本月）
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const currentDay = now.getDate();
        const daily = monthly / Math.max(currentDay, 1);

        return { total, monthly, daily, count, byCategory };
    }

    // 获取本月总支出
    getMonthlyTotal() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return this.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && 
                       expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);
    }

    // 工具方法
    getCategoryName(category) {
        const categories = {
            food: '🍔 餐饮',
            transport: '🚗 交通',
            shopping: '🛍️ 购物',
            entertainment: '🎬 娱乐',
            study: '📚 学习',
            other: '📦 其他'
        };
        return categories[category] || category;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    showMessage(message, type = 'info') {
        // 简单的消息提示实现
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transition: all 0.3s;
            background: ${type === 'success' ? 'var(--success-color)' : 
                        type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }

    // 数据存储方法
    loadExpenses() {
        try {
            return JSON.parse(localStorage.getItem('expenses_77') || '[]');
        } catch (e) {
            console.error('加载支出数据失败:', e);
            return [];
        }
    }

    saveExpenses() {
        try {
            localStorage.setItem('expenses_77', JSON.stringify(this.expenses));
            return true;
        } catch (e) {
            console.error('保存支出数据失败:', e);
            this.showMessage('保存数据失败，请检查存储空间', 'error');
            return false;
        }
    }

    loadBudget() {
        try {
            const budget = localStorage.getItem('budget_77');
            return budget ? parseFloat(budget) : null;
        } catch (e) {
            console.error('加载预算数据失败:', e);
            return null;
        }
    }

    saveBudget(budget) {
        try {
            localStorage.setItem('budget_77', budget.toString());
            return true;
        } catch (e) {
            console.error('保存预算数据失败:', e);
            this.showMessage('保存预算失败', 'error');
            return false;
        }
    }
}

// 全局函数
function setBudget() {
    const budgetInput = document.getElementById('monthly-budget');
    const budget = parseFloat(budgetInput.value);
    
    if (budget && budget > 0) {
        tracker.budget = budget;
        tracker.saveBudget(budget);
        tracker.renderBudget();
        budgetInput.value = '';
        tracker.showMessage('月度预算设置成功！', 'success');
    } else {
        tracker.showMessage('请输入有效的预算金额！', 'error');
    }
}

function exportToCSV() {
    if (tracker.expenses.length === 0) {
        tracker.showMessage('没有数据可导出！', 'error');
        return;
    }

    const headers = ['日期', '类别', '金额', '备注'];
    const csvContent = [
        headers.join(','),
        ...tracker.expenses.map(expense => [
            expense.date,
            tracker.getCategoryName(expense.category).replace(/[🎯🍔🚗🛍️🎬📚📦]/g, '').trim(),
            expense.amount,
            `"${(expense.description || '').replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `支出记录_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    tracker.showMessage('CSV文件导出成功！', 'success');
}

function clearAllData() {
    if (confirm('⚠️  确定要清空所有数据吗？此操作不可撤销！') && 
        confirm('🚨 再次确认：这将删除所有支出记录和预算设置！')) {
        localStorage.removeItem('expenses_77');
        localStorage.removeItem('budget_77');
        tracker.expenses = [];
        tracker.budget = null;
        tracker.renderExpenses();
        tracker.renderStats();
        tracker.renderBudget();
        tracker.showMessage('所有数据已清空！', 'success');
    }
}

function filterExpenses() {
    tracker.filterExpenses();
}

// 初始化应用
const tracker = new ExpenseTracker();