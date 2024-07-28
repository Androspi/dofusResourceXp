import { ResourceModel } from './database/resource.model.js';
import { DofusApi } from './services/api.service.js';

import { Toast } from './utilities/toast.util.js';

import { } from "./interfaces/index.interface.js";

class IndexPage {

    /** @type {DofusApi} */
    #service;

    /** @type {ResourceModel} */
    #resourceModel;

    /** @type {Index.Resource[]} */
    #resources;

    #paginator = {
        page: 1,
        items: 40,
    };

    /** @type {string} */
    #lastKeyDown;

    constructor() {
        this.#service = new DofusApi();
        this.init();
    }

    init() {
        this.getResources();
        this.setPageLoader();

        document.addEventListener('keydown', event => this.#lastKeyDown = event.key);
        document.addEventListener('click', () => this.#lastKeyDown = undefined);
    }

    getResources() {
        this.#resourceModel = new ResourceModel();

        const apiResourcesPromise = this.#service.getResources();
        const dbResourcesPromise = this.#resourceModel.getAll();

        Promise.all([apiResourcesPromise, dbResourcesPromise]).then(([{ items }, data]) => {

            this.#resources = items.map(({ name, level, type, image_urls, ankama_id }) => {
                const saved = data.find(elm => elm.id === ankama_id);

                return {
                    value: saved?.value ?? null,
                    date: saved?.date ?? null,
                    xp: saved?.xp ?? null,
                    icon: image_urls.sd,
                    type: type.name,
                    id: ankama_id,
                    lvl: level,
                    name,
                };
            }).sort((a, b) => {
                if (!b.xp) { return -1; }
                if (!a.xp) { return 1; }

                const aKxp = a.value / a.xp;
                const bKxp = b.value / b.xp;

                return aKxp > bKxp ? 1 : -1;
            });

            const tbody = document.querySelector('#resource-table tbody');
            tbody.replaceChildren();

            this.loadResources(1);
        });
    }

    setPageLoader() {
        const container = document.querySelector('#resources-section');
        container.addEventListener('wheel', () => {
            const { clientHeight, scrollTop, scrollHeight } = container;
            if (Math.abs((clientHeight + scrollTop) - scrollHeight) > 1) return;

            this.loadResources();
        });
    }

    /**
     * 
     * @param {number} nextPage 
     */
    loadResources(nextPage) {
        nextPage ??= this.#paginator.page + 1;
        this.#paginator.page = nextPage;

        const start = nextPage * this.#paginator.items - this.#paginator.items;
        const end = nextPage * this.#paginator.items;

        const tbody = document.querySelector('#resource-table tbody');

        this.#resources.slice(start, end).forEach(resource => {
            const { name, lvl, icon, value, xp, date } = resource;

            const row = document.createElement('tr');

            const dateCell = this.#createDateCell(date);
            const lvlCell = this.#createSimpleCell('lvl', lvl);
            const nameCell = this.#createNameCell(name, icon);
            const xpCell = this.#createSimpleCell('xp');
            const pmCell = this.#createSimpleCell('pm');
            const kxpCell = this.#createSimpleCell('kxp');
            const totalCell = this.#createSimpleCell('total');

            const valueCell = this.#createValueCell(resource, kxpCell, totalCell);

            if (xp) {
                xpCell.innerHTML = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 })
                    .format(xp);

                valueCell.dispatchEvent(new CustomEvent('update', { detail: { value } }));

                pmCell.innerText = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 })
                    .format(+(20 * xp).toFixed(2));
            }

            row.append(dateCell, lvlCell, nameCell, xpCell, valueCell, pmCell, kxpCell, totalCell);
            tbody.append(row);
        });
    }

    /**
     * 
     * @param {number} date 
     * @returns {HTMLElement}
     */
    #createDateCell(date) {
        const cell = document.createElement('td');
        cell.classList.add('date-cell');
        cell.innerText = date ? (new Date(date)).toLocaleString() : '';
        return cell;
    }

    /**
     * 
     * @param {string} name 
     * @param {string} icon 
     * @returns {HTMLElement}
     */
    #createNameCell(name, icon) {
        const cell = document.createElement('td');
        cell.classList.add('name-cell');

        const iconElm = document.createElement('img');
        iconElm.setAttribute('loading', 'lazy');
        iconElm.setAttribute('height', '30');
        iconElm.src = icon;

        const cellText = document.createElement('span');
        cellText.innerText = name;

        cell.append(iconElm, cellText);

        cell.onclick = () => {
            navigator.clipboard.writeText(name).then(() => {
                Toast.showNotification(name, 'Text copied to clipboard');
            }).catch(err => {
                console.error(err);
                Toast.showNotification(name, 'Failed to copy text');
            });

            document.querySelectorAll('td.table-primary').forEach(elm => elm.classList.remove('table-primary'));
            cell.classList.add('table-primary');
        };

        return cell;
    }

    /**
     * 
     * @param {Index.Resource} resource 
     * @returns {HTMLElement}
     */
    #createValueCell(resource, kxpCell, totalCell) {
        const cell = document.createElement('td');
        cell.tabIndex = 0;
        cell.classList.add(`value-cell`);

        const cellText = document.createElement('span');

        const cellInput = document.createElement('input');
        cellInput.classList.add('form-control', 'form-control-sm');
        cellInput.style.display = 'none';
        cellInput.style.type = 'number';
        cellInput.style.width = '80px';

        cell.onfocus = () => {
            cellText.style.display = 'none';
            cellInput.style.display = 'inline-block';
            cellInput.placeholder = cellText.innerText;
            cellInput.value = cellText.dataset.value;
            cellInput.select();

            cellInput.focus();
        };

        cellInput.onkeydown = ({ key }) => {
            this.#lastKeyDown = key;
            if (['Escape', 'Enter'].includes(key)) { cellInput.blur(); }
        };

        cellInput.onblur = () => {
            cellInput.style.display = 'none';
            cellText.style.display = 'inline';

            if (this.#lastKeyDown === 'Escape') { return; }
            if (['Tab', 'Enter'].includes(this.#lastKeyDown)) {
                this.#saveValue(resource, +cellInput.value, +cellText.dataset.value);
                cell.dispatchEvent(new CustomEvent('update', { detail: { value: +cellInput.value } }));
            }
        };

        cell.addEventListener('update', ({ detail }) => {
            cellText.setAttribute('data-value', detail.value);
            cellText.innerText = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
                .format(detail.value).replace('US$', '');

            kxpCell.innerText = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 })
                .format(+(detail.value / resource.xp).toFixed(2));

            totalCell.innerText = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                .format(+(detail.value / resource.xp * 179592).toFixed(2)).replace('US$', '₭');
        });

        cell.append(cellText, cellInput);

        return cell;
    }

    /**
     * 
     * @param {string} name 
     * @param {any} value 
     * @returns {HTMLElement}
     */
    #createSimpleCell(name, value) {
        const cell = document.createElement('td');
        cell.classList.add(`${name}-cell`);

        if (value) { cell.innerText = value; }

        return cell;
    }

    /**
     * 
     * @param {Index.Resource} resource 
     * @param {number} value 
     * @param {number} prevValue 
     * @returns 
     */
    async #saveValue(resource, value, prevValue) {
        if (value === prevValue) { return; }
        await this.#resourceModel.createOrUpdate({ ...resource, value });
        Toast.showNotification(resource.name, 'Actualizado correctamente');
    }

};

document.addEventListener('DOMContentLoaded', () => {
    new IndexPage();

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});
