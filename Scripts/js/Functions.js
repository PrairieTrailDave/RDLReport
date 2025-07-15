/*********************************************************************************
*
*	F u n c t i o n s - a class to offer functions to values
*
**********************************************************************************
*    Copyright 2025 Prairie Trail Software, Inc.
*
*/


class Functions {

    static first(arrayofvalues) {
        if (Array.isArray(arrayofvalues)) {
            return arrayofvalues[0];
        }
        else
            return arrayofvalues;
    }

    static add(firstvalue, secondvalue) {
        return Number(firstvalue) + Number(secondvalue);
    }

    static multiply(firstvalue, secondvalue) {
        return Number(firstvalue) * Number(secondvalue);
    }
}
