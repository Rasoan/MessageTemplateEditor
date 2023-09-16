'use strict';

import * as React from "react";
import MessageTemplate from "./MessageTemplate/MessageTemplate";
import {IMessageTemplate, MESSAGE_TEMPLATE_BLOCK_TYPE} from "./MessageTemplate/types/MessageTemplate";

/*
 - (?:) - "?:" для того, что бы не сохранял скобочные группы;
 - (?!{) - что бы отбросить открывающую скобку "{" внутри скобок, что бы извлечь из "{first{lastname}name}" - "{lastname}",
 а не "{first{lastname}";
 - () = всё выражение завернули в (), что бы получить результат split ВМЕСТЕ с разделителем,
 например, мы "привет, как, дела?".split(","), что получим? - ["привет", " как", " дела?"], но мы хотим получить
 вот так - ["привет", ",", " как", ",", " дела?"] - не потерять разделитель, запятую тоже в массив докинуть хотим.
*/
export const REGEXP_FOR_FIND_KEYS_OF_VARIABLES = /({(?:\S(?!{))+?})/;

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
    const arrayOfSubstrings = template.split(REGEXP_FOR_FIND_KEYS_OF_VARIABLES);

    const substringsInfoList: {
        /** подстрока */
        substring: string;
        /** ключ (void 0 если заменять не надо) */
        key?: string;
    }[] = arrayOfSubstrings.map(substring => {
        for (const variableKey of Object.keys(values)) {
            if (`{${variableKey}}` === substring && values[variableKey] !== '') {
                return {
                    substring,
                    key: variableKey,
                }
            }
        }

        return { substring };
    });

    return substringsInfoList.map(substringInfo => {
        const {
            key,
            substring,
        } = substringInfo;

        if (key !== void 0) {
            return values[key];
        }

        return substring;
    }).join('');
}

/**
 * Записать позицию курсора при клике или нажатии на кнопку
 *
 * @param keyboardEvent_or_mouseEvent
 * @param messageTemplate
 * @param pathToIfThenElse - путь к ifThenElse
 * @param blockType
 */
export function onKeyDown_or_mouseClick<
    TI extends HTMLTextAreaElement | HTMLInputElement,
    KM extends React.MouseEvent<TI> | React.KeyboardEvent<TI>,
>(
    keyboardEvent_or_mouseEvent: KM,
    messageTemplate: MessageTemplate,
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
    pathToIfThenElse = '' as IMessageTemplate.PathToIfThenElse,
) {
    const {
        target,
    } = keyboardEvent_or_mouseEvent;
    const {
        selectionStart,
        selectionEnd,
        selectionDirection,
    } = target as TI;

    messageTemplate.setLastBlurInformation({
        pathToIfThenElse,
        cursorPosition: _calculateCursorPosition(
            selectionStart as number,
            selectionEnd as number,
            selectionDirection as SELECTION_DIRECTION,
        ),
        blockType,
    });
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

/** Разделитель для путей */
export const SEPARATOR_FOR_PATH = '/';

/**
 * Проверить, путь входит в путь, это нужно для поиска групп ifThenElse для какого-то уровня или для смещения позиции
 * группы ifThenElse в которую вклинили новый ifThenElse
 *
 * @param pathToIfThenElse - путь который возможно содержит в себе под путь
 * @param subPathInfo
 * @param subPathInfo.pathToIfThenElse - путь к искомому уровню поиска групп ifThenElse
 * @param subPathInfo.blockType - тип блока в котором ищем группы ifThenElse (если не передали, то вне зависимости от типа блока будет совпадать)
 * @param options
 * @param options.checkingSameLevel - если true - будет проверять на одноуровневость "1-1/2-2" === "1-1/2-3", "1-1/2-2" !== "1-1/2-3/3-3".
 * Если false, то просто на вложенность (по умолчанию) - "1-1/2-2" === "1-1/2-3/3-3"
 */
export function checkIsPathHasSubPath(
    pathToIfThenElse: IMessageTemplate.PathToIfThenElse,
    subPathInfo: {
        pathToIfThenElse: IMessageTemplate.PathToIfThenElse,
        blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE,
    },
    options?: {
        checkingSameLevel: boolean,
    },
) {
    const {
        checkingSameLevel,
    } = options || {};
    const {
        pathToIfThenElse: subPathInfo_pathToIfThenElse,
        blockType: subPathInfo_blockType,
    } = subPathInfo;
    const prefix = subPathInfo_pathToIfThenElse
        ? subPathInfo_pathToIfThenElse
        : ''
    ;
    /**
     * В случае, когда хотим удалить например все вложенные ifThenElse в удалённый ifThenElse,
     * мы хотим удалить все подпути вне зависимости от типа родительского блока.
     */
    const postfix = subPathInfo_blockType !== void 0
        ? `${subPathInfo_blockType}`
        : ''
    ;

    // Такого произойти не должно, а если так, то это косяк
    if (!prefix && !postfix) {
        throw new Error("Incorrect check data!");
    }

    const result = prefix && postfix
        ? `${prefix}${SEPARATOR_FOR_PATH}${postfix}`
        : `${prefix}${postfix}`
    ;
    /**
     * Регулярка проверяет, что под путь входит в путь, например:
     * 1) pathToIfThenElse === '1-2/3-444', subPathInfo === { pathToIfThenElse: '1-2', blockType: 3 }
     * Итого, '1-2/3' входит в '1-2/3-444'? Входит, ага, значит наш кандидат.
     *
     * 2) pathToIfThenElse === '1-2/5-444', subPathInfo === { pathToIfThenElse: '1-2', blockType: 3 }
     * Итого, '1-2/3' НЕ входит в '1-2/5-444'? Значит не наш кандидат, вернём false.
     */
    return new RegExp(
        '^'
        + result
        /*
          экранировали слэш обратный "\\".
          Если тип блока не передали, то не будем проверять
        */
        + `${subPathInfo_blockType ? '-\\d+': ''}`
        + `${checkingSameLevel ? '$' : ''}`
    ).test(pathToIfThenElse);
}

/**
 * Создать путь для ifThenElse
 *
 * @param positionIfThenElse - Позиция среди соседних одно уровневых ifThenElse
 * @param blockType - тип родительского блока
 * @param pathToIfThenElse - путь к родительскому ifThenElse
 * @private
 */
export function createPath(
    positionIfThenElse: number,
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
    pathToIfThenElse = '' as IMessageTemplate.PathToIfThenElse,
): IMessageTemplate.PathToIfThenElse {
    // в этот if теоретически никогда не попадём, удовлетворил TS
    if (
        blockType !== MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL
        && blockType !== MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
        && blockType !== MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
    ) {
        throw new Error(`Incorrect type of parent block for new ifThenElse! Block type - "${blockType}"`);
    }

    const prefix = pathToIfThenElse
        ? pathToIfThenElse + SEPARATOR_FOR_PATH
        : pathToIfThenElse
    ;

    return (prefix + blockType + '-' + positionIfThenElse) as IMessageTemplate.PathToIfThenElse;
}

/**
 * Получить путь к родительскому ifThenElse
 *
 * @param pathToIfThenElse
 */
export function getListParentsIfThenElseInfo(pathToIfThenElse: IMessageTemplate.PathToIfThenElse): IMessageTemplate.ParentIfThenElseInfo[] {
    const listParentsIfThenElseInfo: IMessageTemplate.ParentIfThenElseInfo[] = [];
    const subPathsToIfThenElse = pathToIfThenElse.split(SEPARATOR_FOR_PATH);

    for (let i = subPathsToIfThenElse.length; i > 0; i--) {
        const pathToIfThenElse_current =
            (subPathsToIfThenElse.join(SEPARATOR_FOR_PATH)
            || subPathsToIfThenElse.join('')) as IMessageTemplate.PathToIfThenElse
        ;

        /*
            Например, у нас есть строка с путём к ifThenElse - "1-2/2-1/3-2",
            это путь к текущему ifThenElse, но на первой позиции "этажа" находится тип блока,
            в который вложен ifThenElse, в данном примере, тип блока будет "3", а номер ifThenElse
            среди одно уровневых будет "2". Таким образом, нам нужно из строки "1-2/2-1/3-2",
            выкинуть "1-2/2-1/" взять "3" и выкинуть "-2", троечка - наш кандидат, это тип родительского блока.
        */
        const regExp_blockType =  /(\d+(?=-\d+$))/;

        if (!regExp_blockType.test(pathToIfThenElse_current)) {
            throw new Error(`Can't find parent block type, no parent! Path "${pathToIfThenElse_current}"`);
        }

        const blockType = Number(pathToIfThenElse_current.split(regExp_blockType)[1/*На 1 позиции то, что нужно*/]);

        if (
            blockType !== MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL
            && blockType !== MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
            && blockType !== MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
        ) {
            throw new Error(`Unknown parent block type! Block type - "${blockType}"`);
        }

        const regExp_position = REGEXP_FIND_LAST_NUMBER_IN_PATH;
        const [ positionIfThenElse ] = pathToIfThenElse_current.match(regExp_position) || [];

        /**
         * вытаскивает путь ifThenElse родительский '1-1/2-2' => '1-1'
         */
        const regExpPathToParentIfThenElse = /.+(?=\/\d+-\d+)/;
        /**
         * проверяет, что это последний ifThenElse '1-1' => true, '1-1/2-4' => false
         */
        const regExp_checkIsLastIfThenElse = /^\d+-\d+$/;
        const [
            pathToParentIfThenElse = '' as IMessageTemplate.PathToIfThenElse,
        ] = (pathToIfThenElse_current.match(regExpPathToParentIfThenElse) || []) as IMessageTemplate.PathToIfThenElse[];

        if (positionIfThenElse === void 0) {
            throw new Error(`Can't find position ifThenElse by path - incorrect path! Path - "${pathToIfThenElse_current}".`)
        }

        /**
         * Если пути к родительскому ifThenElse нет, но это не последний ifThenElse,
         * то это проблема, что-то пошло не так
         */
        if (!pathToParentIfThenElse && !regExp_checkIsLastIfThenElse.test(pathToIfThenElse_current)) {
            throw new Error(`Can't find path to parent ifThenElse! Path to child - ${pathToIfThenElse_current}`)
        }

        listParentsIfThenElseInfo.push({
            pathToIfThenElse: pathToParentIfThenElse,
            blockType,
            position: Number(positionIfThenElse),
            nestingLevel: subPathsToIfThenElse.length - 1,
        });

        subPathsToIfThenElse.pop();
    }

    if (listParentsIfThenElseInfo.length === 0) {
        throw new Error(`No parent of path - ${pathToIfThenElse}`);
    }

    return listParentsIfThenElseInfo.reverse();
}

/**
 * Получить информацию о родительском ifThenElse
 *
 * @param pathToIfThenElse
 */
export function getParentIfThenElseInfo(pathToIfThenElse: IMessageTemplate.PathToIfThenElse): IMessageTemplate.ParentIfThenElseInfo {
    const listParentsIfThenElseInfo = getListParentsIfThenElseInfo(pathToIfThenElse);
    const parentIfThenElseInfo = listParentsIfThenElseInfo[listParentsIfThenElseInfo.length - 1];

    if (!parentIfThenElseInfo) {
        throw new Error(`No parent ifThenElse info for path! Path - ${pathToIfThenElse}`);
    }

    return parentIfThenElseInfo;
}

/**
 * Найти последнее число в строке, например "33-234" вернёт => "234"
 */
const REGEXP_FIND_LAST_NUMBER_IN_PATH = /\d+$/;

/**
 * Изменить позицию ifThenElse в пути к ifThenElse
 *
 * @param pathToIfThenElse - путь (который мы изменим) к ifThenElse
 * @param details -
 * @param details.changedLevel - уровень на котором изменим позицию ifThenElse
 * @param details.startAt - стартовая позиция ifThenElse, с этой позиции (включительно) начинаем изменять следующий ifThenElse (пути и позиции у соседних и только пути у вложенных)
 * @param details.isIncrement - увеличить или уменьшить
 */
export function changePositionInPathToIfThenElse(
    pathToIfThenElse: IMessageTemplate.PathToIfThenElse,
    details: {
        changedLevel: number,
        startAt: number,
        isIncrement: boolean,
    },
): {
    newPosition: number,
    pathToIfThenElse: IMessageTemplate.PathToIfThenElse,
    changedLevel: number,
} {
    const {
        changedLevel,
        startAt,
        isIncrement,
    } = details;
    const detailsLog = JSON.stringify({
        pathToIfThenElse,
        changedLevel,
        isIncrement,
    });
    const regExp = REGEXP_FIND_LAST_NUMBER_IN_PATH;

    // Отрицательными они не будут, но начинаются с нуля
    if (changedLevel < 0) {
        throw new Error(`Incorrect changedLevel! Details - ${detailsLog}`);
    }

    const allSubPaths = pathToIfThenElse.split(SEPARATOR_FOR_PATH);
    const subPathTarget = allSubPaths[changedLevel];

    const [ variablePositionIfThenElseRaw ] = subPathTarget?.match(regExp) || [];

    if (!variablePositionIfThenElseRaw) {
        throw new Error(`Incorrect position! Details - ${detailsLog}`)
    }

    let variablePositionIfThenElse = Number(variablePositionIfThenElseRaw);

    // отрицательной - позиция не может быть
    if (variablePositionIfThenElse < 0 || typeof variablePositionIfThenElse !== "number") {
        throw new Error(`Incorrect position ifThenElse! Details - ${detailsLog}`);
    }

    if (startAt < 0) {
        throw new Error(`Incorrect startAt ifThenElse! Details - ${detailsLog}`);
    }

    // такой кейс тоже ошибочный, мы не можем спустить позицию ifThenElse ниже нуля
    if (
        startAt === 0
        && variablePositionIfThenElse === 0
        && isIncrement === false
    ) {
        throw new Error(`Incorrect startAt or target position ifThenElse! Details - ${detailsLog}`);
    }

    // изменять начинаем с определённой позиции
    if (variablePositionIfThenElse >= startAt) {
        if (isIncrement) {
            variablePositionIfThenElse++;
        }
        else {
            variablePositionIfThenElse--;
        }
    }

    // Изменили, но по прежнему отрицательной - позиция не может быть
    if (variablePositionIfThenElse < 0) {
        throw new Error(`Incorrect position ifThenElse! Details - ${detailsLog}`);
    }

    allSubPaths[changedLevel] = allSubPaths[changedLevel]
        .replace(regExp, String(variablePositionIfThenElse))
    ;

    return {
        pathToIfThenElse: allSubPaths.join(SEPARATOR_FOR_PATH) as IMessageTemplate.PathToIfThenElse,
        newPosition: variablePositionIfThenElse,
        changedLevel,
    };
}

/**
 * Изменить позицию ifThenElse (мутабельная функция, ifThenElse приходящий в параметрах, изменён будет)
 *
 * @param ifThenElse - ifThenElse
 * @param details -
 * @param details.changedLevel - уровень на котором изменим позицию ifThenElse
 * @param details.startAt - стартовая позиция ifThenElse, с этой позиции (включительно) начинаем изменять следующий ifThenElse (пути и позиции у соседних и только пути у вложенных)
 * @param details.isIncrement - увеличить или уменьшить
 *
 * @return - возвращает изменённый путь ifThenElse
 */
export function changePositionIfThenElse(
    ifThenElse: IMessageTemplate.IfThenElse,
    details: {
        changedLevel: number,
        startAt: number,
        isIncrement: boolean,
    }
): IMessageTemplate.PathToIfThenElse {
    const {
        changedLevel,
        startAt,
        isIncrement,
    } = details;
    // todo: Здесь же надо и подправить позиции текстовых полей, но это перфекционизм, поскольку с точки зрения функционала смысла в себе не несёт,
    //  поскольку для текстовых полей важно знать - кто после кого идёт, а то, что будет скачёк в очерёдности, это не важно,
    //  но для красоты, лучше это подравнять тоже.
    const {
        path: pathToIfThenElse,
    } = ifThenElse;
    const levelIfThenElse = pathToIfThenElse.split(SEPARATOR_FOR_PATH).length - 1/* Уровни измеряются с нуля */;
    const {
        pathToIfThenElse: pathToIfThenElse_new,
        newPosition: positionIfThenElse_new,
    } = changePositionInPathToIfThenElse(
        pathToIfThenElse,
        { changedLevel, isIncrement, startAt, }
    );

    // если уровень вложенности ifThenElse соседний с добавленным/удалённым, то изменяем не только путь, но и позицию
    if (levelIfThenElse === changedLevel) {
        ifThenElse.position = positionIfThenElse_new;
    }

    ifThenElse.path = pathToIfThenElse_new;

    return pathToIfThenElse_new;
}

/**
 * Сместить позиции всех ifThenElse, которые находились после добавленного/удалённого ifThenElse (включая вложенные по дереву)
 *
 * @param listIfThenElseInfo - все ifThenElse-ы
 * @param addedOrRemovedIfThenElseInfo
 * @param addedOrRemovedIfThenElseInfo.isAdded - если в true (добавили ifThenElse), то увеличиваем позицию на 1, если false (удалили ifThenElse), то наоборот, уменьшаем позицию на 1
 * @param addedOrRemovedIfThenElseInfo.path - путь к удалённому/добавленному ifThenElse
 */
export function movePositionListIfThenElse(
    listIfThenElseInfo: Array<[IMessageTemplate.PathToIfThenElse, IMessageTemplate.IfThenElse]>,
    addedOrRemovedIfThenElseInfo: {
        isAdded: boolean,
        path: IMessageTemplate.PathToIfThenElse,
    },
) {
    const {
        isAdded: isAddedIfThenElse,
        path: pathToIfThenElse_createdOrRemoved,
    } = addedOrRemovedIfThenElseInfo;
    const listIfThenElseInfo_new: Array<[IMessageTemplate.PathToIfThenElse, IMessageTemplate.IfThenElse]> = [];

    const {
        pathToIfThenElse: pathToParentIfThenElse_createdOrRemoved,
        blockType: parentBlockTypeIfThenElse_createdOrRemoved,
        position: positionIfThenElse_createdOrRemoved,
        nestingLevel: nestingLevel_createdOrRemoved,
    } = getParentIfThenElseInfo(pathToIfThenElse_createdOrRemoved);

    for (const [ pathToIfThenElse_current, ifThenElse_current ] of listIfThenElseInfo) {
        /** True, если является соседним ifThenElse или вложенным в соседний ifThenElse "1-1/2-2" => "1-1/2-2/3-..." => true */
        const isCurrentPathContain_createdOrDeleted = checkIsPathHasSubPath(
            pathToIfThenElse_current,
            {
                pathToIfThenElse: pathToParentIfThenElse_createdOrRemoved,
                blockType: parentBlockTypeIfThenElse_createdOrRemoved,
            },
        );

        let newPath: IMessageTemplate.PathToIfThenElse;

        if (isCurrentPathContain_createdOrDeleted) {
            newPath = changePositionIfThenElse(
                ifThenElse_current,
                {
                    isIncrement: isAddedIfThenElse,
                    startAt: positionIfThenElse_createdOrRemoved,
                    changedLevel: nestingLevel_createdOrRemoved,
                }
            );
        }
        else {
            // оставляем путь не изменённым
            newPath = pathToIfThenElse_current;
        }

        listIfThenElseInfo_new.push([ newPath, ifThenElse_current ])
    }

    return listIfThenElseInfo_new;
}

/**
 * Упорядочить список ifThenElse
 *
 * Map поддерживает очерёдность,
 * поэтому для красоты подравняем,
 * вообще, это не обязательно, но для дебага удобно когда по порядку.
 *
 * А очерёдность потерялась, потому что мы вклинили между ifThenElse новый, поэтому наводим порядок здесь.
 *
 * @param listIfThenElseInfo
 */
export function sortListIfThenElse(listIfThenElseInfo: Array<[IMessageTemplate.PathToIfThenElse, IMessageTemplate.IfThenElse]>) {
    return listIfThenElseInfo.sort(([, ifThenElseInfoFirst], [, ifThenElseInfoSecond]) => {
        return ifThenElseInfoFirst.position - ifThenElseInfoSecond.position;
    });
}