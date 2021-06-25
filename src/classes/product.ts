import { ApiProduct } from "checkout";
import { BaseClass } from "./baseClass";
import { Collection } from "./collection";

const discountedCountries = [
    "AR",
    "BY",
    "BA",
    "BR",
    "BG",
    "CM",
    "CZ",
    "CL",
    "CN",
    "CD",
    "HR",
    "EG",
    "EE",
    "ET",
    "GR",
    "HU",
    "IN",
    "ID",
    "KE",
    "KW",
    "LV",
    "LT",
    "MK",
    "MW",
    "MX",
    "MD",
    "PY",
    "PE",
    "PL",
    "RO",
    "RU",
    "RS",
    "SK",
    "SI",
    "ZA",
    "ES",
    "LK",
    "TZ",
    "UG",
    "UA",
    "AE",
    "ZW",
];

export class Product extends BaseClass implements ApiProduct {
    public id;
    private _collections?: Collection[];
    public prices;
    public priority;
    public collectionIds;

    constructor(product: ApiProduct, collections: Collection[]) {
        super();
        this._collections = collections?.filter(c => product.collectionIds.includes(c.id));
        this.id = product.id;
        this.name = this._collections[0]?.name ?? {};
        this.prices = product.prices;
        this.priority = product.priority;
        this.collectionIds = product.collectionIds;
    }

    public get collections() {
        return this._collections ?? [];
    }

    public discounted(country: string) {
        return discountedCountries.includes(country);
    }

    public get price() {
        return this.prices.find(p => p.type == "year");
    }

    public get currency() {
        return this.price?.value.split(" ")[0];
    }

    public get originalPrice() {
        const n = this.price?.value.split(" ")[1];
        return (n ? parseInt(n) : 0) / 100;
    }

    public get discountedPrice() {
        return this.originalPrice / 2;
    }

    public priceDiv(country: string) {
        const discount = this.discounted(country);
        return `${this.currency?.toUpperCase()} ${discount ? "<span class=\"line-through text-red-200\">" + this.originalPrice + "</span><span class=\"ml-1\">" + this.discountedPrice + "</span>" : this.originalPrice} / year`;
    }
}
