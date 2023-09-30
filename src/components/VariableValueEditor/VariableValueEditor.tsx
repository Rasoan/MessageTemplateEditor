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

    return <div className={'VariableValueEditor'}>
        <label
            className={'VariableValueEditor__label VariableValueEditorLabel'}
            htmlFor={variableKey}
        >
            {"{" + variableKey + "}"}
        </label>
        <input
            className={'VariableValueEditor__field VariableValueEditorField'}
            name={variableKey}
            value={variableValue}
            onChange={(event) => changeVariable(event.target.value, variableKey)}
        >
        </input>
    </div>
}

export default VariableValueEditor;