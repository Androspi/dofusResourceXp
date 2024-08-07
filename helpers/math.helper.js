import { App } from "../services/app.service.js";

export class MathHelper {

    /**
     * 
     * @param {number} xp 
     */
    static paymentByXP(xp) {
        return +(App.paymentLimit / App.maxXP * xp).toFixed(2);
    }

    /**
     * 
     * @param {number} value 
     * @param {number} xp 
     */
    static price(value, xp) {
        return +(value / xp * App.maxXP).toFixed(2);
    }

}
