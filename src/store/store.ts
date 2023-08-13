'use strict';

import { create } from 'zustand';
import {
    persist,
    createJSONStorage,
    devtools,
} from 'zustand/middleware';

import MessageTemplate from "../utils/MessageTemplate/MessageTemplate";
import {immer} from "zustand/middleware/immer";
import BaseState from "../BaseState/BaseState";

const useBaseStore = create<BaseState>()(
    persist(
        immer(
            devtools((setState) => new BaseState({setState}))
        ),
        {
            name: 'storage',
        }
    )
);

export default useBaseStore;
