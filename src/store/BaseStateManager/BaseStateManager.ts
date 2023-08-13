'use strict';

import {IBaseStateManager} from "./types/BaseStateManager";
import BaseState from "../BaseState/BaseState";

export default abstract class BaseStateManager {
    protected abstract _stateChangeNotify(): void;

    protected _proxyState: IBaseStateManager.ProxyState;

    constructor(options: IBaseStateManager.Options) {
        const stateChangeNotify = () => this._stateChangeNotify();

        this._proxyState = {
            stateWrapper: {
                state: new BaseState({
                    stateChangeNotify,
                    messageTemplateOptions: options.messageTemplateOptions,
                }),
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