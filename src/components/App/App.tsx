'use strict';

import * as React from 'react';

import "./App.scss";
import { useMemo } from "react";
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
                stateManager.state.toggleIsOpenMessageTemplateEditor,
            ];
        },
        shallow,
    );

    return <div>
        {
            isOpenMessageTemplateEditor
                ? <MessageTemplateEditorWidget />
                : <button onClick={() => toggleIsOpenMessageTemplateEditor(true)}>
                    Message Editor
                </button>
        }
    </div>;
}
