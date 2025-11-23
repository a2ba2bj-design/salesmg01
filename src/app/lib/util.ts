
export function makeSerializable<T extends any>(o: T): T {
    return JSON.parse(JSON.stringify(o))
}

export type CatProps = {
    catID: number;
    catName: string;
}

export const BASE_URL = "http://localhost:3000/api"

export function separate(number: number | string): string {
    let numStr = number.toString();
    numStr = numStr.replace(',', '');
    const parts = numStr.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    
    const rgx = /(\d+)(\d{3})/;
    while (rgx.test(integerPart)) {
        integerPart = integerPart.replace(rgx, '$1' + ',' + '$2');
    }
    
    return integerPart + decimalPart;
}