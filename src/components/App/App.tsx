'use strict';

import * as React from 'react';

import "./App.scss";
import {useMemo, useState} from "react";
import MessageTemplateEditorWidget from "../MessageTemplateEditorWidget/MessageTemplateEditorWidget";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";
import ProxyLocalStorage from "../../utils/ProxyLocalStorage/ProxyLocalStorage";

export default function App(): JSX.Element {
    const [
        isOpenMessageTemplateEditor,
        toggleIsOpenMessageTemplateEditor,
        recreateMessageTemplate,
        messageTemplate,
        arrVarNames,
    ] = useBaseStore(
        stateManager => {
            return [
                stateManager.state.isOpenMessageTemplateEditor,
                stateManager.state.setIsOpenMessageTemplateEditor,
                stateManager.state.recreateMessageTemplate,
                stateManager.state.messageTemplate,
                stateManager.state.arrVarNames,
            ];
        },
        shallow,
    );
    const callbackSave = async (): Promise<void> => {
        ProxyLocalStorage.setMessageTemplate(
            JSON.stringify(messageTemplate.toDTO()),
        );
        ProxyLocalStorage.setVariables(
            JSON.stringify(messageTemplate.variablesListToDTO()),
        );
    }
    const handleOpenMessageTemplateEditor = () => {
        recreateMessageTemplate();
        toggleIsOpenMessageTemplateEditor(true);
    }

    return <div
        className={'App'}
    >
        {
            isOpenMessageTemplateEditor
                ? <MessageTemplateEditorWidget
                    callbackSave={callbackSave}
                    arrVarNames={arrVarNames}
                    template={messageTemplate}
                />
                : <button
                className={'App__toggleMessageTemplate toggleMessageTemplate'}
                    onClick={handleOpenMessageTemplateEditor}
                >
                    Message Editor
                </button>
        }
    </div>;
}
