'use strict';

import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";
import {IBaseState} from "./types/BaseState";

export default class BaseState {
    private _stateChangeNotify: Function;

    public isOpenMessageTemplateEditor: boolean;
    public messageTemplate: MessageTemplate;

    constructor(options: IBaseState.Options) {
        const {
            stateChangeNotify,
        } = options;

        this.isOpenMessageTemplateEditor = false;

        this.messageTemplate = new MessageTemplate({ stateChangeNotify });
        this._stateChangeNotify = stateChangeNotify;
    }

    public toggleIsOpenMessageTemplateEditor = (isOpenMessageTemplateEditor: boolean) => {
        this.isOpenMessageTemplateEditor = isOpenMessageTemplateEditor;

        this._stateChangeNotify();
    }
}