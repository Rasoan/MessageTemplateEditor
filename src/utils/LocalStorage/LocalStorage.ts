'use strict';

const _keyForStateInLocalStorage = '__keyForStateInLocalStorage__';

export default class StateLocalStorage {
    static getStateString(): string | null {
        return localStorage.getItem(_keyForStateInLocalStorage);
    }

    static setStateString(stateString: string): void {
        localStorage.setItem(_keyForStateInLocalStorage, stateString);
    }
}