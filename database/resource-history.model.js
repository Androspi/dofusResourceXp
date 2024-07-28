import { TableModel } from './table-model.js';

export class ResourceHistoryModel extends TableModel {

    tableName = 'resources-history';

    constructor() {
        super();
    }

    /**
     * 
     * @param {Object} param0 
     * @returns {Promise}
     */
    createOrUpdate = ({ id, date, value }) => new Promise(async (resolve) => {
        const transaction = await this.createTransaction('readwrite');
        const table = this.getTable(transaction);

        transaction.oncomplete = () => { resolve(); };
        table.put({ id, date, value });
    });

}
