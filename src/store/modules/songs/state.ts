import { Collection, CollectionItem, Song } from "@/classes";
import { ApiContributor, IndexedSong } from "dmb-api";

export type State = {
    collectionId?: string;
    language: string;
    transcode: string;
    songs: Song[];
    song?: Song;
    songNumber?: number;
    transposition?: number;
    verses: Verse[];
    lines: string[];
    collections: Collection[];
    initialized: boolean;
    list: string;
    contributorItem?: CollectionItem<ApiContributor>;
    filter: SongFilter;
    audio?: AudioTrack;
    view: "transpose" | "default" | "loading";
    sheetMusic: SheetMusicOptions;
    search?: string;
    searchResult: IndexedSong[];
}

export const state: State = {
    collections: [],
    songs: [],
    verses: [],
    lines: [],
    initialized: false,
    list: "default",
    filter: {
        themes: [],
        videoFiles: [],
        audioFiles: [],
        origins: [],
        contentTypes: [],
        sheetMusicTypes: [],
        hasAudioFiles: false,
        hasLyrics: false,
        hasSheetMusic: false,
        hasVideoFiles: false,
    },
    language: "en",
    view: "default",
    transcode: "common",
    sheetMusic: {
        show: false,
    },
    searchResult: [],
};
