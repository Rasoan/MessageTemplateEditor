'use strict';

import * as React from 'react';

import "./StickerForCondition.scss";

interface StickerForConditionProps {
    content: string;
}

const StickerForCondition: React.FC<StickerForConditionProps> = (props) => {
    const {
        content,
    } = props;

    return <span className={"stickerForCondition"}>{content}</span>;
}

export default StickerForCondition;
