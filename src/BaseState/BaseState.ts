'use strict';

import MessageTemplate from "../utils/MessageTemplate/MessageTemplate";
import {IBaseStore} from "./types/BaseStore";
import {immerable} from "immer";

export default class BaseState {
    private readonly _setState: any;
    public isOpenMessageTemplateEditor: boolean;
    public messageTemplate: MessageTemplate;

    constructor(options: IBaseStore.Options) {
        const {
            setState,
        } = options;

        this._setState = setState;
        this.isOpenMessageTemplateEditor = false;
        this.messageTemplate = new MessageTemplate({
            handleUpdateState: this._updateVersion,
        });
    }

    private _toggleIsOpenMessageTemplateEditor(isOpenMessageTemplateEditor: boolean) {
        this._setState((state: BaseState) => {
            state.isOpenMessageTemplateEditor = isOpenMessageTemplateEditor;
        });
    }
    public toggleIsOpenMessageTemplateEditor = this._toggleIsOpenMessageTemplateEditor.bind(this);

    private _updateVersion = () => {
        this._setState((state: BaseState) => {
            state.version++;
        });
    }

    version = 0;
    /**
     * Свойство нужно добавить в класс, что бы библиотека [zustand]{@link https://immerjs.github.io/immer/complex-objects/}
     * восприняла его и не бросила ошибку при создании стейта.
    */
    [immerable] = true;
}