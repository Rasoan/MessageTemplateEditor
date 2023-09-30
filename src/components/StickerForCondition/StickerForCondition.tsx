'use strict';

import * as React from 'react';

import "./StickerForCondition.scss";

interface StickerForConditionProps {
    content: string;
    textColor?: string;
}

const StickerForCondition: React.FC<StickerForConditionProps> = (props) => {
    const {
        content,
        textColor,
    } = props;

    const additionalStyle = { color: 'black' };

    if (textColor !== void 0) {
        additionalStyle.color = textColor;
    }

    return <span
        style={additionalStyle}
        className={"stickerForCondition"}
    >
        {content}
    </span>;
}

export default StickerForCondition;
