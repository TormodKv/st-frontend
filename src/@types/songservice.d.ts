interface SongInterface {
    number: number;
    type: string;
    name: {
        [languageKey: string]: string;
    };
    authors: Contributor[];
    composers: Contributor[];
    melodyOrigin: Origin;
    leadSheetUrl: string;
    yearWritten: number;
    originCountry: Country;
    soundFiles: MediaFile[];
    videoFiles: MediaFile[];
    details: {
        [languageKey: string]: string;
    };
}

interface ContributorCollectionItem {
    contributor: Contributor;
    songs: SongInterface[];
}

interface MediaFile {
    id: string;
    type: string;
    number: number;
    language: Language;
    name: string;
    directUrl: string;
}

interface Contributor {
    internalId: string;
    name: string;
    birthYear: number;
    country: string;
    biography: {
        [languageKey: string]: string;
    };
}

interface Collection {
    id: string;
    name: {
        [lang: string]: string;
    };
    key: string;
    image: string;
}

// LYRICS
interface LyricsInterface {
    number: number;
    title: string;
    collectionKey: string;
    language: Language;
    content: {
        [key: string]: {
            name: string;
            content: string[];
        };
    };
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

interface Product {
    id: string;
    name: {
        [languageKey: string]: string;
    };
    collections: Collection[];
    image: string;
    priceId: string;
}