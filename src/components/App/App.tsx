'use strict';

import * as React from 'react';

import "./App.scss";
import {useState} from "react";

export default function App(): JSX.Element {
    const [
        isOpenMessageTemplateEditor,
        setIsOpenMessageTemplateEditor,
    ] = useState(false);

    return <div>
            {
                isOpenMessageTemplateEditor
                    ? null
                    : <button>Message Editor</button>
            }
    </div>;
}
