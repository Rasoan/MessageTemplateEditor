'use strict';

import { generatorMessage } from "../../utils/utils";

describe('generatorMessage', () => {
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
    });
});
