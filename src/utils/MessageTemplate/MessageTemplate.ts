'use strict';

import {
    IfThenElseItemJSON,
    IMessageTemplate,
    MESSAGE_TEMPLATE_BLOCK_TYPE,
    MessageTemplateDTO,
    MessageTemplateJSON,
    VariableInfoDTO,
    VariableInfoJSON,
} from "./types/MessageTemplate";
import {MAX_RECURSION_OF_NESTED_BLOCKS} from "../constants";
import {
    checkIsPathHasSubPath,
    createPath,
    generatorMessage,
    getListParentsIfThenElseInfo,
    getParentIfThenElseInfo,
    movePositionListIfThenElse,
    REGEXP_FOR_FIND_KEYS_OF_VARIABLES,
    sortListIfThenElse,
} from "../utils";

/** Количество добавляемых текстовых полей (THEN + ELSE + additionalField). */
const QUANTITY_NEW_FIELDS = 3;

/** Класс, который работает с шаблоном сообщения */
export default class MessageTemplate {
    /** CallBack который вызываем что бы уведомить стейт-менеджер о том, что что-то изменилось здесь */
    private readonly _stateChangeNotify: Function;
    /** Список переменных с ключами и значениями */
    private _listVariables: Map<string, string> = new Map([
        [ 'firstname', '' ],
        [ 'lastname', '' ],
        [ 'company', '' ],
        [ 'position', '' ],
    ]);
    /** map-а с со списком ifThenElse */
    private _listIfThenElse = new Map<
        IMessageTemplate.PathToIfThenElse,
        IMessageTemplate.IfThenElse
    >();
    /** Самые верхние текстовые поля (не вложены ни куда) */
    private _messageSnippetInfoInitial: IMessageTemplate.MessageSnippetsInfo<MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL> = {
        field: {
            message: '',
            positionInResultMessage: 0,
        },
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL,
    };

    /** Информация о местонахождении курсора */
    private _lastBlurInfo: IMessageTemplate.LastBlurInfo = {
        pathToIfThenElse: '' as IMessageTemplate.PathToIfThenElse,
        cursorPosition: 0,
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL,
        version: 0,
    };

    constructor(options: IMessageTemplate.Options) {
        const {
            stateChangeNotify,
            messageTemplateJSON,
            variablesKeysList,
        } = options;

        this._stateChangeNotify = stateChangeNotify;

        if (messageTemplateJSON !== void 0) {
            const {
                listIfThenElse,
                lastBlurInfo,
                messageSnippetInfoInitial,
            } = messageTemplateJSON;

            // todo: делать это в методе DTO
            this._listIfThenElse = new Map(listIfThenElse
                .map(({ pathToIfThenElse, ifThenElse}) => {
                    return [ pathToIfThenElse, ifThenElse ];
                }))
            ;
            this._lastBlurInfo = lastBlurInfo;

            for (const ifThenElseItem of listIfThenElse) {
                const {
                    pathToIfThenElse,
                    ifThenElse,
                } = ifThenElseItem;

                this._listIfThenElse.set(pathToIfThenElse, ifThenElse);
            }

            this._messageSnippetInfoInitial = messageSnippetInfoInitial;
        }

        if (variablesKeysList) {
            this._listVariables = new Map(variablesKeysList
                .map(key => [ key, '' ]))
            ;
        }
    }

    /** Массив названий переменных */
    get variablesKeysList() {
        return [ ...this._listVariables.keys() ];
    }

    /* Это поле можно изменять только внутри, а снаружи пусть только читают */
    get lastBlurInfo() {
        return { ...this._lastBlurInfo };
    }

    /**
     * Получить значение переменной из блока переменных
     */
    public getVariableValue = (key: string, options?: { force: boolean }) => {
        const {
            force,
        } = options || {};
        const variableValue = this._listVariables.get(key);

        if (force !== void 0 && variableValue === void 0) {
            throw new Error("Can't find variable!");
        }

        return variableValue;
    }

    /**
     *
     * @param key - название переменной
     * @param value - её значение
     */
    public changeVariable = (value: string, key: string) => {
        const variable = this._listVariables.get(key);

        if (variable === void 0) {
            throw new Error("Can\'t find variable!");
        }

        this._listVariables.set(key, value);

        this._stateChangeNotify();
    }

    public clearListVariables = () => {
        for (const variableKey of this._listVariables.keys()) {
            this._listVariables.set(variableKey, '');
        }

        this._stateChangeNotify();
    }

    public insertVariableInSubMessage(variable: string) {
        const variableWithModifier = `{${variable}}`;
        const {
            _lastBlurInfo: lastBlurInfo,
        } = this;
        const {
            pathToIfThenElse: lastBlur_pathToIfThenElse,
            cursorPosition: lastBlur_cursorPosition,
            blockType: lastBlur_blockType,
        } = lastBlurInfo;

        const ifThenElse = this.getIfThenElseByPath(
            lastBlur_pathToIfThenElse,
        ) as IMessageTemplate.IfThenElse;

        /* Во всех случая кроме MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL ifThenElse должен быть определён */
        if (!ifThenElse && lastBlur_blockType !== MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL) {
            throw new Error("ifThenElse is required!");
        }

        // Если Null, то значит курсор в текстовом поле "If"
        if (lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.NULL) {
            ifThenElse.conditionalIf = insertSubstringInString(
                ifThenElse.conditionalIf,
                variableWithModifier,
                lastBlur_cursorPosition
            );
        }
        else {
            const messageSnippetInfo = lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL
                ? this._messageSnippetInfoInitial
                :  lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
                    ? ifThenElse.messageSnippetsInfoThen
                    : lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
                        ? ifThenElse.messageSnippetsInfoElse
                        : lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL
                            ? ifThenElse.messageSnippetsInfoAdditional
                            : void 0
            ;

            if (!messageSnippetInfo) {
                throw new Error("messageSnippetInfo is not defined!");
            }

            const {
                field,
            } = messageSnippetInfo;

            field.message = insertSubstringInString(
                field.message,
                variableWithModifier,
                lastBlur_cursorPosition,
            );
        }

        lastBlurInfo.cursorPosition += variableWithModifier.length;

        this._updateLastBlurVersion();
        this._stateChangeNotify();
    }

    private _updateLastBlurVersion() {
        this._lastBlurInfo.version++;
        this._stateChangeNotify();
    }

    public setLastBlurInformation(blurSnippetMessageInformation: Omit<IMessageTemplate.LastBlurInfo, 'version'>) {
        this._lastBlurInfo = {
            ...blurSnippetMessageInformation,
            // версию нельзя изменять снаружи, только изнутри и специально для выставления фокуса в поле
            version: this._lastBlurInfo.version,
        };

        this._stateChangeNotify();
    }

    /**
     * Разбить текущее поле на 2 и вставить между разбитым и новым полем новый блок IF_THEN_ELSE
     */
    public splitFieldAndInsertIfThenElse() {
        const {
            _lastBlurInfo: lastBlurInfo,
        } = this;

        if (lastBlurInfo === void 0) {
            throw new Error('Can\'t split unknown block!');
        }

        const {
            pathToIfThenElse: lastBlur_pathToIfThenElse,
            cursorPosition: lastBlur_cursorPosition,
            blockType: lastBlur_blockType,
            version: lastBlur_insertedVariablesVersion,
        } = lastBlurInfo;

        // null здесь будет только если это if
        if (lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.NULL) {
            throw new Error("Can't split field conditional field if!");
        }

        const {
            _listIfThenElse: listIfThenElse,
        } = this;

        const ifThenElse_splitTarget: void | IMessageTemplate.IfThenElse = this.getIfThenElseByPath(lastBlur_pathToIfThenElse);

        const messageSnippets_splitTarget = lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
            ? (ifThenElse_splitTarget as IMessageTemplate.IfThenElse).messageSnippetsInfoThen
            : lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
                ? (ifThenElse_splitTarget as IMessageTemplate.IfThenElse).messageSnippetsInfoElse
                : lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL
                    ? (ifThenElse_splitTarget as IMessageTemplate.IfThenElse).messageSnippetsInfoAdditional
                    : this._messageSnippetInfoInitial
        ;

        const {
            field: splitTarget_field,
        } = messageSnippets_splitTarget;

        const {
            message: splitTarget_message,
            positionInResultMessage: splitTarget_positionInResultMessage,
        } = splitTarget_field;

        let splitTarget_parentBlockType: MESSAGE_TEMPLATE_BLOCK_TYPE;
        let splitTarget_pathToParentIfThenElse_or_pathToIfThenElse: IMessageTemplate.PathToIfThenElse;

        if (lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL) {
            const parentIfThenElseInfo = getParentIfThenElseInfo(lastBlur_pathToIfThenElse);

            splitTarget_parentBlockType = parentIfThenElseInfo.blockType;
            splitTarget_pathToParentIfThenElse_or_pathToIfThenElse = parentIfThenElseInfo.pathToIfThenElse;
        }
        else {
            splitTarget_parentBlockType = lastBlur_blockType;
            splitTarget_pathToParentIfThenElse_or_pathToIfThenElse = lastBlur_pathToIfThenElse;
        }

        /** Одно уровневые ifThenElse-ы находящиеся на одном уровне с разбитым текстовым полем */
        const listIfThenElseInNestingLevel = this.getListIfThenElseInNestingLevel(
            splitTarget_parentBlockType,
            splitTarget_pathToParentIfThenElse_or_pathToIfThenElse,
        );

         /** Последний ifThenElse на текущем уровне вложенности */
         const lastIfThenElseInNestingLevel = listIfThenElseInNestingLevel[listIfThenElseInNestingLevel.length - 1/** последний */];
         /**
          * Номер позиции последнего текстового поля, которое находилось перед вставляемым ifThenElse.
          * Если выделено было дополнительное текстовое поле от ifThenElse, то последняя позиция берётся от него.
         */
         const lastPositionInResultMessageInNestingLevel = _createPositionInResultMessage(
             lastBlur_blockType,
             messageSnippets_splitTarget,
             {
                 positionLastFieldInResultMessage_nestingLevel: lastIfThenElseInNestingLevel?.messageSnippetsInfoAdditional?.field?.positionInResultMessage,
             }
         );

        // Перенумеровать позиции текстовых полей для итогового собранного сообщения
         {
             /** Все, вообще все, текстовые поля */
            const allFields = this.getAllFields();

            for (const currentField of allFields) {
                const {
                    positionInResultMessage: currentField_positionInResultMessage,
                } = currentField;

                /*
                    Поскольку поля добавились после разбитого текстового поля
                     (или после одно уровневого ifThenElse),
                     позицию предыдущих не трогаем.
                */
                if (currentField_positionInResultMessage > lastPositionInResultMessageInNestingLevel) {
                    currentField.positionInResultMessage += QUANTITY_NEW_FIELDS;
                }
            }
        }

        /* У нового ifThenElse будет следующая позиция, на 1 позже, с каждым добавленным ifThenElse length увеличивается на 1 */
        const positionIfThenElse_new = lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL
            // Но если было выделено дополнительно текстовое поле от ifThenElse, то позицию для нового ifThenElse берём от разбиваемого ifThenElse
            ? (ifThenElse_splitTarget as IMessageTemplate.IfThenElse).position + 1/* На одну позицию позже */
            : listIfThenElseInNestingLevel.length
        ;

        const blockTypeForIfThenElse_new = lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL
            ? getParentIfThenElseInfo(lastBlur_pathToIfThenElse).blockType
            : lastBlur_blockType
        ;

        const pathToIfThenElse_new = MessageTemplate.createPath(
            positionIfThenElse_new,
            blockTypeForIfThenElse_new,
            lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL
            // Если разбиваем дополнительное текстовое поле от ifThenElse, то поднимаемся на уровень выше, это одно уровневый ifThenElse, а не вложенный будет
            ? splitTarget_pathToParentIfThenElse_or_pathToIfThenElse
            : lastBlur_pathToIfThenElse,
        );

        const ifThenElse_new = _createIfThenElse(
            {
                positionIfThenElse: positionIfThenElse_new,
                // на одну позицию позже
                positionInResultMessage: lastPositionInResultMessageInNestingLevel + 1,
            },
            blockTypeForIfThenElse_new,
            // закинули вторую часть разбитого поля в дополнительное поле
            splitTarget_message.slice(lastBlur_cursorPosition),
            pathToIfThenElse_new,
        );

        /* Если добавили одно уровневый ifThenElse, то подвинем соседей */
        if (lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL) {
            this._listIfThenElse = new Map(
                sortListIfThenElse([
                    ...movePositionListIfThenElse(Array.from(this._listIfThenElse.entries()), { path: pathToIfThenElse_new, isAdded: true }),
                    // добавили новый созданный ifThenElse
                    ...new Map([[pathToIfThenElse_new, ifThenElse_new]]),
                ])
            );
        }
        else {
            this._listIfThenElse.set(pathToIfThenElse_new, ifThenElse_new);
        }

        // удалили вторую часть сообщения из разбитого поля
        splitTarget_field.message = splitTarget_message.slice(
            0/* С начала строки */,
            lastBlur_cursorPosition,
        );

        this._lastBlurInfo = {
            pathToIfThenElse: pathToIfThenElse_new,
            blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.NULL,
            cursorPosition: 0,
            version: 0,
        }

        this._updateLastBlurVersion();

        this._stateChangeNotify();
    }

    /**
     * Получить ifThenElse блок
     *
     * @param pathToIfThenElse - путь к ifThenElse блоку
     * @param options
     * @param options.force
     */
    public getIfThenElseByPath(
        pathToIfThenElse: IMessageTemplate.PathToIfThenElse,
        options?: { force?: boolean },
    ): IMessageTemplate.IfThenElse | void {
        return _getIfThenElseByPath(
            pathToIfThenElse,
            this._listIfThenElse,
            options,
        );
    }

    // /**
    //  * Получить THEN или ELSE или первый блок
    //  *
    //  * @param pathToParentBlock - путь к родительскому блоку
    //  * @param blockType - тип блока (void 0 если первый блок НЕ вложенный в ifThenElse)
    //  */
    // public getBlockInformationForce(
    //     pathToParentBlock?: IMessageTemplate.PathToIfThenElse | void,
    //     blockType?: MESSAGE_TEMPLATE_BLOCK_TYPE | void,
    // ): IMessageTemplate.MessageSnippets {
    //     if (blockType === void 0) {
    //         return this._defaultMessageSnippets;
    //     }
    //
    //     const ifThenElseBlock = this
    //         .getIfThenElse(pathToParentBlock, { force: true }) as IMessageTemplate.IfThenElseBlock
    //     ;
    //
    //     switch (blockType) {
    //         case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
    //             return ifThenElseBlock.messageSnippets_THEN;
    //         }
    //         case MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE: {
    //             return ifThenElseBlock.messageSnippets_ELSE;
    //         }
    //     }
    // }

    /**
     * Получить текст поля в которое вводим название переменной
     *
     * @param pathToIfThenElse - путь к родительскому блоку (включая родителя) (void 0 если первый ifThenElse)
     */
    public getDependencyVariableNameForce(pathToIfThenElse = '' as IMessageTemplate.PathToIfThenElse): string {
        const ifThenElseBlock: IMessageTemplate.IfThenElse = this
            .getIfThenElseByPath(pathToIfThenElse, { force: true }) as IMessageTemplate.IfThenElse
        ;

        return ifThenElseBlock.conditionalIf;
    }

    public getAllFields() {
        return Array
            .from(this._listIfThenElse.values())
            .reduce((listAllFields, currentIfThenElse) => {
                const {
                    messageSnippetsInfoThen,
                    messageSnippetsInfoElse,
                    messageSnippetsInfoAdditional,
                } = currentIfThenElse;

                listAllFields.push(
                    messageSnippetsInfoThen.field,
                    messageSnippetsInfoElse.field,
                    messageSnippetsInfoAdditional.field,
                );

                return listAllFields;
            }, [ this._messageSnippetInfoInitial.field ] as IMessageTemplate.FieldInfo[])
            .sort((prevMessageSnippet, nextMessageSnippet) => {
                    return prevMessageSnippet.positionInResultMessage - nextMessageSnippet.positionInResultMessage;
                })
            ;
    }

    /**
     * Сохранить текстового поля
     *
     * @param text - сообщение из field
     * @param blockType - тип блока
     * @param pathToIfThenElse - путь к ifThenElse
     */
    public setMessageSnippetOrVariableValue(
        text: string,
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
        /** Путь к ifThenElse */
        pathToIfThenElse = '' as IMessageTemplate.PathToIfThenElse,
    ) {
        if (blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL) {
            this._messageSnippetInfoInitial.field.message = text;
        }
        else {
            const ifThenElse = this.getIfThenElseByPath(
                pathToIfThenElse,
                { force: true }
            ) as IMessageTemplate.IfThenElse;

            switch (blockType) {
                case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
                    ifThenElse.messageSnippetsInfoThen.field.message = text;

                    break;
                }
                case MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE: {
                    ifThenElse.messageSnippetsInfoElse.field.message = text;

                    break;
                }
                case MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL: {
                    ifThenElse.messageSnippetsInfoAdditional.field.message = text;

                    break;
                }
                case MESSAGE_TEMPLATE_BLOCK_TYPE.NULL: {
                    ifThenElse.conditionalIf = text;

                    break;
                }
                default: {
                    throw new Error('Unknown block type!');
                }
            }
        }

        this._stateChangeNotify();
    }

    /**
     * Получить массив с объектами в которых информация о родительских ifThenElse
     *
     * @param path - путь к ifThenElse для которого получаем информацию
     */
    public getAllParentsIfThenElseInfoByPath(path?: IMessageTemplate.PathToIfThenElse | void) {
        // // Для первого ifThenElse будет именно так
        // if (!path) {
        //     return [];
        // }
        //
        // const allParentsBlocks = path.split('/');
        // const parentIfThenElseInfoListForChildIfThenElseBlock: IMessageTemplate.ParentIfThenElseInfoForChildIfThenElseBlock[] = [];
        //
        // for (let index = allParentsBlocks.length - 1; index >= 0; index--) {
        //     const lastParentBlockType = allParentsBlocks[index];
        //
        //     const path = allParentsBlocks.slice(0, allParentsBlocks.length - 1).join('/');
        //     const parentIfThenElseInfoForChildIfThenElseBlock: IMessageTemplate.ParentIfThenElseInfoForChildIfThenElseBlock = {
        //         // не сохраняем пустой путь, путь или void 0, или хотя бы один блок должен быть в пути
        //         path: path !== ''
        //             ? path as IMessageTemplate.PathToIfThenElse
        //             : void 0,
        //         blockType: Number(lastParentBlockType) as MESSAGE_TEMPLATE_BLOCK_TYPE,
        //     };
        //
        //     allParentsBlocks.length--;
        //     parentIfThenElseInfoListForChildIfThenElseBlock.push(parentIfThenElseInfoForChildIfThenElseBlock);
        // }
        //
        // // восстановим очередность путей
        // return parentIfThenElseInfoListForChildIfThenElseBlock.reverse();
    }

    /**
     * Получить ближайший родительский ifThenElse
     *
     * @param path - путь к ifThenElse для которого получаем информацию
     */
    public getParentIfThenElseInfoByPath(path?: IMessageTemplate.PathToIfThenElse | void) {
        // const allParentsIfThenElseInfoByPath = this.getAllParentsIfThenElseInfoByPath(path)
        //
        // // последний ifThenElse в массиве будет ближайшим родителем
        // return allParentsIfThenElseInfoByPath[allParentsIfThenElseInfoByPath.length - 1];
    }

    /**
     * Удалить ifThenElse
     *
     * @param pathToIfThenElse - путь к ifThenElse который удаляем
     */
    public deleteIfThenElse(pathToIfThenElse: IMessageTemplate.PathToIfThenElse) {
        const {
            path: pathToIfThenElse_deleted,
            position: positionIfThenElse_deleted,
            messageSnippetsInfoAdditional: messageSnippetsInfoAdditional_deleted,
        } = this.getIfThenElseByPath(
            pathToIfThenElse,
            { force: true },
        ) as IMessageTemplate.IfThenElse;

        this._listIfThenElse.delete(pathToIfThenElse);

        const {
            pathToIfThenElse: pathToParentIfThenElse_deleted,
            blockType: parentBlockTypeIfThenElse_deleted,
        } = getParentIfThenElseInfo(pathToIfThenElse_deleted);

        // Разбираемся с курсором
        {
            this._lastBlurInfo = _getLastBlurInfoAfterDeleteIfThenElse(
                this._listIfThenElse,
                this._lastBlurInfo,
                pathToIfThenElse_deleted,
                {
                    positionIfThenElse_deleted: positionIfThenElse_deleted,
                    messageSnippetInfoInitial_contentLength: this._messageSnippetInfoInitial.field.message.length,
                }
            );
        }

        // 2, 3, N.. любой ifThenElse с позицией больше нуля возвращает своё дополнительное поле в предыдущий ifThenElse
        if (positionIfThenElse_deleted > 0) {
            const listIfThenElseInDeletedLevel = this.getListIfThenElseInNestingLevel(
                parentBlockTypeIfThenElse_deleted,
                pathToParentIfThenElse_deleted,
            );

            // Если позиция удалённого ifThenElse больше нуля, то соседний ifThenElse предыдущий должен быть (хотя бы один)
            if (listIfThenElseInDeletedLevel.length === 0) {
                throw new Error("Empty list of ifThenElse!");
            }

            let isConcatenatedPrevAndNextFields = false;

            for (const currentIfThenElse of listIfThenElseInDeletedLevel) {
                // если это предыдущий ifThenElse
                if (currentIfThenElse.position === positionIfThenElse_deleted - 1) {
                    currentIfThenElse.messageSnippetsInfoAdditional.field.message = ''.concat(
                        currentIfThenElse.messageSnippetsInfoAdditional.field.message,
                        messageSnippetsInfoAdditional_deleted.field.message,
                    );

                    isConcatenatedPrevAndNextFields = true;
                }
            }

            if (!isConcatenatedPrevAndNextFields) {
                throw new Error("Fields no concatenated!");
            }
        }
        // а самый первый ifThenElse на своём уровне возвращает свой текст в родительский ifThenElse
        else if (positionIfThenElse_deleted === 0) {
            const parentIfThenElse_deleted = this.getIfThenElseByPath(
                pathToParentIfThenElse_deleted
            ) || {} as IMessageTemplate.IfThenElse;
            const messageSnippetInfoTarget = parentBlockTypeIfThenElse_deleted === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
                ? parentIfThenElse_deleted?.messageSnippetsInfoThen
                : parentBlockTypeIfThenElse_deleted === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
                    ? parentIfThenElse_deleted?.messageSnippetsInfoElse
                    // Если удалённый ifThenElse был на самом верхнем уровне вложенности, то возвращаем его текст в исходный field
                    : parentBlockTypeIfThenElse_deleted === MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL
                        ? this._messageSnippetInfoInitial
                        : void 0
            ;

            if (!messageSnippetInfoTarget) {
                throw new Error("Can't find target messageSnippetInfo!");
            }

            messageSnippetInfoTarget.field.message = ''.concat(
                messageSnippetInfoTarget.field.message,
                messageSnippetsInfoAdditional_deleted.field.message,
            );
        }

        // удалить все вложенные в удалённый ifThenElse ifThenElse-ы
        for (const pathToIfThenElse_current of this._listIfThenElse.keys()) {
            const isPathHasSubPath = checkIsPathHasSubPath(
                pathToIfThenElse_current,
                {
                    pathToIfThenElse: pathToIfThenElse_deleted,
                    // здесь мы не передаём тип блока, потому что удаляем все вложенные ifThenElse вне зависимости от типа блока
                }
            );

            if (isPathHasSubPath) {
                this._listIfThenElse.delete(pathToIfThenElse_current);
            }
        }

        // вернуть смещение ifThenElse (подравнять позиции, и позиции в путях)
        this._listIfThenElse = new Map(
            sortListIfThenElse([
                ...movePositionListIfThenElse(
                    Array.from(this._listIfThenElse.entries()),
                    { path: pathToIfThenElse_deleted, isAdded: false }
                ),
            ])
        );

        this._stateChangeNotify();
    }

    /**
    * Проверить текстовое поле на то, что последний раз курсор был именно в нём
    *
    * @param pathToIfThenElse - путь к блоку ifThenElse текстового поля
    * @param blockType - тип блока в котором находится текстовое поле
    */
    public checkIsLastBlurField(
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
        pathToIfThenElse = '' as IMessageTemplate.PathToIfThenElse,
    ): boolean {
        const {
            pathToIfThenElse: lastBlur_pathToIfThenElse,
            blockType: lastBlur_blockType,
        } = this._lastBlurInfo;

        return pathToIfThenElse === lastBlur_pathToIfThenElse
            && blockType === lastBlur_blockType
        ;
    }

    /**
     * Получить одно уровневые ifThenElse-ы для определённого уровня
     *
     * @param blockType
     * @param pathToIfThenElse
     */
    public getListIfThenElseInNestingLevel(
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
        pathToIfThenElse: IMessageTemplate.PathToIfThenElse,
    ): IMessageTemplate.IfThenElse[] {
        // для дополнительного блока не существует вложенных ifThenElse
        if (blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL) {
            throw new Error("Can't find ifThenElse's blocks in ADDITIONAL block!");
        }

        const listIfThenElseInNestingLevel = Array.from(this._listIfThenElse)
            .filter(([currentPathToIfThenElse]) => checkIsPathHasSubPath(currentPathToIfThenElse, { pathToIfThenElse, blockType }, { checkingSameLevel: true }))
            .map(([, currentIfThenElse]) => currentIfThenElse)
        ;

        // Маленькая проверка на разные длины путей, это конечно не спасёт нас на 100%, но поможет не ошибиться
        for (const ifThenElse_current of listIfThenElseInNestingLevel) {
            const {
                nestingLevel: nestingLevelIfThenElse_first,
            } = getParentIfThenElseInfo(listIfThenElseInNestingLevel[0].path);
            const {
                nestingLevel: nestingLevelIfThenElse_current,
            } = getParentIfThenElseInfo(ifThenElse_current.path);

            if (nestingLevelIfThenElse_first !== nestingLevelIfThenElse_current) {
                throw new Error(`There are different levels ifThenElse in listIfThenElseInNestingLevel! First path - "${ifThenElse_current.path}", second path - "${listIfThenElseInNestingLevel[0]?.path}"`);
            }
        }

        return listIfThenElseInNestingLevel
            .sort(({ position: prevPosition }, { position: nextPosition }) => prevPosition - nextPosition)
        ;
    }

    get previewWidget(): string {
        const filledVariablesList: string[] = [];
        const resultIfThenElseList: IMessageTemplate.IfThenElse[] = [];

        for (const [ variableKey, variableValue] of this._listVariables.entries()) {
            if (variableValue !== '') {
                filledVariablesList.push(
                    _keyToVariable(variableKey)
                );
            }
        }

        for (const currentIfThenElse of this._listIfThenElse.values()) {
            /** Здесь выставится false если ifThenElse не попадает в результирующее сообщение */
            let isIncludeInResultIfThenElse = true;
            const {
                path: pathToIfThenElse_current,
            } = currentIfThenElse;

            // если path отсутствует, то это первый ifThenElse, он точно будет в результирующем сообщении
            if (!pathToIfThenElse_current) {
                resultIfThenElseList.push(currentIfThenElse);

                continue;
            }

            const listIfThenElseInfo_parent = getListParentsIfThenElseInfo(pathToIfThenElse_current);

            for (const parentIfThenElseInfo_current of listIfThenElseInfo_parent) {
                const {
                    blockType: blockTypeParentIfThenElse_current,
                    pathToIfThenElse: pathToParentIfThenElse_current,
                    nestingLevel: nestingLevelParentIfThenElse_current,
                } = parentIfThenElseInfo_current;

                // первый ifThenElse не подлежит проверке, он безусловно попадает в результирующее сообщение
                if (nestingLevelParentIfThenElse_current === 0) {
                    continue;
                }

                const parentIfThenElse = this.getIfThenElseByPath(
                    pathToParentIfThenElse_current,
                    { force: true },
                ) as IMessageTemplate.IfThenElse;
                const {
                    conditionalIf: parentIfThenElseConditionalIf,
                } = parentIfThenElse;
                const resultBlockTypeOfParentIfThenElse = _getResultBlockTypeOfIfThenElse(
                    parentIfThenElse,
                    {
                        variablesList: Array.from(this._listVariables.keys()),
                        filledVariablesList,
                    }
                );

                if (
                    // если у родительского ifThenElse рисуется THEN
                    resultBlockTypeOfParentIfThenElse === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
                    // а текущий вложен НЕ в THEN
                    && blockTypeParentIfThenElse_current !== MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
                ) {
                    // значит этот ifThenElse выпадает
                    isIncludeInResultIfThenElse = false;
                }
                else if (
                    // если у родительского ifThenElse рисуется ELSE
                    resultBlockTypeOfParentIfThenElse === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
                    // а текущий вложен НЕ в ELSE
                    && blockTypeParentIfThenElse_current !== MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
                ) {
                    // значит этот ifThenElse выпадает
                    isIncludeInResultIfThenElse = false;
                }
                /*
                    // А иначе ничего и не будем делать, по умолчанию флаг в true и если эти условия не выполнились,
                    // значит пропускам этот ifThenElse к дальнейшим проверкам.
                    else {}
                */
            }

            if (isIncludeInResultIfThenElse) {
                resultIfThenElseList.push(currentIfThenElse);
            }
        }

        const resultBlocksOfIfThenElseList: IMessageTemplate.MessageSnippetsInfo[] = [];

        for (const currentIfThenElse of resultIfThenElseList) {
            const {
                messageSnippetsInfoThen,
                messageSnippetsInfoElse,
                messageSnippetsInfoAdditional,
            } = currentIfThenElse;

            // fixme: здесь "ошибка производительности", дело в том, что эту функцию надо вызывать ТОЛЬКО ОДИН РАЗ, а не два, тогда производительность повысится
            const resultBlockType = _getResultBlockTypeOfIfThenElse(
                currentIfThenElse,
                {
                    variablesList: Array.from(this._listVariables.keys()),
                    filledVariablesList,
                }
            );

            if (resultBlockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN) {
                resultBlocksOfIfThenElseList.push(messageSnippetsInfoThen);
            }
            else if (resultBlockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE) {
                resultBlocksOfIfThenElseList.push(messageSnippetsInfoElse);
            }
            else {
                throw new Error("Unknown block type!");
            }

            resultBlocksOfIfThenElseList.push(messageSnippetsInfoAdditional);
        }

        const resultFields: IMessageTemplate.FieldInfo[] = [
            this._messageSnippetInfoInitial,
            ...resultBlocksOfIfThenElseList,
        ].reduce((fieldsDetails, messageSnippet) => {
            const {
                field,
            } = messageSnippet;

            fieldsDetails.push(field);

            return fieldsDetails;
        }, [] as IMessageTemplate.FieldInfo[])
            .sort((fieldPrev, fieldNext) => {
                return fieldPrev.positionInResultMessage - fieldNext.positionInResultMessage
            })
        ;

        const resultString = resultFields.reduce((resultMessage, fieldDetails) => {
            return resultMessage + fieldDetails.message;
        }, '');

        return generatorMessage(resultString, Object.fromEntries(this._listVariables));
    }

    /**
     * Получить текст для текстового поля
     *
     * @param path
     * @param blockType
     */
    public getMessageSnippetOrVariableValue(
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
        path = '' as IMessageTemplate.PathToIfThenElse,
    ): string {
        if (blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL) {
            return this._messageSnippetInfoInitial.field.message;
        }
        else {
            const ifThenElse = this.getIfThenElseByPath(path, { force: true }) as IMessageTemplate.IfThenElse;

            switch (blockType) {
                case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
                    return ifThenElse.messageSnippetsInfoThen.field.message;
                }
                case MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE: {
                    return ifThenElse.messageSnippetsInfoElse.field.message;
                }
                case MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL: {
                    return ifThenElse.messageSnippetsInfoAdditional.field.message;
                }
                default: {
                    throw new Error('Unknown block type!');
                }
            }
        }
    }

    /**
     * Получить данные для блока
     *
     * @param path
     * @param blockType
     */
    public getMessageSnippetInfo(
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
        path = '' as IMessageTemplate.PathToIfThenElse,
    ): IMessageTemplate.MessageSnippetsInfo {
        if (blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL) {
            return this._messageSnippetInfoInitial;
        }
        else {
            const ifThenElse = this.getIfThenElseByPath(path, { force: true }) as IMessageTemplate.IfThenElse;

            switch (blockType) {
                case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
                    return ifThenElse.messageSnippetsInfoThen;
                }
                case MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE: {
                    return ifThenElse.messageSnippetsInfoElse;
                }
                case MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL: {
                    return ifThenElse.messageSnippetsInfoAdditional;
                }
                default: {
                    throw new Error('Unknown block type!');
                }
            }
        }
    }

    public variablesListToDTO(): IMessageTemplate.VariablesKeysList {
        return [ ...this._listVariables.keys() ];
    }

    public toJSON(): MessageTemplateJSON {
        const listIfThenElse: IfThenElseItemJSON[] = [];

        for (const [
            pathToIfThenElse,
            ifThenElse
        ] of this._listIfThenElse.entries()) {
            listIfThenElse.push({
                ifThenElse,
                pathToIfThenElse,
            });
        }

        return {
            listIfThenElse,
            messageSnippetInfoInitial: this._messageSnippetInfoInitial,
            lastBlurInfo: this._lastBlurInfo,
        }
    }

    // todo: восстановить DTO
    public toDTO(): MessageTemplateDTO {
        const messageTemplateJSON = this.toJSON();

        return messageTemplateJSON as unknown as MessageTemplateDTO;
    }

    // public toDTO(): MessageTemplateDTO {
    //     const messageTemplateJSON = this.toJSON();
    //
    //     const ifThenElseDTOList: IfThenElseBlockInfoDTO[] = [];
    //     const {
    //         ifThenElseBlockInfoListJSON,
    //         lastBlurInformation,
    //         defaultMessageSnippets,
    //     } = messageTemplateJSON;
    //
    //     for (const { key: keyIfThenElseBlock, ifThenElseBlock } of ifThenElseBlockInfoListJSON) {
    //         const ifThenElseBlockInfoDTO = new Array(IfThenElseBlockInfoDTO_Props.__SIZE__) as IfThenElseBlockInfoDTO;
    //
    //         ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.key] = keyIfThenElseBlock;
    //
    //         const ifThenElseBlockDTO = new Array(IfThenElseBlockDTO_Props.__SIZE__) as IfThenElseBlockDTO;
    //
    //         const {
    //             messageSnippets_THEN,
    //             messageSnippets_ELSE,
    //             path,
    //             conditionalIf,
    //         } = ifThenElseBlock;
    //
    //         ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_THEN] = _messageSnippetsJSONToDTO(messageSnippets_THEN);
    //         ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_ELSE] = _messageSnippetsJSONToDTO(messageSnippets_ELSE);
    //         ifThenElseBlockDTO[IfThenElseBlockDTO_Props.dependencyVariableName] = conditionalIf;
    //         ifThenElseBlockDTO[IfThenElseBlockDTO_Props.path] = path;
    //
    //         ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.ifThenElseBlockDTO] = ifThenElseBlockDTO;
    //
    //         ifThenElseDTOList.push(ifThenElseBlockInfoDTO);
    //     }
    //
    //     const messageTemplateDTO = new Array(MessageTemplateDTO_Props.__SIZE__) as MessageTemplateDTO;
    //
    //     messageTemplateDTO[MessageTemplateDTO_Props.ifThenElseDTOList] = ifThenElseDTOList;
    //     messageTemplateDTO[MessageTemplateDTO_Props.defaultMessageSnippets] = _messageSnippetsJSONToDTO(defaultMessageSnippets);
    //
    //     if (lastBlurInformation !== void 0) {
    //         const {
    //             pathToIfThenElseBlock,
    //             cursorPosition,
    //             snippetMessageInformation,
    //             insertedVariablesVersion,
    //         } = lastBlurInformation;
    //
    //         const lastBlurInformationDTO = new Array(LastBlurInformationDTO_Props.__SIZE__) as LastBlurInformationDTO;
    //
    //         if (snippetMessageInformation) {
    //             const {
    //                 fieldType,
    //                 blockType,
    //             } = snippetMessageInformation;
    //
    //             const lastBlurSnippetMessageInformationDTO = new Array(LastBlurSnippetMessageInformationDTO_Props.__SIZE__) as LastBlurSnippetMessageInformationDTO;
    //
    //             lastBlurSnippetMessageInformationDTO[LastBlurSnippetMessageInformationDTO_Props.blockType] = blockType;
    //             lastBlurSnippetMessageInformationDTO[LastBlurSnippetMessageInformationDTO_Props.fieldType] = fieldType;
    //
    //             lastBlurInformationDTO[LastBlurInformationDTO_Props.snippetMessageInformationDTO] = lastBlurSnippetMessageInformationDTO;
    //         }
    //
    //         lastBlurInformationDTO[LastBlurInformationDTO_Props.cursorPosition] = cursorPosition;
    //         lastBlurInformationDTO[LastBlurInformationDTO_Props.pathToIfThenElseBlock] = pathToIfThenElseBlock;
    //         lastBlurInformationDTO[LastBlurInformationDTO_Props.insertedVariablesVersion] = insertedVariablesVersion;
    //
    //         messageTemplateDTO[MessageTemplateDTO_Props.lastBlurSnippetMessageInformation] = lastBlurInformationDTO;
    //     }
    //
    //     return messageTemplateDTO;
    // }

    /**
     * Создать путь для ifThenElse
     *
     * @param positionIfThenElse - Позиция среди соседних одно уровневых ifThenElse
     * @param blockType - тип родительского блока
     * @param pathToIfThenElse - путь к родительскому ifThenElse
     * @private
     */
    public static createPath(
        positionIfThenElse: number,
        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
        pathToIfThenElse = '' as IMessageTemplate.PathToIfThenElse,
    ): IMessageTemplate.PathToIfThenElse {
        return createPath(
            positionIfThenElse,
            blockType,
            pathToIfThenElse,
        );
    }

    // todo: восстановить DTO
    public static fromDTO(
        messageTemplateDTO: MessageTemplateDTO,
        stateChangeNotify: Function,
        variablesKeysList: IMessageTemplate.VariablesKeysList,
    ): MessageTemplate {
        const messageTemplateJSON: MessageTemplateJSON = MessageTemplate.dtoToJSON(messageTemplateDTO);

        return new MessageTemplate({
            messageTemplateJSON,
            stateChangeNotify,
            variablesKeysList,
        });
    }
    // public static fromDTO(
    //     messageTemplateDTO: MessageTemplateDTO,
    //     stateChangeNotify: Function,
    //     variablesList: IMessageTemplate.VariablesListDTO,
    // ): MessageTemplate {
    //     const messageTemplateJSON: MessageTemplateJSON = MessageTemplate.dtoToJSON(messageTemplateDTO);
    //
    //     return new MessageTemplate({
    //         messageTemplateJSON,
    //         stateChangeNotify,
    //         variablesList,
    //     });
    // }

    // todo: восстановить DTO
    static dtoToJSON(messageTemplateDTO: MessageTemplateDTO): MessageTemplateJSON {
        return messageTemplateDTO as unknown as MessageTemplateJSON;
    }
    // static dtoToJSON(messageTemplateDTO: MessageTemplateDTO): MessageTemplateJSON {
    //     const lastBlurInformationDTO: LastBlurInformationDTO = messageTemplateDTO[MessageTemplateDTO_Props.lastBlurSnippetMessageInformation];
    //     const snippetMessageInformationDTO: LastBlurSnippetMessageInformationDTO | void = lastBlurInformationDTO[LastBlurInformationDTO_Props.snippetMessageInformationDTO];
    //
    //     return {
    //         defaultMessageSnippets: _messageSnippetsDTOtoJSON(messageTemplateDTO[MessageTemplateDTO_Props.defaultMessageSnippets]),
    //         ifThenElseBlockInfoListJSON: messageTemplateDTO[MessageTemplateDTO_Props.ifThenElseDTOList].map((ifThenElseBlockInfoDTO: IfThenElseBlockInfoDTO) => {
    //             const ifThenElseBlockDTO: IfThenElseBlockDTO = ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.ifThenElseBlockDTO];
    //
    //             return {
    //                 ifThenElseBlock: {
    //                     path: _nullToVoid0(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.path]),
    //                     conditionalIf: _normalizeString(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.dependencyVariableName]),
    //                     messageSnippets_ELSE: _messageSnippetsDTOtoJSON(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_ELSE]),
    //                     messageSnippets_THEN: _messageSnippetsDTOtoJSON(ifThenElseBlockDTO[IfThenElseBlockDTO_Props.messageSnippets_THEN]),
    //                 },
    //                 key: ifThenElseBlockInfoDTO[IfThenElseBlockInfoDTO_Props.key],
    //             };
    //         }),
    //         lastBlurInformation: {
    //             pathToIfThenElseBlock: _nullToVoid0(lastBlurInformationDTO[LastBlurInformationDTO_Props.pathToIfThenElseBlock]),
    //             cursorPosition: lastBlurInformationDTO[LastBlurInformationDTO_Props.cursorPosition],
    //             snippetMessageInformation: snippetMessageInformationDTO
    //                 ? {
    //                     fieldType: _nullToVoid0(snippetMessageInformationDTO[LastBlurSnippetMessageInformationDTO_Props.fieldType]),
    //                     blockType: _nullToVoid0(snippetMessageInformationDTO[LastBlurSnippetMessageInformationDTO_Props.blockType]),
    //                 }
    //                 : void 0,
    //             insertedVariablesVersion: lastBlurInformationDTO[LastBlurInformationDTO_Props.insertedVariablesVersion],
    //         },
    //     };
    // }

    public static checkMaxNestedIfThenElse(countNested: number) {
        if (countNested > MAX_RECURSION_OF_NESTED_BLOCKS) {
            const textError = 'Превышен порог максимальной вложенности ifThenElse друг в друга, программа зациклилась!';

            // todo: я бы сделал так, нужно поставить фиксатор на ограничение рекурсивной вложенности,
            //  но поскольку этого в ТЗ нет, ограничусь console.error.
            // throw new Error(textError);

            console.error(textError);
        }
    }
}

/**
 * THEN/ELSE или первый блок => в DTO формат
 *
 * @param messageSnippetsJSON
 */
// function _messageSnippetsJSONToDTO(messageSnippetsJSON: IMessageTemplate.MessageSnippetsInfo): MessageSnippetsDTO             {
//     const messageSnippetsDTO = new Array(MessageSnippetsDTO_Props.__SIZE__) as MessageSnippetsDTO;
//
//     const {
//         path,
//         field,
//         fieldAdditional,
//         blockType,
//     } = messageSnippetsJSON;
//
//     messageSnippetsDTO[MessageSnippetsDTO_Props.path] = path;
//     messageSnippetsDTO[MessageSnippetsDTO_Props.blockType] = blockType;
//
//     // field
//     {
//         const {
//             fieldType,
//             message,
//             positionInResultMessage,
//             isCanSplit,
//         } = field;
//         const messageFieldDetailsDTO = new Array(MessageFieldDetailsDTO_Props.__SIZE__) as MessageFieldDetailsDTO;
//
//         messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.message] = message;
//         messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.positionInResultMessage] = positionInResultMessage;
//         messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.isCanSplit] = isCanSplit;
//         messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.fieldType] = fieldType;
//
//         messageSnippetsDTO[MessageSnippetsDTO_Props.field] = messageFieldDetailsDTO;
//     }
//
//     // field additional
//     if (fieldAdditional !== void 0) {
//         const {
//             message,
//             positionInResultMessage,
//             isCanSplit,
//             fieldType,
//         } = fieldAdditional;
//         const messageFieldDetailsDTO = new Array(MessageFieldDetailsDTO_Props.__SIZE__) as MessageFieldDetailsDTO;
//
//         messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.message] = message;
//         messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.positionInResultMessage] = positionInResultMessage;
//         messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.isCanSplit] = isCanSplit;
//         messageFieldDetailsDTO[MessageFieldDetailsDTO_Props.fieldType] = fieldType;
//
//         messageSnippetsDTO[MessageSnippetsDTO_Props.fieldAdditional] = messageFieldDetailsDTO;
//     }
//
//     return messageSnippetsDTO;
// }

/**
 * THEN/ELSE или первый блок => из DTO в JSON формат
 *
 * @param messageSnippetsDTO
 */
// function _messageSnippetsDTOtoJSON(messageSnippetsDTO: MessageSnippetsDTO): IMessageTemplate.MessageSnippets {
//     const fieldDTO: MessageFieldDetailsDTO = messageSnippetsDTO[MessageSnippetsDTO_Props.field];
//     const fieldAdditionalDTO: MessageFieldDetailsDTO = messageSnippetsDTO[MessageSnippetsDTO_Props.fieldAdditional];
//     const fieldJSON: IMessageTemplate.MessageFieldDetails = {
//         fieldType: MESSAGE_TEMPLATE_FIELD_TYPE.INITIAL,
//         message: _normalizeString(fieldDTO[MessageFieldDetailsDTO_Props.message]),
//         isCanSplit: fieldDTO[MessageFieldDetailsDTO_Props.isCanSplit],
//         positionInResultMessage: fieldDTO[MessageFieldDetailsDTO_Props.positionInResultMessage],
//     };
//
//     const fieldAdditional_isCanSplit: boolean | void = (fieldAdditionalDTO || [])[MessageFieldDetailsDTO_Props.isCanSplit];
//
//     if (fieldAdditional_isCanSplit === true) {
//         throw new Error('Flag isCanSplit of fieldAdditionalDTO can\'t be true!');
//     }
//
//     return {
//         path: _nullToVoid0(messageSnippetsDTO[MessageSnippetsDTO_Props.path]),
//         blockType: _nullToVoid0(messageSnippetsDTO[MessageSnippetsDTO_Props.blockType]),
//         field: fieldJSON,
//         fieldAdditional: fieldAdditionalDTO
//             ? {
//                 fieldType: fieldAdditionalDTO[MessageFieldDetailsDTO_Props.fieldType],
//                 message: _normalizeString(fieldAdditionalDTO[MessageFieldDetailsDTO_Props.message]),
//                 isCanSplit: fieldAdditional_isCanSplit,
//                 positionInResultMessage: fieldAdditionalDTO[MessageFieldDetailsDTO_Props.positionInResultMessage],
//             }
//             : void 0,
//     }
// }

function _variablesInfoListDTOToJSON(variablesInfoListDTO: VariableInfoDTO[]): VariableInfoJSON[] {
    return variablesInfoListDTO;
}

function _variablesInfoListJSONToDTO(variablesInfoListJSON: VariableInfoJSON[]): VariableInfoDTO[] {
    return variablesInfoListJSON;
}

function insertSubstringInString(text: string, subText: string, position: number): string {
    const splitTextArray = text.split('');

    splitTextArray.splice(position, 0, subText);

    return splitTextArray.join('');
}

/**
 * Ключ переменной конвертировать в отображаемую переменную
 *
 * @param key
 */
function _keyToVariable(key: string) {
    const variable = key
        // на всякий случай избавляемся от скобочек, что бы их не задублировать случайно
        .replace('{', '')
        .replace('}', '')
    ;

    return `{${variable}}`
}

/**
 * Создать IF_THEN_ELSE блок
 *
 * @param positions
 * @param positions.positionIfThenElse - Позиция среди соседних одно уровневых ifThenElse
 * @param positions.positionInResultMessage - Номер позиции в результирующем сообщении для текстового поля в then
 * @param blockType - Тип родительского блока
 * @param messageSnippetsInfoAdditionalText - Остаточный текст от разбитого текстового поля (всё что после курсора было)
 * @param pathToIfThenElse - Путь к родительскому ifThenElse
 * @private
*/
function _createIfThenElse(
    positions: {
        positionInResultMessage: number,
        positionIfThenElse: number,
    },
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL
        | MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
        | MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE,
    messageSnippetsInfoAdditionalText: string,
    pathToIfThenElse = '' as IMessageTemplate.PathToIfThenElse,
): IMessageTemplate.IfThenElse {
    const {
        positionInResultMessage,
        positionIfThenElse,
    } = positions;

    return {
        path: pathToIfThenElse,
        conditionalIf: '',
        position: positionIfThenElse,
        messageSnippetsInfoThen: {
            blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.THEN,
            field: {
                message: '',
                positionInResultMessage,
            },
        },
        messageSnippetsInfoElse: {
            blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE,
            field: {
                message: '',
                positionInResultMessage: positionInResultMessage + 1/* Следующий - на одну позицию позже */ ,
            },
        },
        messageSnippetsInfoAdditional: {
            blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL,
            field: {
                message: messageSnippetsInfoAdditionalText,
                positionInResultMessage: positionInResultMessage + 2/* Следующий - на две позиции позже */,
            },
        },
    }
}

/**
 * Получить информацию о местонахождении курсора после удаления ifThenElse,
 * здесь заложена логика, согласно которой, после удаления такого ifThenElse, курсор найдёт своё новое текстовое поле,
 * где он окажется (если курсор был внутри удалённого или предка удалённого ifThenElse)
 *
 * @param listIfThenElse
 * @param lastBlurInfo
 * @param pathToIfThenElse_deleted
 * @param details
 * @param details.positionIfThenElse_deleted
 * @param details.messageSnippetInfoInitial_contentLength
 */
function _getLastBlurInfoAfterDeleteIfThenElse(
    listIfThenElse: Map<IMessageTemplate.PathToIfThenElse, IMessageTemplate.IfThenElse>,
    lastBlurInfo: IMessageTemplate.LastBlurInfo,
    pathToIfThenElse_deleted: IMessageTemplate.PathToIfThenElse,
    details: {
        positionIfThenElse_deleted: number,
        messageSnippetInfoInitial_contentLength: number,
    },
): IMessageTemplate.LastBlurInfo {
    const {
        positionIfThenElse_deleted,
        messageSnippetInfoInitial_contentLength,
    } = details;
    const {
        pathToIfThenElse: pathToParentIfThenElse_deleted,
        blockType: parentBlockTypeIfThenElse_deleted,
    } = getParentIfThenElseInfo(pathToIfThenElse_deleted);
    //
    const isLastBlurIfThenElseContainDeletedIfThenElse = checkIsPathHasSubPath(
        lastBlurInfo.pathToIfThenElse,
        {
            pathToIfThenElse: pathToIfThenElse_deleted,
        }
    );

    // версию курсора в любом случае обновим, что бы он обновился после нажатия по кнопку
    lastBlurInfo.version++;

    const pathToIfThenElseDeleted_prev = createPath(
        /* Взяли ifThenElse на позицию раньше */
        positionIfThenElse_deleted - 1,
        parentBlockTypeIfThenElse_deleted,
        pathToParentIfThenElse_deleted,
    );
    //
    const ifThenElseDeleted_next = _getIfThenElseByPath(pathToIfThenElse_deleted, listIfThenElse);
    const ifThenElseDeleted_parent = _getIfThenElseByPath(pathToParentIfThenElse_deleted, listIfThenElse);
    const ifThenElseDeleted_prev = _getIfThenElseByPath(pathToIfThenElseDeleted_prev, listIfThenElse);

    // 1) пытаемся воткнуть курсор в ifThenElse на той же позиции (бывший следующим после удалённого, ifThenElse, встал на место удалённого);
    if (ifThenElseDeleted_next) {
        lastBlurInfo.pathToIfThenElse = ifThenElseDeleted_next.path;
        // в текстовое поле "if"
        lastBlurInfo.blockType = MESSAGE_TEMPLATE_BLOCK_TYPE.NULL;
        lastBlurInfo.cursorPosition = _getNewCursorPositionForIfThenElse(ifThenElseDeleted_next, MESSAGE_TEMPLATE_BLOCK_TYPE.NULL);
    }
    // 2) пытаемся воткнуть в ifThenElse на позицию раньше
    else if (positionIfThenElse_deleted > 0) {
        if (!ifThenElseDeleted_prev) {
            throw new Error("Can't find ifThenElseDeleted_prev, but it is required in this case!");
        }

        lastBlurInfo.pathToIfThenElse = ifThenElseDeleted_prev.path;
        lastBlurInfo.blockType = MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL;
        lastBlurInfo.cursorPosition = _getNewCursorPositionForIfThenElse(ifThenElseDeleted_prev, MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL);
    }
    // 3) пытаемся воткнуть в ifThenElse родительский
    else if (ifThenElseDeleted_parent) {
        lastBlurInfo.pathToIfThenElse = ifThenElseDeleted_parent.path;
        // в родительский блок удалённого ifThenElse
        lastBlurInfo.blockType = parentBlockTypeIfThenElse_deleted;
        lastBlurInfo.cursorPosition = _getNewCursorPositionForIfThenElse(ifThenElseDeleted_parent, parentBlockTypeIfThenElse_deleted);
    }
    // 4) если и это не выходит, то втыкаем на худой случай в исходное поле
    else {
        lastBlurInfo.pathToIfThenElse = '' as IMessageTemplate.PathToIfThenElse;
        lastBlurInfo.blockType = MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL;
        lastBlurInfo.cursorPosition = messageSnippetInfoInitial_contentLength;
    }

    // в противном случае не изменяем lastBlurInfo и оставляем всё как было
    return lastBlurInfo;
}

function _getNewCursorPositionForIfThenElse(
    ifThenElse: IMessageTemplate.IfThenElse,
    blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
): number {
    switch (blockType) {
        case MESSAGE_TEMPLATE_BLOCK_TYPE.THEN: {
            return ifThenElse.messageSnippetsInfoThen.field.message.length;
        }
        case MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE: {
            return ifThenElse.messageSnippetsInfoElse.field.message.length;
        }
        case MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL: {
            return ifThenElse.messageSnippetsInfoAdditional.field.message.length;
        }
        case MESSAGE_TEMPLATE_BLOCK_TYPE.NULL: {
            return ifThenElse.conditionalIf.length;
        }
        default: {
            throw new Error("Unknown block type of ifThenElse!");
        }
    }
}

/**
 * Получить ifThenElse по его пути
 *
 * @param pathToIfThenElse
 * @param listIfThenElse
 * @param options
 */
function _getIfThenElseByPath(
    pathToIfThenElse: IMessageTemplate.PathToIfThenElse,
    listIfThenElse: Map<IMessageTemplate.PathToIfThenElse, IMessageTemplate.IfThenElse>,
    options?: { force?: boolean },
): IMessageTemplate.IfThenElse | void {
    const {
        force,
    } = options || {};
    const ifThenElse = listIfThenElse.get(pathToIfThenElse);

    if (force && !ifThenElse) {
        throw new Error(`Can't find ifThenElse by path - "${pathToIfThenElse}"! All paths of ifThenElse list - ${[...listIfThenElse.keys()].map(path => `"${path}"`)}`);
    }

    return ifThenElse;
}

/**
 * Получить позицию текстового сообщения (в результирующем сообщении) для блока THEN созданного ifThenElse
 *
 * @param lastBlur_blockType
 * @param messageSnippets_splitTarget
 * @param details
 */
function _createPositionInResultMessage(
    lastBlur_blockType: MESSAGE_TEMPLATE_BLOCK_TYPE,
    messageSnippets_splitTarget: IMessageTemplate.MessageSnippetsInfo,
    details: {
        positionLastFieldInResultMessage_nestingLevel?: number,
    }
): number {
    const {
        positionLastFieldInResultMessage_nestingLevel,
    } = details;
    const isNestedNewIfThenELse = lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL
        || lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.THEN
        || lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE
    ;
    const isLastBlurAdditionalBlock = lastBlur_blockType === MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL;

    if (
        // если одно уровневый ifThenElse уже хоть один был, до того как мы создали ifThenElse
        positionLastFieldInResultMessage_nestingLevel !== void 0
        // и разбили "исходный блок" или "then" или "else"
        && isNestedNewIfThenELse
    ) {
        // то значит добавляем в конец одно уровневых, новый ifThenElse
        return positionLastFieldInResultMessage_nestingLevel;
    }
    else if (
        // иначе, если разбили дополнительное текстовое поле, то вкидываем одно уровневый ifThenElse после разбитого (опционального поля ifThenElse)
        isLastBlurAdditionalBlock
        // в противном случае мы создаём первый вложенный ifThenElse
        || isNestedNewIfThenELse
    ) {
        const {
            field: {
                positionInResultMessage,
            },
            blockType: blockType_messageSnippetsSplitTarget,
        } = messageSnippets_splitTarget;

        if (isLastBlurAdditionalBlock) {
            /*
                Очень некрасивая проверка,
                но пока не придумал чего-то лучшего, но без этой проверки есть риск ошибиться
             */
            if (blockType_messageSnippetsSplitTarget !== MESSAGE_TEMPLATE_BLOCK_TYPE.ADDITIONAL) {
                throw new Error("Block type must be ADDITIONAL!");
            }
        }

        return positionInResultMessage;
    }

    // что-то пошло не так, одно из вышестоящих условий должно было выполниться
    throw new Error("Incorrect data!");
}

/**
 * Вычислить тип блок от ifThenElse, который отобразим в зависимости от значения в его текстовом поле "if"
 *
 * @param ifThenElse - проверяемый ifThenElse
 * @param variablesInfo
 */
function _getResultBlockTypeOfIfThenElse(
    ifThenElse: IMessageTemplate.IfThenElse,
    variablesInfo: {
        filledVariablesList: string[],
        variablesList: string[],
    }
): MESSAGE_TEMPLATE_BLOCK_TYPE.THEN | MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE {
    const {
        filledVariablesList,
        variablesList,
    } = variablesInfo;
    const {
        conditionalIf,
    } = ifThenElse;

    // для пустой строки в "if" у нас есть замечательный блок под название ELSE, дальше вычислять что-либо смысла нет
    if (conditionalIf === '') {
        return MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE;
    }

    const listOfSubstringsOfConditionalIf = conditionalIf.split(REGEXP_FOR_FIND_KEYS_OF_VARIABLES)
        // почистим пустые строки
        .filter(substring => substring !== '')
    ;
    /** счётчик заполненных переменных из текста из блока if */
    let countFilledVariables = 0;

    for (const substringOfConditionalIf of listOfSubstringsOfConditionalIf) {
        const isKeyOfVariable = variablesList
            .map(variableKey => _keyToVariable(variableKey))
            .includes(substringOfConditionalIf)
        ;

        // если текущая строка - ключ переменной
        if (isKeyOfVariable) {
            if (filledVariablesList.includes(substringOfConditionalIf)) {
                countFilledVariables++;
            }
        }
        // любой текст если есть в if отличающийся от переменной - значит это true
        else {
            return MESSAGE_TEMPLATE_BLOCK_TYPE.THEN;
        }
    }

    // если только заполненные переменные в If, то это true
    if (countFilledVariables === listOfSubstringsOfConditionalIf.length) {
        return MESSAGE_TEMPLATE_BLOCK_TYPE.THEN;
    }
    // иначе только переменные и среди них есть не заполненные, значит false
    else {
        return MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE;
    }
}