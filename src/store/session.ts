/* eslint-disable no-console */
import api from '@/services/api'
import { InjectionKey } from 'vue'
import { Commit, createStore, Store } from 'vuex'
import auth from '@/services/auth'
import router from '@/router';
import { ensureLanguageIsFetched } from '@/i18n';

async function init(commit: Commit) {
    const user = await api.session.getCurrentUser();
    commit('currentUser', user);
    try {
        const languages = await api.items.getLanguages();
        commit('languages', languages);
        const collections = await api.songs.getCollections();
        commit('collections', collections);
    } catch (e) {
        console.log(e);
    }
    if (router.currentRoute.value.name == "login") {
        router.replace({name: 'main'});
    }
    commit('initialized', true);
}

export interface Session {
    currentUser: User;
    isAuthenticated: boolean;
    languages: Language[];
    initialized: boolean;
    collections: Collection[];
    authInitialized: boolean;
    loggedIn: boolean;
    extend: boolean;
}

export const sessionKey: InjectionKey<Store<Session>> = Symbol()

export const sessionStore = createStore<Session>({
    state: {
        currentUser: {} as User,
        isAuthenticated: false,
        languages: [],
        initialized: false,
        collections: [],
        authInitialized: false,
        loggedIn: false,
        extend: false,
    },
    actions: {
        async socialLogin({commit}, provider: string) {
            await auth.login(provider);
            if (auth.isAuthenticated) {
                await init(commit);
            }
        },
        async createUser({commit}, object: { 
            email: string; 
            password: string; 
            displayName: string;
        }) {
            await auth.createUser(object.email, object.password);

            if (auth.isAuthenticated) {
                await init(commit);
            }
        },
        async initialize({commit}) {
            await auth.init();
            if (auth.isAuthenticated) {
                await init(commit);
            }
        },
        async loginWithEmailPassword({ commit }, obj: {
            email: string;
            password: string;
            stayLoggedIn: boolean;
        }) {
            await auth.loginEmail(obj.email, obj.password, obj.stayLoggedIn);
            if (auth.isAuthenticated) {
                await init(commit);
            }
        },
        async saveSettings({ state, commit }) {
            if (state.currentUser.settings) {
                const user = await api.session.saveUser(state.currentUser.settings)
                commit('currentUser', user);
                await ensureLanguageIsFetched();
            }
        }
    },
    mutations: {
        currentUser(state, user: User) {
            state.currentUser = user;
            if (user.settings) localStorage.setItem('languageKey', user.settings.languageKey);
        },
        authInitialized(state, value: boolean) {
            state.authInitialized = true;

            state.loggedIn = value;
            if (value == false) {
                router.push({name: 'login'});
            }
        },
        logout(state) {
            state.isAuthenticated = false;
            state.currentUser = {} as User;
        },
        settings(state, settings: UserSettings) {
            state.currentUser.settings = settings;
        },
        languages(state, languages: Language[]) {
            state.languages = languages;
        },
        initialized(state, initialized: boolean) {
            state.initialized = initialized;
        },
        collections(state, collections: Collection[]) {
            state.collections = collections;
        },
        extend(state, value?: boolean) {
            state.extend = value != undefined ? value : !state.extend;
        }
    },
    getters: {
        currentUser(state) {
            return state.currentUser;
        },
        isAdmin(state) {
            return state.currentUser?.roles?.find(r => r.name == "administrator")?.id !== undefined;
        },
        languageKey(state) {
            return state.currentUser.settings?.languageKey ?? localStorage.getItem('languageKey') ?? 'en';
        },
        languages(state) {
            return state.languages;
        },
        initialized(state) {
            return state.initialized;
        },
        collections(state) {
            const collections: Collection[] = [];
            for (const sub of state.currentUser.subscriptions) {
                for (const id of sub.collectionIds) {
                    if (!collections.find(c => c.id == id)) {
                        const collection = state.collections.find(c => c.id == id);
                        if (collection) collections.push(collection);
                    }
                }
            }
            return collections;
        },
        extended(state) {
            return state.currentUser.roles.find(r => ["extended", "administrator"].includes(r.name)) !== undefined;
        }
    }
})