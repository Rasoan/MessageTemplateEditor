'use strict';

import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";
import {IBaseState} from "./types/BaseState";
import ProxyLocalStorage from "../../utils/ProxyLocalStorage/ProxyLocalStorage";
import {IMessageTemplate, MessageTemplateDTO} from "../../utils/MessageTemplate/types/MessageTemplate";

export default class BaseState {
    private _stateChangeNotify: Function;

    public isOpenMessageTemplateEditor: boolean = false;
    public isOpenMessageTemplatePreviewWidget: boolean = false;
    public messageTemplate: MessageTemplate;
    public arrVarNames: string[];

    constructor(options: IBaseState.Options) {
        const {
            stateChangeNotify,
        } = options;

        this._stateChangeNotify = stateChangeNotify;

        this.messageTemplate = createMessageTemplate({ stateChangeNotify });
        this.arrVarNames = this.messageTemplate.variablesKeysList;
    }

    public setIsOpenMessageTemplateEditor = (isOpenMessageTemplateEditor: boolean) => {
        this.isOpenMessageTemplateEditor = isOpenMessageTemplateEditor;

        this._stateChangeNotify();
    }

    public setIsOpenMessageTemplatePreviewWidget = (isOpenMessageTemplatePreviewWidget: boolean) => {
        this.isOpenMessageTemplatePreviewWidget = isOpenMessageTemplatePreviewWidget;

        this._stateChangeNotify();
    }

    public recreateMessageTemplate = () => {
        this.messageTemplate = createMessageTemplate({
            stateChangeNotify: this._stateChangeNotify,
        });

        this._stateChangeNotify();
    }
}

function createMessageTemplate(options: IBaseState.Options): MessageTemplate {
    const {
        stateChangeNotify,
    } = options;
    const messageTemplateDTO: MessageTemplateDTO | null = JSON.parse(ProxyLocalStorage.getMessageTemplate());
    const variablesList: IMessageTemplate.VariablesListDTO | null = JSON.parse(ProxyLocalStorage.getKeysVariablesList());

    return messageTemplateDTO
        ? MessageTemplate.fromDTO(
            messageTemplateDTO,
            stateChangeNotify,
            variablesList || void 0,
        )
        : new MessageTemplate({
            stateChangeNotify,
            variablesList: variablesList || void 0,
        })
    ;
}