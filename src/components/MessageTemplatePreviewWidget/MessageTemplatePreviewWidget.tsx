'use strict';

import * as React from "react";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

import './MessageTemplatePreviewWidget.scss';
import VariableValueEditor from "../VariableValueEditor/VariableValueEditor";
import Modal from "../Modal/Modal";

interface _MessageTemplatePreviewWidgetProps {
    handleClose: () => void;
}

const _MessageTemplatePreviewWidget: React.FC<_MessageTemplatePreviewWidgetProps> = (props) => {
    const {
        handleClose,
    } = props;
    const [
        messageTemplate,
        previewWidget,
    ] = useBaseStore(stateManager =>
            [
                stateManager.state.messageTemplate,
                stateManager.state.messageTemplate.previewWidget,
            ],
        shallow,
    );

    const variables = messageTemplate.variablesKeysList.map((variable, index) => {
        return <VariableValueEditor
            key={variable + index}
            variableKey={variable}
        />
    });

    return <>
        <div
            className={'MessageTemplatePreviewWidget'}
        >
            <div className={'MessageTemplatePreviewWidget__previewWidgetContainer previewWidgetContainer'}>
            <div
                className={'previewWidgetContainer__text previewWidgetContainerText'}
            >
                <span>{previewWidget}</span>
            </div>
            </div>
            <div className={'MessageTemplatePreviewWidget__variablesContainer variablesContainer'}>
                <span
                    className={'variablesContainer__variablesHeader variablesHeader'}
                >
                    Variables:
                </span>
                {variables}
            </div>
            <button
                className={'MessageTemplatePreviewWidget__buttonClose buttonClose'}
                onClick={handleClose}
            >
                Close
            </button>
        </div>
    </>
}

const MessageTemplatePreviewWidget: React.FC<_MessageTemplatePreviewWidgetProps> = (props) => {
    const {
        handleClose,
    } = props;

    return <Modal
        isShowing={true}
        close={handleClose}
        component={<_MessageTemplatePreviewWidget handleClose={handleClose} />}
    />
}
export default MessageTemplatePreviewWidget;