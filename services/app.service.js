export class App {

    static get maxXP() {
        return +(localStorage.getItem('maxXP') ?? 179_592);
    }

    static get paymentLimit() {
        return +(localStorage.getItem('paymentLimit') ?? 3_591_840);
    }

}
