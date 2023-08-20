//
import MessageTemplate from "../../../utils/MessageTemplate/MessageTemplate";
import {IMessageTemplate, MessageTemplateDTO} from "../../../utils/MessageTemplate/types/MessageTemplate";

export namespace IBaseState {
    interface Options {
        stateChangeNotify: Function,
        baseStateJSON?: BaseStateJSON,
    }
}

export type BaseStateJSON = {
    isOpenMessageTemplateEditor: boolean;
    messageTemplate: MessageTemplate;
    isOpenMessageTemplatePreviewWidget: boolean;
}

export type BaseStateDTO = [
    isOpenMessageTemplateEditor: boolean,
    messageTemplate: MessageTemplateDTO,
    isOpenMessageTemplatePreviewWidget: boolean,
];

export const enum BaseStateDTO_Props {
    isOpenMessageTemplateEditor = 0,
    messageTemplate = 1,
    isOpenMessageTemplatePreviewWidget = 2,

    __SIZE__ = 3
}