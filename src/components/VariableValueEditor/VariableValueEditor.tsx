'use strict';

import * as React from 'react';

import "./VariableValueEditor.scss";
import useBaseStore from "../../store/store";
import {shallow} from "zustand/shallow";

interface VariableValueEditorProps {
    variableKey: string;
}

const VariableValueEditor: React.FC<VariableValueEditorProps> = (props) => {
    const {
        variableKey,
    } = props;
    const [
        variableValue,
        changeVariable,
    ] = useBaseStore(stateManager =>
            [
                stateManager.state.messageTemplate.getVariableValue(variableKey, { force: true }),
                stateManager.state.messageTemplate.changeVariable,
            ],
        shallow,
    );

    return <div>
        <span>{variableKey}</span>
        <input
            value={variableValue}
            onChange={(event) => changeVariable(event.target.value, variableKey)}
        >
        </input>
    </div>
}

export default VariableValueEditor;