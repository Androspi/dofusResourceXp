import { ResourceModel } from '../../database/resource.model.js';
import { DofusApi } from '../../services/api.service.js';

import { Toast } from '../../utilities/toast.util.js';

class LoadPage {

    /** @type {ResourceModel} */
    #resourceModel;

    /** @type {DofusApi} */
    #service;

    /** @type {Rest.Resources.Item[]} */
    #data = [];

    constructor() {
        this.#init();
    }

    #init() {
        const fileInput = document.querySelector('#formFile');
        fileInput.addEventListener('change', this.#readFile.bind(this));

        this.#getResources(fileInput);

        /** @type {HTMLFormElement} */
        const form = document.querySelector('#resource-form');
        form.onsubmit = this.#saveForm.bind(this);

        this.#resourceModel = new ResourceModel();
    }

    /**
     * 
     * @param {HTMLInputElement} fileInput 
     */
    #getResources(fileInput) {
        this.#service = new DofusApi();
        this.#service.getResources().then(({ items }) => {
            fileInput.removeAttribute('disabled');
            this.#data = items;
        });
    }

    /**
     * 
     * @param {Event} event 
     */
    #readFile(event) {
        const file = event.target.files[0];
        if (!file) { return; }

        const reader = new FileReader();
        reader.onload = e => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            this.#createTable(json.slice(1));
        }

        reader.readAsArrayBuffer(file);
    }

    #createTable(data) {
        const tbody = document.querySelector('#resource-table tbody');

        data.forEach(([name, xp, val]) => {
            if (!xp) { return; }

            const row = document.createElement('tr');

            const xpCell = document.createElement('td');
            xpCell.classList.add('xp-cell');
            xpCell.innerText = +xp.toFixed(2);

            const nameCell = document.createElement('td');
            nameCell.classList.add('name-cell');
            nameCell.innerText = name;

            const valueCell = document.createElement('td');
            valueCell.innerText = val;

            const idCell = document.createElement('td');
            const saveCell = document.createElement('td');
            saveCell.classList.add('check-cell');


            const elm = this.#data.find((item) => item.name.toLowerCase() === name.toLowerCase());
            if (elm) {
                idCell.innerText = elm.ankama_id;

                saveCell.innerHTML = `<div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${elm.ankama_id}|${name}|${+xp.toFixed(3)}|${val}" name="resources" checked>
                </div>`;
            }

            row.append(saveCell, nameCell, xpCell, valueCell, idCell);
            tbody.append(row);
        });
    }

    #saveForm(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const resources = formData.getAll('resources');

        resources.forEach(async (item) => {
            const [id, name, xp, value] = item.split('|');
            await this.#resourceModel.createOrUpdate({ id: +id, name, xp: +xp, value: +value });
            Toast.showNotification(name, 'Actualizado correctamente');
        });
    }

}

document.addEventListener('DOMContentLoaded', () => {
    new LoadPage();
});
