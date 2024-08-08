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
        selected: ['total', 'asc'],
        total: (a, b) => {
            if (!b.xp) { return -1; }
            if (!a.xp) { return 1; }

            const aKxp = a.value / a.xp;
            const bKxp = b.value / b.xp;

            const response = aKxp > bKxp ? 1 : -1;
            return this.#sorting.selected[1] === 'asc' ? response : (response * -1);
        },
        date: (a, b) => {
            const response = a.date > b.date ? 1 : -1;
            return this.#sorting.selected[1] === 'asc' ? response : (response * -1);
        },
        name: (a, b) => {
            const response = a.name > b.name ? 1 : -1;
            return this.#sorting.selected[1] === 'asc' ? response : (response * -1);
        },
        lvl: (a, b) => {
            const response = a.lvl > b.lvl ? 1 : -1;
            return this.#sorting.selected[1] === 'asc' ? response : (response * -1);
        },
        pm: (a, b) => {
            const response = MathHelper.paymentByXP(a.xp) > MathHelper.paymentByXP(b.xp) ? 1 : -1;
            return this.#sorting.selected[1] === 'asc' ? response : (response * -1);
        },
        bought: (a, b) => {
            const response = a.buyDate > b.buyDate ? 1 : -1;
            return this.#sorting.selected[1] === 'asc' ? response : (response * -1);
        },
    }

    constructor() {
        this.#service = new DofusApi();
        this.init();
    }

    init() {
        this.getResources();
        this.setPageLoader();
        this.setSortOptions();
        this.setSearcher();
        this.setDownload();
    }

    getResources() {
        this.#resourceModel = new ResourceModel();

        const apiResourcesPromise = this.#service.getResources();
        const dbResourcesPromise = this.#resourceModel.getAll();

        Promise.all([apiResourcesPromise, dbResourcesPromise]).then(([{ items }, data]) => {
            this.#resources = items.map(({ name, level, type, image_urls, ankama_id }) => {
                const saved = data.find(elm => elm.id === ankama_id);

                return {
                    buyDate: saved?.buyDate ?? null,
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

            this.sortResources();
        });
    }

    sortResources() {
        this.#resources.sort(this.#sorting[this.#sorting.selected[0]].bind(this));
        Table.clearTable();
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
        const record = await this.#resourceModel.createOrUpdate(resource);

        resource = this.#resources.find(({ id }) => id === resource.id);
        resource.buyDate = record.buyDate;
        resource.value = record.value;
        resource.date = record.date;
        resource.xp = record.xp;

        Toast.showNotification(resource.name, 'Actualizado correctamente');
    }

    setSortOptions() {
        const menu = document.querySelector('#sort-menu .dropdown-menu');

        const options = [
            { name: 'Compra', id: 'bought', type: 'string' },
            { name: 'Fecha', id: 'date', type: 'string' },
            { name: 'Nombre', id: 'name', type: 'string' },
            { name: 'Nivel', id: 'lvl', type: 'numeric' },
            { name: 'Precio Máximo', id: 'pm', type: 'numeric' },
            { name: 'Total', id: 'total', type: 'numeric' },
        ];

        options.forEach(({ name, id, type }) => {
            const item = document.createElement('li');

            const textItem = document.createElement('span');
            textItem.innerText = name;

            const ascItem = document.createElement('button');
            ascItem.className = 'btn btn-sm btn-secondary rounded-pill';
            ascItem.setAttribute('type', 'button');

            const descItem = document.createElement('button');
            descItem.className = 'btn btn-sm btn-secondary rounded-pill';
            descItem.setAttribute('type', 'button');

            if (type === 'numeric') {
                ascItem.innerHTML = '<i class="bi bi-sort-numeric-up"></i>';
                descItem.innerHTML = '<i class="bi bi-sort-numeric-down"></i>';
            } else {
                ascItem.innerHTML = '<i class="bi bi-sort-alpha-down"></i>';
                descItem.innerHTML = '<i class="bi bi-sort-alpha-up"></i>';
            }

            [ascItem, descItem].forEach((elm, ix) => elm.onclick = () => {
                this.#sorting.selected = [id, !ix ? 'asc' : 'desc'];
                this.sortResources(1);
            });

            item.append(ascItem, descItem, textItem);
            menu.append(item);
        });
    }

    setSearcher() {
        let resources;
        let timer = 0;

        /** @type {HTMLInputElement} */
        const input = document.querySelector('#resource-search');

        input.oninput = ({ target: { value } }) => {
            if (!resources) { resources = this.#resources; }

            clearTimeout(timer);

            timer = window.setTimeout(() => {
                this.#resources = resources.filter(({ name }) => {
                    const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const normalizedValue = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    return normalizedName.includes(normalizedValue);
                });
                this.sortResources();
            }, 300);
        }

        document.addEventListener('keydown', event => {
            if ((!event.ctrlKey && !event.metaKey) || event.key !== 'f') { return; }
            event.preventDefault();
            input.focus();
        });
    }

    setDownload() {
        const btn = document.querySelector('#download-btn');

        btn.onclick = () => {
            const keys = ['buyDate', 'value', 'date', 'xp', 'type', 'lvl', 'name'];

            const csvRows = [];
            csvRows.push('"Fecha de compra","Valor","Fecha de actualización","XP","Tipo","Lvl","Nombre"');

            for (const record of this.#resources) {
                const values = keys.map(key => {
                    if (['buyDate', 'date'].includes(key)) {
                        return record[key] ? `"${new Date(record[key]).toLocaleString()}"` : '""';
                    }

                    return record[key] ? `"${record[key]}"` : '""';
                });

                csvRows.push(values.join(','));
            }

            const bom = '\uFEFF';
            const csvData = csvRows.join('\r\n');
            const blob = new Blob([bom + csvData], { type: 'text/csv;charset=utf-8;' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download =  `${new Date().toLocaleDateString()}_resources.csv`;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);
        };
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
        const xpCell = this.#createXPCell(resource);
        const valueCell = this.#createValueCell(resource);
        const pmCell = this.#createPMCell(resource);
        const totalCell = this.#createTotalCell(resource);

        row.append(dateCell, nameCell, xpCell, valueCell, pmCell, totalCell);

        nameCell.addEventListener('click', () => {
            document.querySelectorAll('tr.table-secondary').forEach(elm => elm.classList.remove('table-secondary'));
            row.classList.add('table-secondary');
        });

        [valueCell, xpCell].forEach(cell => cell.addEventListener('update', ({ detail }) => {
            const updatedRow = this.createRow(detail);
            updatedRow.className = row.className;

            row.dispatchEvent(new CustomEvent('update', { detail: { data: detail, row: updatedRow } }));
            Table.body.replaceChild(updatedRow, row);
        }));

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
            .format(resource.value ?? 0).replace('US$', '');

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
     * @param {Index.Resource} resource 
     * @returns {HTMLElement}
     */
    static #createXPCell(resource) {
        const cell = document.createElement('td');
        cell.classList.add('xp-cell');

        const cellText = document.createElement('span');
        cellText.innerText = resource.xp ? new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(+resource.xp) : '';

        const cellInput = document.createElement('input');
        cellInput.classList.add('form-control', 'form-control-sm');
        cellInput.style.display = 'none';
        cellInput.style.type = 'number';
        cellInput.style.width = '80px';

        cell.onclick = () => {
            cellText.style.display = 'none';
            cellInput.style.display = 'inline-block';
            cellInput.placeholder = cellText.innerText;
            cellInput.value = +resource.xp;
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
                if (+cellInput.value === +resource.xp) { return; }

                cell.dispatchEvent(new CustomEvent('update', {
                    detail: { ...resource, xp: +cellInput.value }
                }));
            }
        };

        cell.append(cellText, cellInput);

        return cell;
    }

    /**
     * 
     * @param {Index.Resource} resource 
     * @returns {HTMLElement}
     */
    static #createPMCell({ xp }) {
        const cell = document.createElement('td');
        cell.classList.add('pm-cell');

        if (xp) {
            cell.innerText = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(MathHelper.paymentByXP(xp));
        }

        return cell;
    }

    /**
     * 
     * @param {Index.Resource} resource 
     * @returns {HTMLElement}
     */
    static #createTotalCell({ xp, value }) {
        const cell = document.createElement('td');
        cell.classList.add('total-cell');

        if (!xp && !value) { return cell; }

        const total = MathHelper.price(value, xp);
        const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
            .format(total).replace('US$', '₭');
        const quantity = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0 }).format(Math.ceil(App.maxXP / xp));

        cell.innerText = `${formattedTotal} (${quantity})`;

        const limit = App.paymentLimit;
        const limit2 = +((+`${limit}`[0] + 1) + '0'.repeat(`${limit}`.length - 1));

        if (total <= limit) {
            cell.classList.add('table-success');
        } else if (total <= limit2) {
            cell.classList.add('table-warning');
        }

        return cell;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    new IndexPage();
    Tooltip.initialize();
});

document.addEventListener('keydown', event => lastKeyDown = event.key);
document.addEventListener('click', () => lastKeyDown = undefined);
