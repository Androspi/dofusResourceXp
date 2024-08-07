import { ResourceModel } from './database/resource.model.js';
import { DofusApi } from './services/api.service.js';

import { MathHelper } from './helpers/math.helper.js';
import { Tooltip } from './utilities/tooltip.util.js';
import { Toast } from './utilities/toast.util.js';
import { App } from './services/app.service.js';

import { } from "./interfaces/index.interface.js";

/** @type {string} */
let lastKeyDown

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

    #sorting = {
        selected: ['totalPrice', 'asc'],
        totalPrice: (a, b) => {
            if (!b.xp) { return -1; }
            if (!a.xp) { return 1; }

            const aKxp = a.value / a.xp;
            const bKxp = b.value / b.xp;

            const response = aKxp > bKxp ? 1 : -1;
            return this.#sorting.selected[1] === 'asc' ? response : (response * -1);
        }
    }

    constructor() {
        this.#service = new DofusApi();
        this.init();
    }

    init() {
        this.getResources();
        this.setPageLoader();
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
            });

            Table.clearTable();
            this.sortResources();
        });
    }

    sortResources() {
        this.#resources.sort(this.#sorting[this.#sorting.selected[0]].bind(this));
        this.loadResources(1);
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

        const tbody = Table.body;

        this.#resources.slice(start, end).forEach(resource => {
            let row = Table.createRow(resource);
            tbody.append(row);
            this.onRowUpdate(row);
        });
    }

    /**
     * 
     * @param {HTMLTableRowElement} row 
     */
    onRowUpdate(row) {
        row.addEventListener('update', ({ detail: { row, data } }) => {
            this.onRowUpdate(row);
            this.#saveValue(data);
        });
    }


    /**
     * 
     * @param {Index.Resource} resource 
     * @param {number} value 
     * @param {number} prevValue 
     * @returns 
     */
    async #saveValue(resource) {
        await this.#resourceModel.createOrUpdate(resource);
        Toast.showNotification(resource.name, 'Actualizado correctamente');
    }

};

class Table {

    /** @type {HTMLElement} */
    static get body() {
        return document.querySelector('#resource-table tbody');
    }

    static clearTable() {
        this.body.replaceChildren();
    }

    /**
     * 
     * @param {Index.Resource} resource 
     */
    static createRow(resource) {
        const row = document.createElement('tr');

        const dateCell = this.#createDateCell(resource);
        const nameCell = this.#createNameCell(resource);
        const valueCell = this.#createValueCell(resource);

        const xpCell = this.#createSimpleCell('xp');
        const pmCell = this.#createSimpleCell('pm');
        const totalCell = this.#createSimpleCell('total');

        const { value, xp } = resource;

        if (xp) {
            xpCell.innerHTML = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(xp);

            pmCell.innerText = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 })
                .format(MathHelper.paymentByXP(xp));
        }

        if (xp && value) {
            const total = MathHelper.price(value, xp);
            const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
                .format(total).replace('US$', '₭');
            const quantity = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 })
                .format(Math.ceil(App.maxXP / xp));

            totalCell.innerText = `${formattedTotal} (${quantity})`;

            const limit = App.paymentLimit;
            const limit2 = +((+`${limit}`[0] + 1) + '0'.repeat(`${limit}`.length - 1));

            if (total <= limit) {
                totalCell.classList.add('table-success');
            } else if (total <= limit2) {
                totalCell.classList.add('table-warning');
            }
        }

        row.append(dateCell, nameCell, xpCell, valueCell, pmCell, totalCell);

        nameCell.addEventListener('click', () => {
            document.querySelectorAll('tr.table-secondary').forEach(elm => elm.classList.remove('table-secondary'));
            row.classList.add('table-secondary');
        });

        valueCell.addEventListener('update', ({ detail }) => {
            const updatedRow = this.createRow(detail);
            updatedRow.className = row.className;

            row.dispatchEvent(new CustomEvent('update', { detail: { data: detail, row: updatedRow } }));
            Table.body.replaceChild(updatedRow, row);
        });

        return row;
    }

    /**
     * 
     * @param {Index.Resource} param0 
     * @returns {HTMLElement}
     */
    static #createDateCell({ date }) {
        const cell = document.createElement('td');
        cell.classList.add('date-cell');
        cell.innerText = date ? (new Date(date)).toLocaleString() : '';

        if (date && new Date(date).toLocaleDateString() === new Date().toLocaleDateString()) {
            cell.classList.add('table-info');
        }

        return cell;
    }

    /**
     * 
     * @param {Index.Resource} param0 
     * @returns {HTMLElement}
     */
    static #createNameCell({ name, icon, lvl }) {
        const cell = document.createElement('td');
        cell.classList.add('name-cell');

        const iconElm = document.createElement('img');
        iconElm.setAttribute('loading', 'lazy');
        iconElm.setAttribute('height', '30');
        iconElm.src = icon;

        const cellText = document.createElement('span');
        cellText.innerText = name;

        const lvlText = document.createElement('span');
        lvlText.className = 'badge rounded-pill text-bg-dark';
        lvlText.innerText = lvl;

        const container = document.createElement('div');
        container.append(iconElm, cellText, lvlText);
        cell.append(container);

        cell.onclick = () => {
            navigator.clipboard.writeText(name).catch(err => {
                console.error(err);
                Toast.showNotification(name, 'Failed to copy text');
            });
        };

        return cell;
    }

    /**
     * 
     * @param {Index.Resource} resource 
     * @returns {HTMLElement}
     */
    static #createValueCell(resource) {
        const cell = document.createElement('td');
        cell.tabIndex = 0;
        cell.classList.add('value-cell');

        const cellText = document.createElement('span');
        cellText.innerText = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
            .format(resource.value).replace('US$', '');

        const cellInput = document.createElement('input');
        cellInput.classList.add('form-control', 'form-control-sm');
        cellInput.style.display = 'none';
        cellInput.style.type = 'number';
        cellInput.style.width = '80px';

        cell.onfocus = () => {
            cellText.style.display = 'none';
            cellInput.style.display = 'inline-block';
            cellInput.placeholder = cellText.innerText;
            cellInput.value = +resource.value;
            cellInput.select();

            cellInput.focus();
        };

        cellInput.onkeydown = ({ key }) => {
            lastKeyDown = key;
            if (['Escape', 'Enter'].includes(key)) { cellInput.blur(); }
        };

        cellInput.onblur = () => {
            cellInput.style.display = 'none';
            cellText.style.display = 'inline';

            if (lastKeyDown === 'Escape') { return; }
            if (['Tab', 'Enter'].includes(lastKeyDown)) {
                if (+cellInput.value === +resource.value) { return; }

                cell.dispatchEvent(new CustomEvent('update', {
                    detail: { ...resource, value: +cellInput.value, date: Date.now() }
                }));
            }
        };

        cell.append(cellText, cellInput);

        return cell;
    }

    /**
     * 
     * @param {string} name 
     * @param {any} value 
     * @returns {HTMLElement}
     */
    static #createSimpleCell(name, value) {
        const cell = document.createElement('td');
        cell.classList.add(`${name}-cell`);

        if (value) { cell.innerText = value; }

        return cell;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    new IndexPage();
    Tooltip.initialize();
});

document.addEventListener('keydown', event => lastKeyDown = event.key);
document.addEventListener('click', () => lastKeyDown = undefined);
