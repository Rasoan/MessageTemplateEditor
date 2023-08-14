'use strict';

import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";
import {BaseStateDTO, BaseStateDTO_Props, BaseStateJSON, IBaseState} from "./types/BaseState";
import BaseStateLocalStorage from "../../utils/LocalStorage/LocalStorage";

export default class BaseState {
    private _stateChangeNotify: Function;

    public isOpenMessageTemplateEditor: boolean;
    public messageTemplate: MessageTemplate;

    constructor(options: IBaseState.Options) {
        const {
            stateChangeNotify,
            baseStateJSON
        } = options;

        this._stateChangeNotify = stateChangeNotify;

        if (baseStateJSON) {
            const {
                isOpenMessageTemplateEditor,
                messageTemplate,
            } = baseStateJSON;
            this.isOpenMessageTemplateEditor = isOpenMessageTemplateEditor;
            this.messageTemplate = messageTemplate;

            return;
        }

        this.isOpenMessageTemplateEditor = false;
        this.messageTemplate = new MessageTemplate({ stateChangeNotify });
    }

    public toggleIsOpenMessageTemplateEditor = (isOpenMessageTemplateEditor: boolean) => {
        this.isOpenMessageTemplateEditor = isOpenMessageTemplateEditor;

        this._stateChangeNotify();
    }

    public toDTO() {
        const baseStateDTO = new Array(BaseStateDTO_Props.__SIZE__) as BaseStateDTO;

        baseStateDTO[BaseStateDTO_Props.isOpenMessageTemplateEditor] = this.isOpenMessageTemplateEditor;
        baseStateDTO[BaseStateDTO_Props.messageTemplate] = this.messageTemplate.toDTO();

        return baseStateDTO;
    }

    public static dtoToJSON(baseStateDTO: BaseStateDTO, stateChangeNotify: Function): BaseStateJSON {
        return {
            isOpenMessageTemplateEditor: baseStateDTO[BaseStateDTO_Props.isOpenMessageTemplateEditor],
            messageTemplate: MessageTemplate.fromDTO(baseStateDTO[BaseStateDTO_Props.messageTemplate], stateChangeNotify),
        }
    }

    public static fromDTO(baseStateDTO: BaseStateDTO, options: IBaseState.Options): BaseState {
        const {
            stateChangeNotify,
        } = options;
        const baseStateJSON = BaseState.dtoToJSON(baseStateDTO, stateChangeNotify);

        const newOptions = {
            ...options,
            baseStateJSON,
        };

        return new BaseState(newOptions);
    }
}