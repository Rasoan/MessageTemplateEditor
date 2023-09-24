'use strict';

import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import "./MessageTemplateEditor.scss";
import {
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
} from "../../utils/MessageTemplate/types/MessageTemplate";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";
import {onKeyDown_or_mouseClick} from "../../utils/utils";

interface MessageTemplateEditorProps {
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE;
    pathToIfThenElse: IMessageTemplate.PathToIfThenElse;
}

const MessageTemplateEditor: React.FC<MessageTemplateEditorProps> = (props) => {
    const {
        pathToIfThenElse,
        blockType,
    } = props;
    const [
        messageTemplate,
        message,
        lastBlurVersion,
    ] = useBaseStore(
        (stateManager) => [
            stateManager.state.messageTemplate,
            stateManager.state.messageTemplate.getMessageSnippetOrVariableValue(
                blockType,
                pathToIfThenElse,
            ),
            stateManager.state.messageTemplate.lastBlurInfo.version,
            stateManager.state.messageTemplate.lastBlurInfo.pathToIfThenElse,
            stateManager.state.messageTemplate.lastBlurInfo.blockType,
            stateManager.state.messageTemplate.lastBlurInfo.cursorPosition
        ],
        shallow,
    );
    const [
        isShowPanel,
        setIsShowPanel,
    ] = useState(false);
    const [
        isClickOnPanel,
        setIsClickOnPanelWas,
    ] = useState(false);

    const ref = useRef<HTMLTextAreaElement>(null);

    const isThisFieldLastBlur = messageTemplate.checkIsLastBlurField(
        blockType,
        pathToIfThenElse,
    );

    /*
        Курсор выставляем в 3 случаях:
         - при первом рендере компонеты выставить курсор (если здесь он был в предыдущей загрузке страницы);
         - если удалили ifThenElse, то кинем курсор в родительский блок
         - после вставки переменной в текстовое поле вернём ему курсор.
     */
    useEffect(() => {
        const {
            lastBlurInfo: {
                cursorPosition: lastBlurInfo_cursorPosition,
            },
        }  = messageTemplate;

        if (isThisFieldLastBlur) {
            const {
                current,
            } = ref;

            if (current) {
                current.focus();

                current.selectionStart = lastBlurInfo_cursorPosition;
                current.selectionEnd = lastBlurInfo_cursorPosition;
            }
        }
    }, [ lastBlurVersion ]);

    const onChangeField = (onChangeEvent: React.FormEvent<HTMLTextAreaElement>) => {
        const {
            target,
        } = onChangeEvent;
        const {
            value,
        } = target as HTMLTextAreaElement;

        messageTemplate.setMessageSnippetOrVariableValue(
            value,
            blockType,
            pathToIfThenElse,
        );
    };

    const onClick = (onClickEvent: React.MouseEvent<HTMLTextAreaElement>) => {
        setIsShowPanel(true);
        setIsClickOnPanelWas(true);

        onKeyDown_or_mouseClick<HTMLTextAreaElement, React.MouseEvent<HTMLTextAreaElement>>(
            onClickEvent,
            messageTemplate,
            blockType,
            pathToIfThenElse,
        );
    };

    const onKeyUp = (KeyboardEvent: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown_or_mouseClick<HTMLTextAreaElement, React.KeyboardEvent<HTMLTextAreaElement>>(
            KeyboardEvent,
            messageTemplate,
            blockType,
            pathToIfThenElse,
        );
    };
    const splitBlockAndInsertIfThenElse = () => {
        messageTemplate.splitFieldAndInsertIfThenElse(pathToIfThenElse, blockType);
    };

    return <div
        className={"MessageTemplateEditor"}
        onMouseLeave={() => setIsShowPanel(false)}
    >
        <TextareaAutosize
            className={"MessageTemplateEditor__field field"}
            ref={ref}
            onClick={(Event) => onClick(Event)}
            onKeyUp={(Event) => onKeyUp(Event)}
            value={message}
            onChange={onChangeField}
        />
        <div
            className={
            ''.concat(
                'MessageTemplateEditor__panel panel',
                ` ${isShowPanel ? 'panel-show': ''}`,
                ` ${isClickOnPanel && !isShowPanel ? 'panel-hidden': ''}`,
            )
        }
        >
            <button
                className={"panel__buttonSplitter buttonSplitter"}
                onClick={splitBlockAndInsertIfThenElse}
            >
                <img
                    className={"panel__imgButtonSplitter imgButtonSplitter"}
                    src={"splitterIfThenElse.png"}
                    alt={"splitter ifThenElse"}
                />
                if | then | else
            </button>
        </div>
    </div>;
}

export default MessageTemplateEditor;
