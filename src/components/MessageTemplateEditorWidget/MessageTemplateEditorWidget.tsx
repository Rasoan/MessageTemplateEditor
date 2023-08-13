'use strict';

import * as React from 'react';

import StickerForCondition from "../StickerForCondition/StickerForCondition";
import MessageSnippetsBlock from "../MessageSnippetsBlock/MessageSnippetsBlock";
import useBaseStore from "../../store/store";

import "./MessageTemplateEditorWidget.scss";
import {shallow} from "zustand/shallow";

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

    return <div>
        <h2>Message Template Editor</h2>
        <button onClick={splitBlockAndInsertIfThenElse}>
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
        <MessageSnippetsBlock
            countNested={1}
        />
        <button onClick={() => console.log(messageTemplate.getMessageSnippets())}>Save</button>
        <button onClick={() => {}}>Preview</button>
        <button onClick={() => toggleIsOpenMessageTemplateEditor(false)}>Close</button>
    </div>;
}

export default MessageTemplateEditorWidget;