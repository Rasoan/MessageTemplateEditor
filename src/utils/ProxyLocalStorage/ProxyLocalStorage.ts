'use strict';

const _keyForMessageTemplate = '____keyForMessageTemplate____';
// по ТЗ должно называться именно arrVarNames
const _keyForKeysVariablesList = 'arrVarNames';
const _keyForIsOpenMessageTemplateEditor = '____keyForIsOpenMessageTemplateEditor____';

export default class ProxyLocalStorage {
    static getMessageTemplate(): string | null {
        return _get(_keyForMessageTemplate);
    }

    static setMessageTemplate(messageTemplate: string): void {
        return _set(_keyForMessageTemplate, messageTemplate)
    }

    static getKeysVariablesList(): string | null {
        return _get(_keyForKeysVariablesList);
    }

    static setVariables(variables: string): void {
        return _set(_keyForKeysVariablesList, variables);
    }

    static setIsOpenMessageTemplateEditor(isOpenMessageTemplateEditor: string) {
        if (isOpenMessageTemplateEditor !== 'true'
            && isOpenMessageTemplateEditor !== 'false') {
            throw new Error('Must be only boolean value!');
        }

        return _set(_keyForIsOpenMessageTemplateEditor, isOpenMessageTemplateEditor)
    }

    static getIsOpenMessageTemplateEditor(): boolean | null {
        return JSON.parse(_get(_keyForIsOpenMessageTemplateEditor));
    }
}

function _set(key: string, value: string): void {
    localStorage.setItem(key, value);
}

function _get(key: string): string | null {
    return localStorage.getItem(key);
}