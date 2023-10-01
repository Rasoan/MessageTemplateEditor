'use strict';

import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";
import {IBaseState} from "./types/BaseState";
import ProxyLocalStorage from "../../utils/ProxyLocalStorage/ProxyLocalStorage";
import {IMessageTemplate, MessageTemplateDTO} from "../../utils/MessageTemplate/types/MessageTemplate";

export default class BaseState {
    private _stateChangeNotify: Function;

    public isOpenMessageTemplateEditor: boolean = false;
    public messageTemplate: MessageTemplate;
    public arrVarNames: string[];

    constructor(options: IBaseState.Options) {
        const {
            stateChangeNotify,
        } = options;

        this._stateChangeNotify = stateChangeNotify;

        this.messageTemplate = createMessageTemplate({ stateChangeNotify });
        this.arrVarNames = this.messageTemplate.variablesKeysList;
        const isOpenMessageTemplateEditor = ProxyLocalStorage.getIsOpenMessageTemplateEditor();

        if (typeof isOpenMessageTemplateEditor !== null) {
            this.isOpenMessageTemplateEditor = isOpenMessageTemplateEditor;
        }
    }

    public setIsOpenMessageTemplateEditor = (isOpenMessageTemplateEditor: boolean) => {
        this.isOpenMessageTemplateEditor = isOpenMessageTemplateEditor;

        ProxyLocalStorage.setIsOpenMessageTemplateEditor(
            JSON.stringify(isOpenMessageTemplateEditor)
        );

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
    const variablesKeysList: IMessageTemplate.VariablesKeysList | null = JSON.parse(ProxyLocalStorage.getKeysVariablesList());

    return messageTemplateDTO
        ? MessageTemplate.fromDTO(
            messageTemplateDTO,
            stateChangeNotify,
            variablesKeysList || void 0,
        )
        : new MessageTemplate({
            stateChangeNotify,
            variablesKeysList: variablesKeysList || void 0,
        })
    ;
}