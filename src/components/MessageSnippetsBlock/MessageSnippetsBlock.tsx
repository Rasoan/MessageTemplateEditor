'use strict';

import * as React from 'react';

import MessageTemplateEditor from "../MessageTemplateEditor/MessageTemplateEditor";

import IfThenElse from "../IfThenElse/IfThenElse";
import {
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
} from "../../utils/MessageTemplate/types/MessageTemplate";

import "./MessageSnippetsBlock.scss";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";
import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";

interface MessageSnippetsBlockProps {
    /** Путь к ifThenElse */
    path: IMessageTemplate.PathToIfThenElse,
    /** Тип блока */
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
    /** Количество вложенности (это технический параметр - страхуемся от зацикливания) {@link MAX_RECURSION_OF_NESTED_BLOCKS} */
    countNested: number,
}

const MessageSnippetsBlock: React.FC<MessageSnippetsBlockProps> = (props) => {
    const {
        path,
        blockType,
        countNested,
    } = props;
    const [
        messageTemplate,
    ] = useBaseStore(
        (stateManager) => [
            stateManager.state.messageTemplate,
            stateManager.state.messageTemplate.getAllFields().length,
        ],
        shallow,
    );

    const listIfThenElse = messageTemplate.getListIfThenElseInNestingLevel(
        blockType,
        path,
    ).map((currentIfThenElse, positionIfThenElse) => {
        const newPath = MessageTemplate.createPath(
            positionIfThenElse,
            blockType,
            path,
        );

        return <IfThenElse
            key={newPath}
            path={newPath}
            countNested={countNested + 1/* Следующая вложенность на 1 глубже */}
        />
    });

    return <div
        className={'MessageSnippetsBlock'}
    >
        <MessageTemplateEditor
            pathToIfThenElse={path}
            blockType={blockType}
        />
        {listIfThenElse}
    </div>;
}

export default MessageSnippetsBlock;