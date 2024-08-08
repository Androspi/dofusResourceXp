import { ResourceHistoryModel } from './resource-history.model.js';
import { TableModel } from './table-model.js';

import { MathHelper } from '../helpers/math.helper.js';

import { } from "../interfaces/resources.interface.js";

export class ResourceModel extends TableModel {

    tableName = 'resources';

    constructor() {
        super();
    }

    /**
     * 
     * @param {Partial<Resources.Item>} param0 
     * @returns {Promise<Resources.Item>}
     */
    createOrUpdate = ({ id, name, value, xp, date }) => new Promise(async (resolve) => {
        const record = await this.get(id);

        const transaction = await this.createTransaction('readwrite');
        const table = this.getTable(transaction);

        transaction.oncomplete = () => {
            resolve({ id, name, xp, value, date: newDate, buyDate });
            new ResourceHistoryModel().createOrUpdate({ id, date: new Date(newDate).toLocaleDateString(), value });
        };

        const newDate = date ?? Date.now();
        const buyDate = value <= MathHelper.paymentByXP(xp) ? Date.now() : record?.buyDate ?? null;

        table.put({ id, name, xp, value, date: newDate, buyDate });
    });

    /**
     * 
     * @param {string} key 
     * @returns {Promise<Resources.Item>}
     */
    get = (key) => new Promise(async (resolve) => {
        /** @type {IDBTransaction } */
        const transaction = await this.createTransaction('readonly');
        const table = this.getTable(transaction);

        const request = table.get(key);
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
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
            resolve(event.target.result);
        };
    });

}
