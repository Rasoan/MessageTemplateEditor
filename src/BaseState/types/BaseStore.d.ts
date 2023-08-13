//
import BaseState from "../BaseState";

export namespace IBaseStore {
    interface Options {
        setState: SetState;
    }

    type SetState = (callBack: (prevState: BaseState) => Partial<BaseState>) => void;
}