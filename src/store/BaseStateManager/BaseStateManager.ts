'use strict';

import {IBaseStateManager} from "./types/BaseStateManager";
import BaseState from "../BaseState/BaseState";
import BaseStateLocalStorage from "../../utils/LocalStorage/LocalStorage";

export default abstract class BaseStateManager {
    protected abstract _stateChangeNotify(): void;

    protected _proxyState: IBaseStateManager.ProxyState;

    constructor() {
        const stateChangeNotify = () => this._stateChangeNotify();
        const baseStateString: string | null = BaseStateLocalStorage.getStateString();
        const baseStateOptions = { stateChangeNotify };
        const baseState = baseStateString
            ? BaseState.fromDTO(JSON.parse(baseStateString), baseStateOptions)
            : new BaseState(baseStateOptions)
        ;

        this._proxyState = {
            stateWrapper: {
                state: baseState,
            },
            stateChangeNotify,
        };

        // это хак, если обьявить обычный getter, то библиотека стейт менеджера его сносит (удаляет) (например zustand).
        Object.defineProperties(this, {
            state: {
                enumerable: true,
                configurable: false,
                get() {
                    return this._proxyState.stateWrapper.state;
                },
            },
        });
    }
}