'use strict';

import {
    changePositionIfThenElse,
    changePositionInPathToIfThenElse,
    checkIsPathHasSubPath,
    createPath,
    generatorMessage,
    getListParentsIfThenElseInfo,
} from "../../utils/utils";
import {IMessageTemplate, MESSAGE_TEMPLATE_BLOCK_TYPE} from "../../utils/MessageTemplate/types/MessageTemplate";

describe('utils', () => {
    describe('generatorMessage', function testGeneratorMessage() {
        it('Default case', () => {
            const message = generatorMessage(
                `Hello {firstname} {lastname}!`,
                {
                    firstname: 'Victor',
                    lastname: 'Kram',
                },
            );

            expect(message).toBe(`Hello Victor Kram!`);
        });

        it('Default case with \n', () => {
            const message = generatorMessage(
                `Hello {firstname}\n{lastname}!`,
                {
                    firstname: 'Victor',
                    lastname: 'Kram',
                },
            );

            expect(message).toBe(`Hello Victor\nKram!`);
        });

        it('empty message', () => {
            const message = generatorMessage(
                '',
                {
                    firstname: 'Victor',
                    lastname: 'Kram',
                },
            );

            expect(message).toBe('');
        });

        it('Only variables in template', () => {
            const message = generatorMessage(
                `{firstname}{lastname}`,
                {
                    firstname: 'Victor',
                    lastname: 'Kram',
                },
            );

            expect(message).toBe(`VictorKram`);
        });

        it('Empty map of variables', () => {
            const message = generatorMessage(
                'Hello {firstname} {lastname}!',
                {},
            );

            expect(message).toBe('Hello {firstname} {lastname}!');
        });

        it('Empty map of variables and not use variables', () => {
            const message = generatorMessage(
                'Hello world!',
                {},
            );

            expect(message).toBe('Hello world!');
        });

        it('Map of variables with empty variables values', () => {
            const message = generatorMessage(
                "Привет {firstname}{lastname}{company}{position}{company}{position} С уважением, Араик...",
                {
                    firstname: "",
                    lastname: "",
                    company: "",
                    position: "",
                },
            );

            expect(message).toBe("Привет {firstname}{lastname}{company}{position}{company}{position} С уважением, Араик...");
        });

        it('Empty map of variables with empty keys', () => {
            const message = generatorMessage(
                "Привет {firstname}{lastname}{company}{position}{company}{position} С уважением, Араик...",
                {
                    "": "firstname",
                    "": "lastname",
                    "": "company",
                    "": "position",
                },
            );

            expect(message).toBe("Привет {firstname}{lastname}{company}{position}{company}{position} С уважением, Араик...");
        });

        it('Two variables filled and two variables not filled', () => {
            const message = generatorMessage(
                "Привет {firstname}{lastname}{firstname}",
                {
                    "firstname": "Araik",
                    "lastname": "ого",
                    "company": "",
                    "position": ""
                },
            );

            expect(message).toBe("Привет AraikогоAraik");
        });

        it('Extra variables in map of values', () => {
            const message = generatorMessage(
                `Hello {firstname} {lastname} and 123`,
                {
                    firstname: 'Victor',
                    lastname: 'Kram',
                    ignoredVariable: 'hello',
                },
            );

            expect(message).toBe(`Hello Victor Kram and 123`);
        });

        it('Empty template', () => {
            const message = generatorMessage(
                '',
                {
                    firstname: 'firstname hello',
                    lastname: 'lastname hello',
                },
            );

            expect(message).toBe('');
        });

        it('Template with only brackets', () => {
            const message = generatorMessage(
                '{}{}',
                {
                    firstname: 'firstname hello',
                    lastname: 'lastname hello',
                },
            );

            expect(message).toBe('{}{}');
        });

        it('Template with empty brackets', () => {
            const message = generatorMessage(
                'hello {},{}world',
                {
                    firstname: 'firstname hello',
                    lastname: 'lastname hello',
                },
            );

            expect(message).toBe('hello {},{}world');
        });

        it('Empty template and empty map of values', () => {
            const message = generatorMessage(
                '',
                {},
            );

            expect(message).toBe('');
        });

        it('Template with text and brackets with space', () => {
            const message = generatorMessage(
                '{ }Hello world!{ }',
                {},
            );

            expect(message).toBe('{ }Hello world!{ }');
        });

        it('Other variables', () => {
            const message = generatorMessage(
                "{otherVariable}.Hello world! {I'm is ignored variable}",
                {},
            );

            expect(message).toBe("{otherVariable}.Hello world! {I'm is ignored variable}");
        });

        /*
         * Этот describe содержит тесты с крайними значениями и проверками ситуаций,
         * в которых мы вводим ключ одной переменной вместо значения другой переменной.
         */
        describe('cases', () => {
            it('Insert key of variable in value of other variable', () => {
                const message = generatorMessage(
                    `Hello {firstname}{lastname}!`,
                    {
                        firstname: '{lastname}',
                        lastname: 'Ольга',
                    },
                );

                expect(message).toBe(`Hello {lastname}Ольга!`);
            });

            it('Insert key of variable in value of other variable 2', () => {
                const message = generatorMessage(
                    `Hello {firstname} {lastname}!`,
                    {
                        firstname: '{lastname}',
                        lastname: 'Ольга',
                    },
                );

                expect(message).toBe(`Hello {lastname} Ольга!`);
            });

            it('Insert key of variable in value of other variable 3', () => {
                const message = generatorMessage(
                    `Hello {firstname} 12 3 {lastname}!`,
                    {
                        firstname: '{lastname}',
                        lastname: 'Ольга',
                    },
                );

                expect(message).toBe(`Hello {lastname} 12 3 Ольга!`);
            });

            it('Insert key of variable in value of other variable 4', () => {
                const message = generatorMessage(
                    `Hello {firstname} {lastname}`,
                    {
                        firstname: 'Ольга',
                        lastname: '{lastname}',
                    },
                );

                expect(message).toBe(`Hello Ольга {lastname}`);
            });

            it('Insert key of variable in value of other variable 5', () => {
                const message = generatorMessage(
                    `{firstname}{lastname}))`,
                    {
                        firstname: '{lastname}',
                        lastname: '{firstname}',
                    },
                );

                expect(message).toBe(`{lastname}{firstname}))`);
            });

            it('Insert key of variable in value of other variable 6', () => {
                const message = generatorMessage(
                    `{firstname}{lastname}`,
                    {
                        firstname: '{lastname}',
                        lastname: '{firstname}',
                    },
                );

                expect(message).toBe(`{lastname}{firstname}`);
            });

            it('Insert key of variable in value of other variable 7', () => {
                const message = generatorMessage(
                    `.{firstname}{lastname}`,
                    {
                        firstname: '{lastname}',
                        lastname: '{firstname}',
                    },
                );

                expect(message).toBe(`.{lastname}{firstname}`);
            });

            it('Insert key of variable in value of other variable 8', () => {
                const message = generatorMessage(
                    `{firstname}lastname}`,
                    {
                        firstname: '{lastname}',
                        lastname: '{firstname}',
                    },
                );

                expect(message).toBe(`{lastname}lastname}`);
            });

            it('Insert key of variable in value of other variable 9', () => {
                const message = generatorMessage(
                    `{firstname}{lastname`,
                    {
                        firstname: '{lastname}',
                        lastname: '{firstname}',
                    },
                );

                expect(message).toBe(`{lastname}{lastname`);
            });

            it('Insert key of variable in value of other variable 10', () => {
                const message = generatorMessage(
                    `{k}{l}`,
                    {
                        k: '{l}',
                        l: '{k}',
                    },
                );

                expect(message).toBe(`{l}{k}`);
            });

            it('Variable in variable', () => {
                const message = generatorMessage(
                    `{first{lastname}name}`,
                    {
                        lastname: 'Rasayan',
                    },
                );

                expect(message).toBe(`{firstRasayanname}`);
            });

            it('Variable in variable 2', () => {
                const message = generatorMessage(
                    `Привет, как дела? есть такие {интересные скобки, {firstname}, которые} тебе всё сломают)`,
                    {
                        firstname: 'Araik',
                    },
                );

                expect(message).toBe(`Привет, как дела? есть такие {интересные скобки, Araik, которые} тебе всё сломают)`);
            });

            it('Variable in variable with space', () => {
                const message = generatorMessage(
                    `Привет, как дела? есть такие {интересные скобки, {firstname }, которые} тебе всё сломают)`,
                    {
                        firstname: 'Araik',
                    },
                );

                expect(message).toBe(`Привет, как дела? есть такие {интересные скобки, {firstname }, которые} тебе всё сломают)`);
            });
        });
    });

    describe('Paths', function paths() {
        describe('checkIsPathHasSubPath', function checkIsPathHasSubPathTest() {
            it('One level', () => {
                expect(checkIsPathHasSubPath(
                    `${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-444` as IMessageTemplate.PathToIfThenElse,
                    { pathToIfThenElse: '' as IMessageTemplate.PathToIfThenElse, blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.THEN },
                ))
                    .toBeTruthy()
                ;
            });

            it('Two level', () => {
                expect(checkIsPathHasSubPath(
                    `1-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-444` as IMessageTemplate.PathToIfThenElse,
                    { pathToIfThenElse: '1-2' as IMessageTemplate.PathToIfThenElse, blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE },
                    ))
                    .toBeTruthy()
                ;
            });

            it('Three level', () => {
                expect(checkIsPathHasSubPath(
                    `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-444/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-44` as IMessageTemplate.PathToIfThenElse,
                    {
                        pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2` as IMessageTemplate.PathToIfThenElse,
                        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE,
                    },
                ))
                    .toBeTruthy()
                ;
            });

            it('Three level nested, with checkingSameLevel', () => {
                expect(checkIsPathHasSubPath(
                    `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-444/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-44` as IMessageTemplate.PathToIfThenElse,
                    {
                        pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2` as IMessageTemplate.PathToIfThenElse,
                        blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE,
                    },
                    { checkingSameLevel: true }
                ))
                    .toBeFalsy()
                ;
            });

            it('Two level no has', () => {
                expect(checkIsPathHasSubPath(
                    `1-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-444` as IMessageTemplate.PathToIfThenElse,
                    { pathToIfThenElse: '1-2' as IMessageTemplate.PathToIfThenElse, blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.THEN },
                ))
                    .toBeFalsy()
                ;
            });

            it('No block type (contain)', () => {
                expect(checkIsPathHasSubPath(
                    `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-444/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-5` as IMessageTemplate.PathToIfThenElse,
                    { pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2` as IMessageTemplate.PathToIfThenElse, blockType: void 0 },
                ))
                    .toBeTruthy()
                ;
            });

            it('No block type (identical)', () => {
                expect(checkIsPathHasSubPath(
                    `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-444` as IMessageTemplate.PathToIfThenElse,
                    { pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-444` as IMessageTemplate.PathToIfThenElse, blockType: void 0 },
                ))
                    .toBeTruthy()
                ;
            });
        });

        describe('createPath', function createPathTest() {
            it('With subPath', () => {
                expect(createPath(33, MESSAGE_TEMPLATE_BLOCK_TYPE.THEN, '1-1' as IMessageTemplate.PathToIfThenElse))
                    .toBe(`1-1/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-33`)
                ;
            });
        });


        describe('getListParentsIfThenElseInfo', function getListParentsIfThenElseInfoTest() {
            it('Throw error', () => {
                let error: Error;

                try {
                    getListParentsIfThenElseInfo(`` as IMessageTemplate.PathToIfThenElse)
                }
                catch(_error) {
                    error = _error;
                }

                expect(error).toBeDefined();
            });

            it('Nested level 0', () => {
                expect(getListParentsIfThenElseInfo(`${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2` as IMessageTemplate.PathToIfThenElse))
                    .toEqual([
                        {
                            pathToIfThenElse: ``,
                            blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL,
                            position: 2,
                            nestingLevel: 0,
                        }
                    ])
                ;
            });

            it('Nested level 1', () => {
                expect(getListParentsIfThenElseInfo(`${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-7` as IMessageTemplate.PathToIfThenElse))
                    .toEqual([
                        {
                            pathToIfThenElse: ``,
                            blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL,
                            position: 2,
                            nestingLevel: 0,
                        },
                        {
                            pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2`,
                            blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.THEN,
                            position: 7,
                            nestingLevel: 1,
                        },
                    ])
                ;
            });

            it('Nested level 3', () => {
                expect(getListParentsIfThenElseInfo(`${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-7/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-666` as IMessageTemplate.PathToIfThenElse))
                    .toEqual(
                        [
                            {
                                pathToIfThenElse: ``,
                                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL,
                                position: 2,
                                nestingLevel: 0,
                            },
                            {
                                pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2`,
                                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.THEN,
                                position: 7,
                                nestingLevel: 1,
                            },
                            {
                                pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-7`,
                                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE,
                                position: 666,
                                nestingLevel: 2,
                            },
                        ]
                    )
                ;
            });

            it('Nested level 4', () => {
                expect(getListParentsIfThenElseInfo(`${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-7/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-666/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-44` as IMessageTemplate.PathToIfThenElse))
                    .toEqual(
                        [
                            {
                                pathToIfThenElse: ``,
                                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL,
                                position: 2,
                                nestingLevel: 0,
                            },
                            {
                                pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2`,
                                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.THEN,
                                position: 7,
                                nestingLevel: 1,
                            },
                            {
                                pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-7`,
                                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE,
                                position: 666,
                                nestingLevel: 2,
                            },
                            {
                                pathToIfThenElse: `${MESSAGE_TEMPLATE_BLOCK_TYPE.INITIAL}-2/${MESSAGE_TEMPLATE_BLOCK_TYPE.THEN}-7/${MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE}-666`,
                                blockType: MESSAGE_TEMPLATE_BLOCK_TYPE.ELSE,
                                position: 44,
                                nestingLevel: 3,
                            },
                        ]
                    )
                ;
            });
        });

        describe('changePositionInPathToIfThenElse', function changePositionInPathToIfThenElseTest() {
            it('Increment', () => {
                expect(changePositionInPathToIfThenElse(
                    '1-2' as IMessageTemplate.PathToIfThenElse,
                    { isIncrement: true, startAt: 2, changedLevel: 0, },
                ))
                    .toEqual({
                        pathToIfThenElse: '1-3',
                        newPosition: 3,
                        changedLevel: 0,
                    })
                ;
            });

            it('Decrement', () => {
                expect(changePositionInPathToIfThenElse(
                    '1-2' as IMessageTemplate.PathToIfThenElse,
                    { changedLevel: 0, startAt: 2, isIncrement: false, },
                ))
                    .toEqual({
                        pathToIfThenElse: '1-1',
                        newPosition: 1,
                        changedLevel: 0,
                    })
                ;
            });

            it('Increment nestedLevel 2', () => {
                expect(changePositionInPathToIfThenElse(
                    '1-2/3-5/7-778' as IMessageTemplate.PathToIfThenElse,
                    { changedLevel: 2, startAt: 778, isIncrement: true, },
                ))
                    .toEqual({
                        pathToIfThenElse: '1-2/3-5/7-779',
                        newPosition: 779,
                        changedLevel: 2,
                    })
                ;
            });

            it('Decrement nestedLevel 2', () => {
                expect(changePositionInPathToIfThenElse(
                    '1-2/3-5/7-778' as IMessageTemplate.PathToIfThenElse,
                    { changedLevel: 2, startAt: 778, isIncrement: false, },
                ))
                    .toEqual({
                        pathToIfThenElse: '1-2/3-5/7-777',
                        newPosition: 777,
                        changedLevel: 2,
                    })
                ;
            });

            it('Increment nestedLevelBetween', () => {
                expect(changePositionInPathToIfThenElse(
                    '1-2/3-5/7-778' as IMessageTemplate.PathToIfThenElse,
                    { changedLevel: 1, startAt: 5, isIncrement: true, },
                ))
                    .toEqual({
                        pathToIfThenElse: '1-2/3-6/7-778',
                        newPosition: 6,
                        changedLevel: 1,
                    })
                ;
            });

            it('Decrement nested level between', () => {
                expect(changePositionInPathToIfThenElse(
                    '1-2/3-5/7-778' as IMessageTemplate.PathToIfThenElse,
                    { changedLevel: 1, startAt: 5, isIncrement: false, },
                ))
                    .toEqual({
                        pathToIfThenElse: '1-2/3-4/7-778',
                        newPosition: 4,
                        changedLevel: 1,
                    })
                ;
            });

            it('Error (empty path)', () => {
                let error: Error;

                try {
                    changePositionInPathToIfThenElse(
                        '' as IMessageTemplate.PathToIfThenElse,
                        { changedLevel: 0, startAt: 2, isIncrement: true, },
                    )
                }
                catch(_error) {
                    error = _error;
                }

                expect(error).toBeDefined();
            });

            it('Error (incorrect level)', () => {
                let error: Error;

                try {
                    changePositionInPathToIfThenElse(
                        '1-1/2-2' as IMessageTemplate.PathToIfThenElse,
                        { changedLevel: 2, startAt: 0, isIncrement: true, },
                    )
                }
                catch(_error) {
                    error = _error;
                }

                expect(error).toBeDefined();
            });

            it('Error (negativePosition in nesting level 2)', () => {
                let error: Error;

                try {
                    changePositionInPathToIfThenElse(
                        '1-1/2-0' as IMessageTemplate.PathToIfThenElse,
                        { changedLevel: 1, startAt: 0, isIncrement: false, },
                    )
                }
                catch(_error) {
                    error = _error;
                }

                expect(error).toBeDefined();
            });
        });

        describe('changePositionIfThenElse', function changePositionIfThenElseTest() {
            it('Increment', () => {
                const ifThenElsePartial: Partial<IMessageTemplate.IfThenElse> = {
                    path: '1-1/2-5' as IMessageTemplate.PathToIfThenElse,
                    position: 5,
                };

                changePositionIfThenElse(
                    ifThenElsePartial as IMessageTemplate.IfThenElse,
                    { isIncrement: true, changedLevel: 1, startAt: 5 },
                );

                expect(ifThenElsePartial.path).toBe('1-1/2-6');
                // и позиция тоже изменилась
                expect(ifThenElsePartial.position).toBe(6);
            });

            it('Decrement', () => {
                const ifThenElsePartial: Partial<IMessageTemplate.IfThenElse> = {
                    path: '1-1/2-4' as IMessageTemplate.PathToIfThenElse,
                    position: 5,
                };

                changePositionIfThenElse(
                    ifThenElsePartial as IMessageTemplate.IfThenElse,
                    { isIncrement: false, changedLevel: 1, startAt: 4 },
                );

                expect(ifThenElsePartial.path).toBe('1-1/2-3');
                // и позиция тоже изменилась
                expect(ifThenElsePartial.position).toBe(3);
            });

            it('Increment nested', () => {
                const ifThenElsePartial: Partial<IMessageTemplate.IfThenElse> = {
                    path: '1-1/2-5' as IMessageTemplate.PathToIfThenElse,
                    position: 5,
                };

                changePositionIfThenElse(
                    ifThenElsePartial as IMessageTemplate.IfThenElse,
                    { isIncrement: true, changedLevel: 0, startAt: 1 },
                );

                expect(ifThenElsePartial.path).toBe('1-2/2-5');
                // а позиция не изменилась
                expect(ifThenElsePartial.position).toBe(5);
            });

            it('Decrement nested', () => {
                const ifThenElsePartial: Partial<IMessageTemplate.IfThenElse> = {
                    path: '1-1/2-5' as IMessageTemplate.PathToIfThenElse,
                    position: 5,
                };

                changePositionIfThenElse(
                    ifThenElsePartial as IMessageTemplate.IfThenElse,
                    { isIncrement: false, changedLevel: 0, startAt: 1 },
                );

                expect(ifThenElsePartial.path).toBe('1-0/2-5');
                // а позиция не изменилась
                expect(ifThenElsePartial.position).toBe(5);
            });

            it('No increment (reason - early position)', () => {
                const ifThenElsePartial: Partial<IMessageTemplate.IfThenElse> = {
                    path: '1-2/2-5' as IMessageTemplate.PathToIfThenElse,
                    position: 5,
                };

                changePositionIfThenElse(
                    ifThenElsePartial as IMessageTemplate.IfThenElse,
                    { isIncrement: true, changedLevel: 1, startAt: 6 },
                );

                // не изменился путь, предыдущий удалённому/добавленному ifThenElse не трогаем
                expect(ifThenElsePartial.path).toBe('1-2/2-5');
                // не изменилась и позиция
                expect(ifThenElsePartial.position).toBe(5);
            });

            it('No increment (reason - early position nested)', () => {
                const ifThenElsePartial: Partial<IMessageTemplate.IfThenElse> = {
                    path: '1-2/2-5' as IMessageTemplate.PathToIfThenElse,
                    position: 5,
                };

                changePositionIfThenElse(
                    ifThenElsePartial as IMessageTemplate.IfThenElse,
                    { isIncrement: true, changedLevel: 0, startAt: 3 },
                );

                // не изменился путь, вложен в предыдущий с удалённым/добавленным ifThenElse
                expect(ifThenElsePartial.path).toBe('1-2/2-5');
                // не изменилась и позиция
                expect(ifThenElsePartial.position).toBe(5);
            });

            it('Error (reason - negative startAt)', () => {
                let error: Error;

                try {
                    changePositionIfThenElse(
                        {
                            path: '1-2/2-5' as IMessageTemplate.PathToIfThenElse,
                            position: 5,
                        } as IMessageTemplate.IfThenElse,
                        { isIncrement: true, changedLevel: 0, startAt: -1 },
                    )
                }
                catch(_error) {
                    error = _error;
                }

                expect(error).toBeDefined();
            });

            it('Error (reason negative result position)', () => {
                let error: Error;

                try {
                    changePositionIfThenElse(
                        {
                            path: '1-0/2-5' as IMessageTemplate.PathToIfThenElse,
                            position: 5,
                        } as IMessageTemplate.IfThenElse,
                        { changedLevel: 0, startAt: 0, isIncrement: false, },
                    )
                }
                catch(_error) {
                    error = _error;
                }

                expect(error).toBeDefined();
            });
        })
    });
});
