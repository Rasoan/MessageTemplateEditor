'use strict';

import * as React from 'react';
import StickerForCondition from "../StickerForCondition/StickerForCondition";
import MessageTemplateConditionEditor from "../MessageTemplateConditionEditor/MessageTemplateConditionEditor";
import {IMessageTemplate, MESSAGE_TEMPLATE_BLOCK_TYPE,} from "../../utils/MessageTemplate/types/MessageTemplate";
import MessageSnippetsBlock from "../MessageSnippetsBlock/MessageSnippetsBlock";
import {MAX_RECURSION_OF_NESTED_BLOCKS} from "../../utils/constants";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

import "./IfThenElse.scss";
import MessageTemplate from "../../utils/MessageTemplate/MessageTemplate";
import MessageTemplateEditor from "../MessageTemplateEditor/MessageTemplateEditor";
import {getListParentsIfThenElseInfo} from "../../utils/utils";

interface IfThenElseProps {
    /**
     * Путь к родительскому блоку (void 0 если самый первый ifThenElse), именно к родительскому блоку, а не к ifThenElse
    */
    path: IMessageTemplate.PathToIfThenElse;
    /** Количество вложенности (это технический параметр - страхуемся от зацикливания) {@link MAX_RECURSION_OF_NESTED_BLOCKS} */
    countNested: number,
}

const IfThenElse: React.FC<IfThenElseProps> = (props) => {
    const {
        path,
        countNested,
    } = props;
    const [
        messageTemplate,
    ] = useBaseStore(
        (stateManager) => [
            stateManager.state.messageTemplate,
        ],
        shallow,
    );

    MessageTemplate.checkMaxNestedIfThenElse(countNested);

    const deleteIfThenElse = () => {
        messageTemplate.deleteIfThenElse(path);
    }

    return <div className={"IfThenElse"}>
        <div className={"IfThenElse__conditionalFieldsWrapper conditionalFieldsWrapper"}>
            <button
                className={"conditionalFieldsWrapper__buttonDeleter buttonDeleter"}
                onClick={deleteIfThenElse}
            >
                Delete
            </button>
            <div className={"conditionalFieldsWrapper__wrapperContent wrapperContent"}>
                <div className={"wrapperContent__if conditionalBlock conditionalBlockIf"}>
                    <div
                        className={'conditionalBlock__stickerForConditionContainer stickerForConditionContainer'}
                    >
                        <StickerForCondition content={'if'}/>
                    </div>
                    <MessageTemplateConditionEditor
                        pathToIfThenElse={path}
                    />
                </div>
                <div className={"wrapperContent__conditionalBlock conditionalBlock conditionalBlockThen"}>
                    <div className={"conditionalBlock__stickerForConditionContainer stickerForConditionContainer"}>
                        <StickerForCondition content={'then'}/>
                    </div>
                    <MessageSnippetsBlock
                        path={path}
                        blockType={MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}
                        // увеличим счётчик вложенности ifThenElse в ifThenElse на 1
                        countNested={countNested + 1}
                    />
                </div>
                <div className={"wrapperContent__conditionalBlock conditionalBlock conditionalBlockElse"}>
                    <div className={"conditionalBlock__stickerForConditionContainer stickerForConditionContainer"}>
                        <StickerForCondition content={'else'}/>
                    </div>
                    <MessageSnippetsBlock
                        path={path}
                        blockType={MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}
                        // увеличим счётчик вложенности ifThenElse в ifThenElse на 1
                        countNested={countNested + 1}
                    />
                </div>
            </div>
        </div>
        <div className={"IfThenElse__optionalFieldsWrapper optionalFieldsWrapper"}>
            <MessageTemplateEditor
                pathToIfThenElse={path}
                blockType={MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL}
            />
        </div>
    </div>
};

export default IfThenElse;
