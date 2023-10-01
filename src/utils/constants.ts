'use strict';

/** Если количество вложенности блоков IF_THEN_ELSE окажется выше порога, то значит программа зациклилась (баг) */
export const MAX_RECURSION_OF_NESTED_BLOCKS = 100;