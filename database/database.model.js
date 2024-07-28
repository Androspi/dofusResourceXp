export class DBModel {

    /** @type {IDBOpenDBRequest} */
    static #db;
    static #isOpeningConnection = false;

    /**
     * 
     * @returns {Promise<IDBOpenDBRequest>}
     */
    static openConnection = () => new Promise(resolve => {
        DBModel.#isOpeningConnection = true;

        const request = indexedDB.open('dofus');

        request.onsuccess = event => {
            DBModel.#db = event.target.result;
            DBModel.#isOpeningConnection = false;
            resolve(DBModel.#db);
        };

        request.onupgradeneeded = DBModel.#createTables;
    });

    /**
     * 
     * @returns {Promise<IDBOpenDBRequest>}
     */

    static getDB = () => {
        if (DBModel.#db) { return Promise.resolve(DBModel.#db); }
        if (!DBModel.#isOpeningConnection) { return Promise.reject('There is no a open connection request'); }

        return new Promise(resolve => {
            setTimeout(async () => resolve(await DBModel.getDB()), 0);
        });
    }

    /**
     * 
     * @param {IDBVersionChangeEvent} event 
     */
    static #createTables(event) {
        const db = event.target.result;
        db.createObjectStore('resources', { keyPath: 'id' });
        db.createObjectStore('resources-history', { keyPath: ['id', 'date'] });
    }

}
