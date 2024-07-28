import { } from '../interfaces/rest/resources.interface.js';

export class DofusApi {

    #source = 'https://api.dofusdu.de/dofus2/es';

    /**
     * 
     * @returns {Promise<Rest.Resources.List>}
     */
    async getResources() {
        const src = `${this.#source}/items/resources/all`;
        const response = await fetch(`${src}`);
        return response.json();
    }

}
