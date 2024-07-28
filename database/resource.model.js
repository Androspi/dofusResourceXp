import { ResourceHistoryModel } from './resource-history.model.js';
import { TableModel } from './table-model.js';

import { } from "../interfaces/resources.interface.js";

export class ResourceModel extends TableModel {

    tableName = 'resources';

    constructor() {
        super();
    }

    /**
     * 
     * @param {Partial<Resources.Item>} param0 
     * @returns {Promise}
     */
    createOrUpdate = ({ id, name, value, xp }) => new Promise(async (resolve) => {
        const transaction = await this.createTransaction('readwrite');
        const table = this.getTable(transaction);

        transaction.oncomplete = () => {
            resolve();

            new ResourceHistoryModel().createOrUpdate({ id, date: new Date().toLocaleDateString(), value });
        };

        table.put({ id, name, xp, value, date: Date.now(), buyDate: (value / xp) <= 20 ? Date.now() : null });
    });

    /**
     * 
     * @returns {Promise<Resources.Item[]>}
     */
    getAll = () => new Promise(async (resolve) => {
        /** @type {IDBTransaction } */
        const transaction = await this.createTransaction('readonly');
        const table = this.getTable(transaction);

        const request = table.getAll();
        request.onsuccess = (event) => {
            const { result } = event.target;
            resolve(result);
        };
    });

}
