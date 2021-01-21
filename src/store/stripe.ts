import stripeService from "@/services/stripe";
import { InjectionKey } from "vue";
import { createStore } from "vuex";

export interface StripeStore {
    products: Product[];
    publicKey: string;
    initialized: boolean;
}

export const stripeKey: InjectionKey<StripeStore> = Symbol();

export const stripeStore = createStore<StripeStore>({
    state: {
        products: [],
        publicKey: '',
        initialized: false
    },
    mutations: {
        setProducts(state, products) {
            state.products = products;
        },
        setKey(state, key: string) {
            state.publicKey = key;
            state.initialized = true;
        }
    },
    actions: {
        async setup({ commit }) {
            const result = await stripeService.setup();
            await stripeService.init(result.key);
            
            commit('setKey', result.key);
            commit('setProducts', result.products);
        },
        async startSession(state, priceId: string) {
            await stripeService.checkout(priceId);
        },
        async getPortal() {
            return await stripeService.portal();
        }
    }
})