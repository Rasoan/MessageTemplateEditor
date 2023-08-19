'use strict';

import * as React from "react";
import MessageTemplate from "./MessageTemplate/MessageTemplate";
import {IMessageTemplate} from "./MessageTemplate/types/MessageTemplate";

/**
 * Генератор сообщений, заменяет в тексте названия переменных значениями переменных,
 * в случае, если таковы были переданы в map-у "values", если же в "values" переменная не найдена,
 * то она будет интерпретироваться как пустая строка.
 *
 * @param template - шаблон сообщения
 * @param values - значения переменных (объект вида {name : value}).
 * В объекте могут присутствовать, как лишние пары name & value - будут игнорироваться,
 * так и отсутствовать необходимые - будут интерпретироваться, как пустые значения.
 */
export function generatorMessage(template: string, values: Record<string, string>): string {
    let messageResult = template;

    for (const [key, value] of Object.entries(values)) {
        messageResult = messageResult
            .replaceAll(`{${key}}`, value)
        ;
    }

    return messageResult;
}

/**
 * Записать позицию курсора при клике или нажатии на кнопку
 *
 * @param keyboardEvent_or_mouseEvent
 * @param messageTemplate
 * @param path - путь к ifThenElse
 * @param lastBlurSnippetMessageInformation - опциональный, если не пришёл, то это позиция курсора в IF
 */
export function onKeyDown_or_mouseClick<
    TI extends HTMLTextAreaElement | HTMLInputElement,
    KM extends React.MouseEvent<TI> | React.KeyboardEvent<TI>,
>(
    keyboardEvent_or_mouseEvent: KM,
    messageTemplate: MessageTemplate,
    path?: IMessageTemplate.PathToBlock | void,
    lastBlurSnippetMessageInformation?: IMessageTemplate.LastBlurSnippetMessageInformation,
) {
    const {
        fieldType,
        blockType,
    } = lastBlurSnippetMessageInformation || {} as IMessageTemplate.LastBlurSnippetMessageInformation;
    const {
        target,
    } = keyboardEvent_or_mouseEvent;
    const {
        selectionStart,
        selectionEnd,
        selectionDirection,
    } = target as TI;

    const lastBlurInformation: Omit<IMessageTemplate.LastBlurInformation, 'insertedVariablesVersion'> = {
        pathToIfThenElseBlock: path,
        cursorPosition: _calculateCursorPosition(
            selectionStart as number,
            selectionEnd as number,
            selectionDirection as SELECTION_DIRECTION,
        ),
    };

    if (lastBlurSnippetMessageInformation) {
        lastBlurInformation.snippetMessageInformation = {
            blockType,
            fieldType,
        }
    }

    messageTemplate.setLastBlurInformation(lastBlurInformation);
}

const enum SELECTION_DIRECTION {
    /** Выделение вперёд */
    Forward = "forward",
    /** Выделение назад */
    Backward = "backward",
    None = "none",
}

function _calculateCursorPosition(selectionStart: number, selectionEnd: number, selectionDirection: string) {
    switch (selectionDirection as SELECTION_DIRECTION) {
        case SELECTION_DIRECTION.Forward: {
            /*
                Если мы, выделили текст слева на право "===>", наверняка мы надеемся,
                что в левой части окажется всё,
                что ДО выделения включая выделенный текст.
             */
            return selectionEnd;
        }
        case SELECTION_DIRECTION.Backward: {
            /*
                Если мы, выделили текст справа на лево "<===", наверняка мы надеемся,
                что в левой части окажется всё,
                что оказалось ПЕРЕД выделенным текстом НЕ включая выделенный текст
             */
            return selectionStart;
        }
    }

    return selectionEnd;
}
