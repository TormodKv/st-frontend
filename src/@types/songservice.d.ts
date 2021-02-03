interface SongInterface {
    id: string;
    number: number;
    type: string;
    name: {
        [languageKey: string]: string;
    };
    authors: ContributorInterface[];
    composers: ContributorInterface[];
    melodyOrigin: Origin;
    leadSheetUrl: string;
    yearWritten: number;
    themes: Theme[];
    originCountry: Country;
    audioFiles: MediaFile[];
    videoFiles: MediaFile[];
    details: {
        [languageKey: string]: string;
    };
}

interface ContributorCollectionItem {
    contributor: ContributorInterface;
    songs: SongInterface[];
    songIds: string[];
}

interface Theme {
    id: string;
    name: LocaleString;
}

interface MediaFile {
    id: string;
    type: string;
    number: number;
    language: Language;
    name: string;
    directUrl: string;
    contributors: ContributorInterface[];
}

interface ContributorInterface {
    id: string;
    name: string;
    birthYear: number;
    country: string;
    biography: {
        [languageKey: string]: string;
    };
}

interface CollectionInterface {
    id: string;
    name: {
        [lang: string]: string;
    };
    key: string;
    image: string;
}

interface JsonContent {
    [key: string]: {
        name: string;
        content: string[];
    };
}

// LYRICS
interface LyricsInterface {
    number: number;
    title: string;
    collectionKey: string;
    language: Language;
    content: JsonContent | string;
    format: string;
    hasChords: boolean;
    originalKey: string;
    transposedToKey?: string;
}

interface Verse {
    type: string;
    name: string;
    content: string[];
}

interface Price {
    id: string;
    value: string;
    name: string;
    type: string;
}

interface Product {
    id: string;
    name: {
        [languageKey: string]: string;
    };
    collections: Collection[];
    prices: Price[];
}

interface ThemeCollectionItem {
    theme: Theme;
    songs: SongInterface[];
}
