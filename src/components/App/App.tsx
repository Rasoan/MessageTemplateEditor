'use strict';

import * as React from 'react';

import "./App.scss";
import {useMemo, useState} from "react";
import MessageTemplateEditorWidget from "../MessageTemplateEditorWidget/MessageTemplateEditorWidget";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

export default function App(): JSX.Element {
    const [
        isOpenMessageTemplateEditor,
        toggleIsOpenMessageTemplateEditor,
    ] = useBaseStore(
        stateManager => {
            return [
                stateManager.state.isOpenMessageTemplateEditor,
                stateManager.state.setIsOpenMessageTemplateEditor,
            ];
        },
        shallow,
    );
    const callbackSave = async (message: string): Promise<void> => {
        console.log(message);
    }

    return <div
        className={'App'}
    >
        {
            isOpenMessageTemplateEditor
                ? <MessageTemplateEditorWidget callbackSave={callbackSave} />
                : <button
                className={'App__toggleMessageTemplate toggleMessageTemplate'}
                    onClick={() => toggleIsOpenMessageTemplateEditor(true)}
                >
                    Message Editor
                </button>
        }
    </div>;
}
