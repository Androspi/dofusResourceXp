export class Toast {

    static showNotification(title, message) {
        const toast = Toast.#createToast(title, message);

        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast);
        toastBootstrap.show();
    }

    static #createToast(title, message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `<div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>`;

        document.querySelector('.toast-container').appendChild(toast);

        toast.addEventListener('hide.bs.toast', () => {
            toast.remove();
        });

        return toast;
    }

}
