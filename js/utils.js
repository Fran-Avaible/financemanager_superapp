
// js/utils.js - Enhanced Version untuk mendukung modul-modul

export const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatDateShort: (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    },

    createModal: (id, title, content) => {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        
        // Hapus modal lama jika ada
        const existingModal = document.getElementById(id);
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'modal hidden';
        modal.id = id;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="window.app.closeModal('${id}')">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        `;
        
        modalContainer.appendChild(modal);
        
        // Event listener untuk menutup saat klik di luar modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(id);
        });
    },

    openModal: (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    closeModal: (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    showToast: (message, type = 'info') => {
        // Method ini sekarang ada di main app
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            // Fallback jika app belum siap
            console.log(`Toast [${type}]: ${message}`);
        }
    },

    // Helper untuk form controls
    createFormGroup: (label, inputId, inputType = 'text', value = '', options = {}) => {
        const { placeholder = '', required = false, selectOptions = [] } = options;
        
        if (inputType === 'select') {
            return `
                <div class="form-group">
                    <label for="${inputId}" class="form-label">${label}</label>
                    <select id="${inputId}" class="form-control" ${required ? 'required' : ''}>
                        ${selectOptions.map(opt => 
                            `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        }

        return `
            <div class="form-group">
                <label for="${inputId}" class="form-label">${label}</label>
                <input type="${inputType}" id="${inputId}" class="form-control" 
                       value="${value}" placeholder="${placeholder}" ${required ? 'required' : ''}>
            </div>
        `;
    },

    // Helper untuk empty states
    createEmptyState: (emoji, message, buttonText = '', buttonAction = '') => {
        return `
            <div class="empty-state">
                <div class="emoji">${emoji}</div>
                <p>${message}</p>
                ${buttonText ? `
                    <button class="btn btn-primary" onclick="${buttonAction}" style="margin-top: 10px;">
                        ${buttonText}
                    </button>
                ` : ''}
            </div>
        `;
    }
};

console.log('✅ Utils loaded as module');
