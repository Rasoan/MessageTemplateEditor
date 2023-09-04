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
    /**
     * Массив срезов строки, выглядит так:
     * Входная строка: "Привет, {firstname}, как дела? Пойдём завтра гулять в {placeName}? Завтра я буду в {time} занят"
     * Элементы массива:
     * 1) { key: "firstname", segmentOfMessageResult: "Привет, {firstname}" }
     * 2) { key: "placename", segmentOfMessageResult: ", как дела? Пойдём завтра гулять в {placeName}" }
     * 3) { key: "time", segmentOfMessageResult: "? Завтра я буду в {time}" }
     * Окончание строки - " занят" докинется в результирующую строку позже.
    */
    let substringsInfoListWithKeys: {
        /** Ключ переменной, которую будем вставлять в строку */
        key: string;
        /** Срез строки с наконечником содержащим переменную */
        substring: string;
    }[] = [];

    /* Длина подстроки **/
    let currentSubstringLength = 0;

    for (const [ key, value ] of Object.entries(values)) {
        let keyInStringPosition = 0;

        // цикл обязательно прервётся, когда все переменные будут найдены
        while (true) {
            keyInStringPosition = template.indexOf(`{${key}}`, keyInStringPosition);

            // условие выхода из цикла поиска вхождений ключа в строке
            if (!~keyInStringPosition) {
                break;
            }

            const {
                substring: {
                    length: lastSubstringLength = 0,
                } = {},
            } = substringsInfoListWithKeys[substringsInfoListWithKeys.length - 1/** последний элемент */] || {};

            currentSubstringLength = keyInStringPosition + key.length + 2/* 2 фигурные скобки */;

            substringsInfoListWithKeys.push({
                key,
                substring: template.slice(lastSubstringLength, currentSubstringLength),
            });

            // перекидываем стартовую позицию для поиска вхождения на позицию вперёд, что бы не находить постоянно один и тот же ключ в string.indexOf
            keyInStringPosition++;

            // fixme: если этот if раскомментировать, то нарушится ТЗ - 100% покрытие тестами generatorMessage(),
            //  но этот if НЕЛЬЗЯ закомментировать, поскольку должен быть предохранитель от зацикливания.
            // любое число в string.indexOf меньше длины самой строки, а если вышло не так, то точно зациклились
            // if (keyInStringPosition > template.length) {
            //     throw new Error('The loop with the replacement of variables looped!');
            // }
        }
    }

    const substringResult = substringsInfoListWithKeys.map(substringInfo => {
        const {
            key,
            substring,
        } = substringInfo;

        return substring.slice(
            /* с начала строки */
            0,
            substring.length - key.length - 2/* 2 фигурные скобки от ключа - "{" "}" */,
        ) + values[key];
    }).join('');

    return substringResult + template.slice(currentSubstringLength, template.length);
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
