//
import MessageTemplate from "../../../utils/MessageTemplate/MessageTemplate";
import {IMessageTemplate} from "../../../utils/MessageTemplate/types/MessageTemplate";

export namespace IBaseState {
    interface Options {
        messageTemplateOptions: IMessageTemplate.Options,
        stateChangeNotify: Function,
    }
}