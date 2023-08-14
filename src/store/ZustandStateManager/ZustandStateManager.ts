'use strict';

import {immerable} from "immer";

import {IZustandStateManager} from "./types/ZustandStateManager";
import BaseStateManager from "../BaseStateManager/BaseStateManager";

export default class ZustandStateManager extends BaseStateManager {
    /**
     * Свойство нужно добавить в класс, что бы библиотека [zustand]{@link https://immerjs.github.io/immer/complex-objects/}
     * восприняла его и не бросила ошибку при создании стейта.
     */
    [immerable] = true;

    private readonly _setState: IZustandStateManager.SetState;

    constructor(options: IZustandStateManager.Options) {
        const {
            setState,
        } = options;

        super();

        this._setState = setState;
    }

    protected _stateChangeNotify() {
        this._setState((zustandState: ZustandStateManager) => {
            /*
                Здесь мы нарушаем правило "protected" но это хак,
                для того, что бы уведомить zustand о том,
                что что-то в стейте поменялось. Это свойство должно быть "private",
                а снаружи оно нам понадобилось только здесь, внутри.
             */
            zustandState._proxyState.stateWrapper = { ...zustandState._proxyState.stateWrapper };
        });
    }

    get state() {
        return this._proxyState.stateWrapper.state;
    }
}