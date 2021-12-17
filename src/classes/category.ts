import { useStore } from "@/store";
import { ILocaleString } from "songtreasures";
import { ICategory } from "songtreasures-api";

export default class Category implements ICategory {
    protected store = useStore();
    public id;
    public name: ILocaleString = {};
    
    public getName(language?: string) {
        language ??= this.store.getters.languageKey;
        return this.name[language] ?? this.name.en ?? this.name[Object.keys(this.name)?.[0]];
    }

    constructor(props: ICategory) {
        this.id = props.id;
        this.name = props.name;
    }
}
