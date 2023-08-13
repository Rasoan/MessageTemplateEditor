import BaseState from "../../BaseState/BaseState";
import {IBaseStateManager} from "../../BaseStateManager/types/BaseStateManager";
import ZustandStateManager from "../ZustandStateManager";
import {State, StateCreator} from "zustand";

export namespace IZustandStateManager {
    interface Options extends IBaseStateManager.Options {
        setState: SetState;
    }

    type SetState = (callBack: (prevState: ZustandStateManager) => void) => void;

    /** Кастомный [middleware]{@link https://docs.pmnd.rs/zustand/guides/typescript#middleware-that-doesn't-change-the-store-type} */
    type CustomMiddleware = <T extends State>(
        f: StateCreator<T, [], []>,
        name?: string
    ) => StateCreator<T, [], []>;
}