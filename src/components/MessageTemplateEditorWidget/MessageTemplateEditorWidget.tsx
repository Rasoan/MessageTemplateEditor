'use strict';

import * as React from 'react';

import StickerForCondition from "../StickerForCondition/StickerForCondition";
import MessageSnippetsBlock from "../MessageSnippetsBlock/MessageSnippetsBlock";
import useBaseStore from "../../store/store";

import {shallow} from "zustand/shallow";

import "./MessageTemplateEditorWidget.scss";

const MessageTemplateEditorWidget: React.FC = () => {
    const [
        isOpenMessageTemplateEditor,
        toggleIsOpenMessageTemplateEditor,
        messageTemplate,
    ] = useBaseStore(
        stateManager => [
            stateManager.state.isOpenMessageTemplateEditor,
            stateManager.state.toggleIsOpenMessageTemplateEditor,
            stateManager.state.messageTemplate,
            stateManager.state.messageTemplate.countIfThenElseBlocks,
        ],
        shallow,
    );

    const splitBlockAndInsertIfThenElse = () => {
        messageTemplate.splitFieldAndInsertIfThenElseBlock();
    };

    return <div
        className={"MessageTemplateEditorWidget"}
    >
        <h2>Message Template Editor</h2>
        <button
            className={"splitterFields"}
            onClick={splitBlockAndInsertIfThenElse}
        >
            {
                /*
                    &#123; - код кавычки "{"
                    &#125; - код кавычки "}"
                */
            }
            Click to add:
            <StickerForCondition
                content={"if"}
            />
            <span>&#123;&#123;some_variable&#125; or expression&#125;</span>
            <StickerForCondition
                content={"then"}
            />
            <span>&#123;then value&#125;</span>
            <StickerForCondition
                content={"else"}
            /> &#123;
            else value&#125;
        </button>
        <div
            className={"MessageTemplateEditorWidget__containerForSubMessages"}
        >
            <MessageSnippetsBlock
                countNested={1}
            />
        </div>
        <button onClick={() => console.log(messageTemplate.getMessageSnippets())}>Save</button>
        <button onClick={() => {}}>Preview</button>
        <button onClick={() => toggleIsOpenMessageTemplateEditor(false)}>Close</button>
    </div>;
}

export default MessageTemplateEditorWidget;