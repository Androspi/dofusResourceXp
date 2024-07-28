import { DBModel } from "./database.model.js";

export class TableModel {

    /** @type {string} */
    tableName = '';

    constructor() {
        this.openConnection();
    }

    async openConnection() {
        await DBModel.openConnection();
    }

    /**
     * 
     * @param {string} type 
     * @returns {IDBTransaction}
     */
    createTransaction = async (type) => {
        const db = await DBModel.getDB();
        return db.transaction([this.tableName], type);
    }

    /**
     * 
     * @param {IDBTransaction} transaction 
     * @returns {IDBObjectStore}
     */
    getTable = (transaction) => {
        return transaction.objectStore(this.tableName);
    }

}
