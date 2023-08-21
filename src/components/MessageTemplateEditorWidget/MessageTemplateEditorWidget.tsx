'use strict';

import * as React from 'react';

import StickerForCondition from "../StickerForCondition/StickerForCondition";
import MessageSnippetsBlock from "../MessageSnippetsBlock/MessageSnippetsBlock";
import useBaseStore from "../../store/store";

import {shallow} from "zustand/shallow";

import "./MessageTemplateEditorWidget.scss";
import MessageTemplatePreviewWidget from "../MessageTemplatePreviewWidget/MessageTemplatePreviewWidget";

interface MessageTemplateEditorWidgetProps {
    callbackSave: (previewWidget: string) => Promise<void>;
}

const MessageTemplateEditorWidget: React.FC<MessageTemplateEditorWidgetProps> = (props) => {
    const {
        callbackSave,
    } = props;
    const [
        setIsOpenMessageTemplateEditor,
        messageTemplate,
        isOpenMessageTemplatePreviewWidget,
        setIsOpenMessageTemplatePreviewWidget,
        resetMessageTemplate,
        previewWidget,
    ] = useBaseStore(
        stateManager => [
            stateManager.state.setIsOpenMessageTemplateEditor,
            stateManager.state.messageTemplate,
            stateManager.state.isOpenMessageTemplatePreviewWidget,
            stateManager.state.setIsOpenMessageTemplatePreviewWidget,
            stateManager.state.messageTemplate.reset,
            stateManager.state.messageTemplate.previewWidget,
            //
            stateManager.state.messageTemplate.countIfThenElseBlocks,
            stateManager.state.isOpenMessageTemplateEditor,
        ],
        shallow,
    );
    const onClickOnVariable = (event: React.MouseEvent<HTMLButtonElement>) => {
        const {
            currentTarget,
        } = event;
        const {
            value,
        } = currentTarget;

        messageTemplate.insertVariableInSubMessage(value);
    }
    const variables = messageTemplate.variablesKeysList.map((variableKey, index) => <button
        key={variableKey + index}
        value={variableKey}
        onClick={onClickOnVariable}
    >
        {`{${variableKey}}`}
    </button>);

    const splitBlockAndInsertIfThenElse = () => {
        try {
            messageTemplate.splitFieldAndInsertIfThenElseBlock();
        }
        catch(error) {
            alert(error);
        }
    };

    return <div
        className={"MessageTemplateEditorWidget"}
    >
        <h2>Message Template Editor</h2>
        <div>
            {variables}
        </div>
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
        {isOpenMessageTemplatePreviewWidget ? <>
                <MessageTemplatePreviewWidget />
            </>
            : null}
        <button onClick={() => callbackSave(previewWidget)}>Save</button>
        <button onClick={() => setIsOpenMessageTemplatePreviewWidget(true)}>Preview</button>
        <button onClick={() => {
            setIsOpenMessageTemplateEditor(false);
            resetMessageTemplate();
        }}>Close</button>
    </div>;
}

export default MessageTemplateEditorWidget;