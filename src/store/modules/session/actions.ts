import router from "@/router";
import api from "@/services/api";
import auth from "@/services/auth";
import { ensureLanguageIsFetched } from "@/i18n";
import { RootState } from "../..";
import { ApiActivity, ApiContributor, ApiSong, ApiTag } from "dmb-api";
import { ActionContext, ActionTree, Commit, Dispatch } from "vuex";
import { SessionActionTypes } from "./action-types";
import { SessionMutationTypes } from "./mutation-types";
import { Mutations } from "./mutations";
import { State } from "./state";
import { SongsMutationTypes } from "../songs/mutation-types";
import { SongsActionTypes } from "../songs/action-types";



const ts: {
    [key: string]: number;
} = {
    "C": 0,
    "Db": -1,
    "D": 10,
    "Eb": -3,
    "E": 8,
    "F": 7,
    "F#": 6,
    "G": 5,
    "Ab": -8,
    "A": 3,
    "Bb": -10,
    "B": 1,
};

async function init(state: State, commit: Commit, dispatch: Dispatch): Promise<void> {
    const user = await api.session.getCurrentUser();
    if (user) {
        user.displayName = auth.user?.displayName ?? user.displayName;
    }
    
    api.playlists.getPlaylists().then(p => {
        commit(SessionMutationTypes.SET_PLAYLISTS, p);
    });

    api.tags.getAll().then(t => {
        commit(SessionMutationTypes.SET_TAGS, t);
    });

    const items = JSON.parse(localStorage.getItem("activities") ?? "[]") as ApiActivity[];

    if (items.length) {
        await api.activity.pushActivities(items);
        localStorage.setItem("activities", "[]");
    }

    api.activity.getActivities().then(a => {
        commit(SessionMutationTypes.SET_LOG_ITEMS, a);
    });

    commit(SessionMutationTypes.SET_USER, user);
    try {
        const languages = await api.items.getLanguages();
        commit(SessionMutationTypes.SET_LANGUAGES, languages);
        const collections = await api.songs.getCollections();
        commit(SessionMutationTypes.COLLECTIONS, collections);

        
    } catch (e) {
        //console.log(e);
    }
    if (router.currentRoute.value.name == "login") {
        router.push(state.redirect ?? "/");
    }
    await ensureLanguageIsFetched();

    await dispatch(SongsActionTypes.INIT);

    commit(SessionMutationTypes.INITIALIZED);
    // commit(SongsMutationTypes.SET_SHEETMUSIC_TRANSPOSITION, smTs[user.settings?.defaultTransposition ?? "C"]);
    commit(SongsMutationTypes.SET_TRANSPOSITION, ts[user.settings?.defaultTransposition ?? "C"]);
}

type AugmentedActionContext = {
    commit<K extends keyof Mutations>(
        key: K,
        payload: Parameters<Mutations[K]>[1],
    ): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, RootState>, "commit">;

export interface Actions {
    /**
     * Initialize session.
     * @param param0 
     */
    [SessionActionTypes.SESSION_START]({ state, commit }: AugmentedActionContext): Promise<void>;
    [SessionActionTypes.SESSION_CLEAR]({ commit }: AugmentedActionContext): Promise<void>;
    [SessionActionTypes.SESSION_LOGIN_SOCIAL]({ state, commit }: AugmentedActionContext, payload: string): Promise<void>;
    [SessionActionTypes.SESSION_LOGIN_EMAIL_PASSWORD]({ state, commit }: AugmentedActionContext, payload: {
        email: string;
        password: string;
        stayLoggedIn: boolean;
    }): Promise<void>;
    [SessionActionTypes.SESSION_CREATE_USER]({ state, commit }: AugmentedActionContext, payload: { 
        email: string; 
        password: string; 
        displayName: string;
    }): Promise<void>;
    [SessionActionTypes.SESSION_SAVE_SETTINGS]({ commit }: AugmentedActionContext): Promise<void>;

    [SessionActionTypes.SET_DISPLAY_NAME]({ state, commit }: AugmentedActionContext, payload: string): Promise<void>;
    
    [SessionActionTypes.PLAYLIST_CREATE]({ commit }: AugmentedActionContext, payload: { name: string }): Promise<void>;
    [SessionActionTypes.PLAYLIST_DELETE]({ commit }: AugmentedActionContext, payload: string): Promise<void>;
    // [SessionActionTypes.PLAYLIST_ADD_FILE]({ commit }: AugmentedActionContext, payload: {
    //     playlistId: string;
    //     fileId: string;
    // }): Promise<void>;
    [SessionActionTypes.PLAYLIST_ADD_SONG]({ commit }: AugmentedActionContext, payload: {
        playlistId: string;
        songId: string;
        transposition?: number;
    }): Promise<void>;
    [SessionActionTypes.PLAYLIST_REMOVE_ENTRY]({ commit }: AugmentedActionContext, payload: {
        playlistId: string;
        entryId: string;
    }): Promise<void>;

    [SessionActionTypes.LOG_SONG_ITEM]({ commit }: AugmentedActionContext, payload: ApiSong): Promise<void>;
    [SessionActionTypes.LOG_CONTRIBUTOR_ITEM]({ commit }: AugmentedActionContext, payload: ApiContributor): Promise<void>;

    [SessionActionTypes.TAGS_CREATE]({ commit }: AugmentedActionContext, payload: {
        name: string;
        color: string;
        songId: string;
    }): Promise<ApiTag>;
    [SessionActionTypes.TAGS_DELETE]({ commit }: AugmentedActionContext, payload: string): Promise<void>;
    [SessionActionTypes.TAGS_ADD_SONG]({ commit }: AugmentedActionContext, payload: {
        tagId: string;
        songId: string;
    }): Promise<void>;
    [SessionActionTypes.TAGS_REMOVE_SONG]({ commit }: AugmentedActionContext, payload: {
        tagId: string;
        songId: string;
    }): Promise<void>;
}

export const actions: ActionTree<State, RootState> & Actions = {
    async [SessionActionTypes.SESSION_START]({state, commit, dispatch}): Promise<void> {
        if (auth.isAuthenticated) {
            if (!state.initialized) {
                await init(state, commit, dispatch);
            }
        }
    },
    async [SessionActionTypes.SESSION_CLEAR]({ commit }): Promise<void> {
        await auth.logout();
        commit(SessionMutationTypes.CLEAR_SESSION, undefined);
    },
    async [SessionActionTypes.SESSION_LOGIN_SOCIAL]({ state, commit, dispatch }, provider): Promise<void> {
        await auth.login(provider);

        if (auth.isAuthenticated) {
            await init(state, commit, dispatch);
        } else {
            await auth.sendLinkToEmail();
        }
    },
    async [SessionActionTypes.SESSION_LOGIN_EMAIL_PASSWORD]({ state, commit, dispatch }, obj): Promise<void> {
        await auth.loginWithEmailAndPassword(obj.email, obj.password, obj.stayLoggedIn);

        if (auth.isAuthenticated) {
            await init(state, commit, dispatch);
        } else {
            await auth.sendLinkToEmail();
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async [SessionActionTypes.SESSION_CREATE_USER]({ state, commit }, object ): Promise<void> {
        await auth.createEmailAndPasswordUser(object.email, object.password, object.displayName);

        // if (auth.isAuthenticated) {
        //     await init(state, commit);
        // }
    },
    async [SessionActionTypes.SESSION_SAVE_SETTINGS]({ state, commit }): Promise<void> {
        if (state.currentUser?.settings) {
            const user = await api.session.saveUser(state.currentUser.settings);
            commit(SessionMutationTypes.SET_USER, user);
            await ensureLanguageIsFetched();
        }
    },

    async [SessionActionTypes.SET_DISPLAY_NAME]({ state, commit }, name: string): Promise<void> {
        await auth.setDisplayName(name);
        
        commit(SessionMutationTypes.SET_USER, Object.assign({
            displayName: name,
        }, state.currentUser));
    },

    // PLAYLIST RELATED ACTIONS
    async [SessionActionTypes.PLAYLIST_CREATE]({ commit }, obj: { name: string }): Promise<void> {
        const res = await api.playlists.createPlaylist(obj.name);

        commit(SessionMutationTypes.SET_PLAYLIST, res);
    },
    async [SessionActionTypes.PLAYLIST_DELETE]({ commit }, id): Promise<void> {
        await api.playlists.deletePlaylist(id);
        commit(SessionMutationTypes.DELETE_PLAYLIST, id);
    },
    async [SessionActionTypes.PLAYLIST_ADD_SONG]({ commit }, obj): Promise<void> {
        const res = await api.playlists.addToPlaylist(obj.playlistId, obj.songId, obj.transposition);

        if (res) {
            commit(SessionMutationTypes.UPDATE_PLAYLIST, res);
        }
    },
    async [SessionActionTypes.PLAYLIST_REMOVE_ENTRY]({ commit }, obj): Promise<void> {
        const res = await api.playlists.removeEntryFromPlaylist(obj.playlistId, obj.entryId);

        if (res) {
            commit(SessionMutationTypes.UPDATE_PLAYLIST, res);
        }
    },

    // LOG ITEMS
    async [SessionActionTypes.LOG_SONG_ITEM]({ commit, state }, item: ApiSong): Promise<void> {
        const items = state.activities ?? JSON.parse(localStorage.getItem("activities") ?? "[]") as ApiActivity[];

        if (items?.find(a => a.itemId == item.id && new Date(a.loggedDate).getTime() > (new Date().getTime() - 60000))) {
            return;
        }

        const i: ApiActivity = {
            loggedDate: new Date().toISOString(),
            type: "song",
            itemId: item.id,
            item: item,
        };

        items.push(i);

        if (items.length >= 10) {
            await api.activity.pushActivities(items);
            localStorage.setItem("activities", "[]");
        } else {
            localStorage.setItem("activities", JSON.stringify(items));
        }

        commit(SessionMutationTypes.SET_LOG_ITEMS, [i]);
    },
    async [SessionActionTypes.LOG_CONTRIBUTOR_ITEM]({ commit, state }, item: ApiContributor): Promise<void> {
        const items = JSON.parse(localStorage.getItem("activities") ?? "[]") as ApiActivity[];

        if (state.activities?.find(a => a.itemId == item.id && new Date(a.loggedDate).getTime() > (new Date().getTime() - 60000))) {
            return;
        }

        const i: ApiActivity = {
            loggedDate: new Date().toISOString(),
            type: "contributor",
            itemId: item.id,
            item: item,
        };

        items.push(i);

        if (items.length >= 10) {
            await api.activity.pushActivities(items);
            localStorage.setItem("activities", "[]");
        } else {
            localStorage.setItem("activities", JSON.stringify(items));
        }

        commit(SessionMutationTypes.SET_LOG_ITEMS, [i]);
    },

    async [SessionActionTypes.TAGS_CREATE]({ commit }, options) {
        const tag = await api.tags.create(options.name, options.color, options.songId);

        commit(SessionMutationTypes.SET_TAG, tag);

        return tag;
    },
    async [SessionActionTypes.TAGS_DELETE]({ commit }, id) {
        await api.tags.delete(id);

        commit(SessionMutationTypes.DELETE_TAG, id);
    },
    async [SessionActionTypes.TAGS_ADD_SONG]({ commit }, options) {
        const tag = await api.tags.addToTag(options.tagId, options.songId);

        commit(SessionMutationTypes.SET_TAG, tag);
    },
    async [SessionActionTypes.TAGS_REMOVE_SONG]({ commit }, options) {
        const tag = await api.tags.removeFromTag(options.tagId, options.songId);

        commit(SessionMutationTypes.SET_TAG, tag);
    },
};
