'use strict';

import create from "zustand";
import {
    devtools,
} from 'zustand/middleware';

import ZustandStateManager from "./ZustandStateManager/ZustandStateManager";
import {immer} from "zustand/middleware/immer";
import {IZustandStateManager} from "./ZustandStateManager/types/ZustandStateManager";
import StateLocalStorage from "../utils/LocalStorage/LocalStorage";

/** Код взял [здесь]{@link https://docs.pmnd.rs/zustand/guides/typescript#middleware-that-doesn't-change-the-store-type} */
const customMiddleware: IZustandStateManager.CustomMiddleware = (f, name) => (set, get, store) => {

    // Вклинились в set() и встроили свой код
    const proxySet: typeof set = (...a) => {
        set(...a);

        const zustandStateManager = get() as ZustandStateManager;

        StateLocalStorage.setStateString(
            JSON.stringify(zustandStateManager.state.toDTO())
        );
    }

    store.setState = proxySet;

    return f(proxySet, get, store);
};

export default create<ZustandStateManager>()(
    immer(
        devtools(
            customMiddleware(
                (setState) => new ZustandStateManager({
                    setState: setState as IZustandStateManager.SetState,
                }),
            ),
            { serialize: true },
        )
    )
);
