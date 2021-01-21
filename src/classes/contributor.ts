import { Converter } from 'showdown';
const converter = new Converter();

export default class ContributorItem implements Contributor{
    public biography: {
        [key: string]: string;
    } = {};
    public birthYear = 0;
    public country = '';
    public id = '';
    public name = '';

    constructor(contributor: Contributor) {
        this.biography = contributor.biography;
        this.birthYear = contributor.birthYear;
        this.country = contributor.country;
        this.id = contributor.id;
        this.name = contributor.name;
    }

    public getBiography(language: string) {
        
        const content = this.biography[language] ?? this.biography.no ?? undefined;

        if (content) {
            return converter.makeHtml(content);
        } else {
            return undefined;
        }
    }
}