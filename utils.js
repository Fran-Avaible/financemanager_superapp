// js/utils.js - Simplified Version

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
            if (e.target === modal) Utils.closeModal(id);
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
    }
};

console.log('✅ Utils loaded as module');