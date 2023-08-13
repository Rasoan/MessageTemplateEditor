//
import BaseState from "../../BaseState/BaseState";
import {IBaseState} from "../../BaseState/types/BaseState";

export namespace IBaseStateManager {
    interface Options extends Partial<IBaseState.Options> {}

    interface ProxyState {
        stateChangeNotify: Function;
        /**
         * В зависимости от библиотеки будем что-то делать с "state" (в zustand например будем перезаписывать
         * изменяя ссылку, что бы zustand понял, что стейт изменился).
         */
        stateWrapper: {
            state: BaseState;
        }
    }
}