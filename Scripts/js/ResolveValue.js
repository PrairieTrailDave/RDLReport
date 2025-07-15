/*********************************************************************************
*
*       R e s o l v e V a l u e  - a class to resolve the value clause of RDLC
*
**********************************************************************************
*    Copyright 2025 Prairie Trail Software, Inc.
*/
// the Value clause of RDLC can have a static value, a simple value lookup into
// the given dataset, or a complex with function calls, mixing different datasets
// Thus, we need to parse the value clause and resolve it.

class resolvedToken {
    tokentype;
    value;
}

// for parsing to be able to pass back both a value and keep the pointers up to date
// use a class to hold things and pass that down.
// Javascript passes objects by a pointer which allows us to share a variable
class interpreterVariables {
    tokenptr;   // used within the interpreting of the value string
    datasets;   // pass the list of dataset definitions
    jsonData;   // pass the JSON data
    fieldsModule; // which module finds the field value
}

class tokenTypes {
    functin = 'function';
    stryng = 'string';
    numbyr = 'number';
    operaytor = 'operator';
    nayme = 'name';
    c0mma = 'comma';
}


class resolveValue {

    static operators = [
        '+', '-', '*', '/', '%', '^', '(', ')', '!'
    ];
    static separators = '.,';

    static emptyspaces = ' \t\r\n';
    static namechars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';

    // this list must be in lower case for the compare to work
    static supportedFunctions = ['first', 'fields'];  




    // this is the entry point for stand alone textboxes
    static parseValue(valueString, rDLdatasets, jsonDatasetArray) {
        var ptrStruct = new interpreterVariables;
        ptrStruct.tokenptr = 0;
        ptrStruct.datasets = rDLdatasets;
        ptrStruct.jsonData = jsonRowDataArray;
        ptrStruct.fieldsModule = this.findFieldValueInJsonData;

        return this.resolveValueString(valueString, ptrStruct);
    }

    // this is the entry point for textboxes in a table
    // the row data has only one dataset for the table
    static parseRowValue(valueString, jsonRowDataArray) {
        var ptrStruct = new interpreterVariables;
        ptrStruct.tokenptr = 0;
        //ptrStruct.datasets = rDLdatasets;
        ptrStruct.jsonData = jsonRowDataArray;
        ptrStruct.fieldsModule = this.findFieldValueInJsonRowData;

        return this.resolveValueString(valueString, ptrStruct);
    }

    static resolveValueString(valueString, ptrStruct) {
        if (valueString) {
            if (valueString.charAt(0) == '=') {
                var tokens = this.tokenize(valueString);
                var organizedtokens = this.identifyTokens(tokens);
                var retvalue = this.interpretTokens(organizedtokens, ptrStruct);
                return retvalue;
            }
            // static value, simply return the value string
            else return valueString;
        }
        // else return undefined

    }

    // this module interprets the tokens 
    static interpretTokens(organizedtokens, ptrStruct) {
        var interpretedValue = '';

        while (ptrStruct.tokenptr < organizedtokens.length) {
            var token = organizedtokens(ptrStruct.tokenptr);
            if (this.isFunction(token)) {
                var subValue = '';
                if (token.toLowerCase() == 'fields') {
                    subValue = this.resolveFields(organizedtokens, ptrStruct);
                } else {
                    subValue = this.interpretFunction(token, organizedtokens, ptrStruct);
                }
                interpretedValue = interpretedValue + subValue;
            }
        //    else (this.isOperator(token)) {

        //    }
        }
        return interpretedValue;
    }


    static isFunction(token) {
        for (var fncptr = 0; fncptr < this.supportedFunctions.length; fncptr++) {
            // if (token.localeCompare(supportedFunctions[fncptr], undefined, { sensitivity: 'accent' })) return true;
            if (token.toLowerCase() == this.supportedFunctions[fncptr]) return true;
        }
        return false;
    }

    static isOperator(token) {
        return '*/+-'.contains(token.value);
    }

    static interpretFunction(token, organizedtokens, ptrStruct) {
        var returnValue = '';


        return returnValue;
    }



    // return an array of the parameters for this function
    // The problem is that the current list of parameters may include other function calls
    // this first version assumes no embedded function calls. 
    // a later version can run recursively to support embedded function calls.
    static extractParameters(organizedtokens, ptr) {
        var functionParameters = [];    // holds the parameters for this call
        var parenCount = 0;
        while (ptr < organizedtokens.length) {
            var token = organizedtokens[ptr];
            if (token.value == '(') {
                parenCount++;
                ptr++;
                while (ptr < organizedtokens.length) {
                    if (token.value == '(') parenCount++;
                    if (token.value == ')') {
                        parenCount--;
                        if (parenCount == 0) return functionParameters;
                    }
                    functionParameters.push(token);
                    ptr++;
                }
            }
        }
    }



    // there are two different types of "datasets" passed to the value renderer
    // there is the DataSets section of the RDL which defines what fields are expected
    //   in that RDL, it is possible that the name of the field in the value clause is not the same as the database field
    //   thus we need to find the RDL field in the DataSets and get the database field name from that
    // the other dataset is in the host sent data and may include the results of multiple queries on the host side


    static resolveValueFromHostData(fldname, datasetname, rDLdatasets, jsonDatasetArray) {
        var datasetField = getDatasetField(fldname, datasetname, rDLdatasets);
        if (datasetField) {
            // a field might have a DataField indicating data from host
            // or a Value indicating a fixed value
            // and a rd:TypeName indicating a data type

            if (datasetField.DataField) {
                var databaseFieldName = datasetFields[k].DataField;
                return this.findFieldValueInJsonData(datasetname, databaseFieldName, jsonDatasetArray)
            }
            if (datasetField.Value) {
                return datasetFields[k].Value;
            }
        }
        else return '';
    }





    //static resolveValueFromTableRow(fldname, datasetname, rDLdatasets, jsonDatasetRowArray) {
    //    var datasetField = getDatasetField(fldname, datasetname, rDLdatasets);
    //    if (datasetField) {
    //        // a field might have a DataField indicating data from host
    //        // or a Value indicating a fixed value
    //        // and a rd:TypeName indicating a data type

    //        if (datasetField.DataField) {
    //            var fieldNameFromDataset = datasetField.DataField;
    //            if (jsonDatasetRowArray[fieldNameFromDataset])
    //                return jsonDatasetRowArray[fieldNameFromDataset];
    //            else return '';
    //        }
    //        if (datasetField.Value) {
    //            return datasetFields[k].Value;
    //        }
    //    }
    //    else return '';
    //}



    // need to change this so that this only returns the RDL dataset requested


    // then, goes through that 
    //static fieldValue(fldname, datasetname, datasets, jsonDatasetArray) {
    //    // look through the datasets to find this dataset
    //    if (datasets.children) {
    //        for (var i = 0; i < datasets.children.length; i++) {
    //            if (datasets.children[i].Name == datasetname) {
    //                var dataset = datasets.children[i];
    //                // look through that dataset children to find the list of fields
    //                for (var j = 0; j < dataset.children.length; j++) {
    //                    if (dataset.children[j].nodeType == 'Fields') {
    //                        // find that fieldname
    //                        var datasetFields = dataset.children[j].children;
    //                        if (datasetFields) {
    //                            for (var k = 0; k < datasetFields.length; k++) {
    //                                if (datasetFields[k].Name == fldname) {

    //                                    // a field might have a DataField indicating data from host
    //                                    // or a Value indicating a fixed value
    //                                    // and a rd:TypeName indicating a data type

    //                                    if (datasetFields[k].DataField) {
    //                                        var databaseFieldName = datasetFields[k].DataField;
    //                                        return this.findFieldValueInJsonData(datasetname, databaseFieldName, jsonDatasetArray)
    //                                    }
    //                                    if (datasetFields[k].Value) {
    //                                        return datasetFields[k].Value;
    //                                    }
    //                                }
    //                            }
    //                        }
    //                    }
    //                }
    //            }
    //        }
    //    }
    //    return '';
    //}


    static getDatasetField(fldname, datasetname, datasets) {

        // look through the datasets to find this dataset

        if (datasets.children) {
            for (var i = 0; i < datasets.children.length; i++) {
                if (datasets.children[i].Name == datasetname) {
                    var dataset = datasets.children[i];

                    // look through that dataset children to find the list of fields

                    for (var j = 0; j < dataset.children.length; j++) {
                        if (dataset.children[j].nodeType == 'Fields') {

                            // find that fieldname

                            var datasetFields = dataset.children[j].children;
                            if (datasetFields) {
                                for (var k = 0; k < datasetFields.length; k++) {
                                    if (datasetFields[k].Name == fldname) {
                                        return datasetFields[k];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // otherwise not found, return undefined
    }

    static getFieldValue(datasetField, datasetname, databaseFieldName, jsonDatasetArray) {

    }
    // the jsonData can be an array of datasets from the host
    // or simply the row of data in a table

    static findFieldValueInJsonData(datasetname, datafieldID, jsonDatasetArray) {
        if (Array.isArray(jsonDatasetArray)) {
            for (var datasetID = 0; datasetID < jsonDatasetArray.length; datasetID++) {
                var specificDataset = jsonDatasetArray[datasetID];
                if (specificDataset.name == datasetname) {
                    if (specificDataset.hostSentData) {
                        try {
                            var tDataset = specificDataset.hostSentData[datasetname];
                            if (tDataset === undefined) return 'Dataset Missing';
                        }
                        catch { return 'Dataset Missing'; }
                        try {
                            if (tDataset[datafieldID])
                                return tDataset[datafieldID];
                            else return '';
                        }
                        catch { return 'NaN'; }
                    }
                }
            }
        } else {
            try {
                if (tDataset[datafieldID])
                    return tDataset[datafieldID];
                else return '';
            }
            catch { return 'NaN'; }
        }
        return '';
    }

    static findFieldValueInJsonRowData(datasetname, datafieldID, jsonDatasetArray) {
        try {
            if (tDataset[datafieldID])
                return tDataset[datafieldID];
            else return datafieldID;
        }
        catch { return datafieldID; }
        return '';
    }


    // we need a lexical parser to properly deal with the variety of values



    static tokenize(stringOfTokens) {
        var tokenArray = [];
        var currentToken = '';
        var ptr = 0;
        while (ptr < stringOfTokens.length) {
            var ch = stringOfTokens[ptr];
            // skip empty spaces
            if (!this.emptyspaces.includes(ch)) {
                // check for a separator 
                if (this.separators.includes(ch)) {
                    if (currentToken.length > 0) {
                        tokenArray.push(currentToken);
                        currentToken = '';
                    }
                    tokenArray.push(ch);
                }
                else {
                    // check for operators and save them as well as any current token
                    if (this.operators.includes(ch) || ch == ',') {
                        if (currentToken.length > 0) {
                            tokenArray.push(currentToken);
                            currentToken = '';
                            tokenArray.push(ch);
                        }
                        else { tokenArray.push(ch); }
                    }
                    else {
                        // check for constant number - this assumes only decimal numbers
                        if ('0123456789.'.includes(ch)) {
                            currentToken = currentToken + ch;
                            ptr++;
                            // pull off the full number
                            while (ptr < stringOfTokens.length) {
                                ch = stringOfTokens[ptr];
                                if (!'0123456789.'.includes(ch)) {
                                    ptr--;
                                    break;
                                }
                                currentToken = currentToken + ch;
                                ptr++;
                            } // handle both end of parsing and end of number
                            tokenArray.push(currentToken);
                            currentToken = '';
                        }
                        // make sure this is a valid name character
                        if (this.namechars.includes(ch)) {
                            currentToken = currentToken + ch;
                            ptr++;
                            while (ptr < stringOfTokens.length) {
                                ch = stringOfTokens[ptr];
                                if (!this.namechars.includes(ch)) {
                                    ptr--;
                                    break;
                                }
                                currentToken = currentToken + ch;
                                ptr++;
                            } // handle both end of parsing and end of number
                            tokenArray.push(currentToken);
                            currentToken = '';
                        }
                        else {
                            // check for a constant string
                            if ('"' == ch) {
                                currentToken = currentToken + ch;
                                ptr++;
                                while (ptr < stringOfTokens.length) {
                                    ch = stringOfTokens[ptr++];
                                    if ('"' == ch) {
                                        ptr--;
                                        break;
                                    }
                                    else {
                                        currentToken = currentToken + ch;
                                    }
                                }// this handles both regular termination and when the string is not terminated
                                currentToken = currentToken + '"';
                                tokenArray.push(currentToken);
                                currentToken = ''; 
                            }
                        }
                    }
                }                
            }
            ptr++;
        }
        // check if we were still parsing something when end of string
        if (currentToken.length > 0) {
            tokenArray.push(currentToken);
        }
        return tokenArray;
    }

    // merge this into the tokenizer...
    // figure out which are operators, which are static values, and which are 
    static identifyTokens(tokenArray) {
        var organizedArray = [];

        var ptr = 0;
        while (ptr < tokenArray.length) {
            var token = tokenArray[ptr];
            if (this.isFunction(token)) {
                // define as function
                const otkn = new resolvedToken;
                otkn.tokentype = tokenTypes.functin;
                otkn.value = token;
                organizedArray.push(otkn);
            }
            else {// check for constant string
                if ('"' == token[0]) {
                    const stkn = new resolvedToken;
                    stkn.tokentype = tokenTypes.stryng;
                    stkn.value = token.substring(1, token.length - 2);
                    organizedArray.push(stkn);
                }
                else { // check for a constant value
                    if ('0123456789'.includes(token[0])) {
                        const ctkn = new resolvedToken;
                        ctkn.tokentype = tokenTypes.numbyr;
                        ctkn.value = token;
                        organizedArray.push(ctkn);
                    }
                    else {// identify operators
                        if (this.operators.includes(token[0])) {
                            const optkn = new resolvedToken;
                            optkn.tokentype = tokenTypes.operaytor;
                            optkn.value = token;
                            organizedArray.push(optkn);
                        }
                        else { // names  - since we already checked for number, the following works
                            if (this.namechars.includes(token[0])) {
                                const ntkn = new resolvedToken;
                                ntkn.tokentype = tokenTypes.nayme;
                                ntkn.value = token;
                                organizedArray.push(ntkn);
                            } // we could put an else clause here to trap for things not properly handled

                        }

                    }
                }
            }

            ptr++;
        }
        return organizedArray;
    }

    // reorganize the tokens
    operators = {
        '+': { precedence: 1, associativity: 'L' },
        '-': { precedence: 1, associativity: 'L' },
        '*': { precedence: 2, associativity: 'L' },
        '/': { precedence: 2, associativity: 'L' },
        '^': { precedence: 3, associativity: 'R' }
    };




    static shuttleTokens(organizedArray) {
        var shuttle = [];
        var results = [];

        var ptr = 0;
        while (ptr < organizedArray.length) {
            const token = organizedArray[ptr];

            // if number or string or variable name, simply add to output
            if (token.tokentype == tokenTypes.numbyr ||
                token.tokentype == tokenTypes.stryng ||
                token.tokentype == tokenTypes.nayme) { results.push(token); }
            else {
                // if a function, push that on the operator stack
                if (token.tokentype == tokenTypes.functin) {
                    shuttle.push(token);
                }
                else {
                    if (token.value == ',') {
                        // Function argument separator
                        while (shuttle.length && shuttle[shuttle.length - 1] !== '(') {
                            results.push(shuttle.pop());
                        }
                        if (!shuttle.length || shuttle[shuttle.length - 1] !== '(') {
                            throw new Error("Misplaced comma or mismatched parentheses");
                        }
                    }
                    else {
                        if (token.value === '(') {
                            shuttle.push(token);
                        } else if (token === ')') {
                            while (shuttle.length && shuttle[shuttle.length - 1] !== '(') {
                                results.push(shuttle.pop());
                            }
                            if (!shuttle.length) throw new Error("Mismatched parentheses");
                            shuttle.pop(); // pop '('
                            // If the next token on stack is a function, pop it to output
                            if (shuttle.length && shuttle[shuttle.length - 1].tokentype == tokenTypes.functin) {
                                results.push(shuttle.pop());
                            }
                        }

                        else
                        // if an operator, resolve precendence
                        if (token.tokentype == tokenTypes.operaytor) {
                            // Operator
                            while (
                                shuttle.length &&
                                shuttle[shuttle.length - 1].tokentype == tokenTypes.operaytor &&
                                (
                                    (operators[token.value].associativity === 'L' &&
                                        operators[token.value].precedence <= operators[shuttle[shuttle.length - 1].value].precedence) ||
                                    (operators[token.value].associativity === 'R' &&
                                        operators[token.value].precedence < operators[shuttle[shuttle.length - 1].value].precedence)
                                )
                            ) {
                                results.push(shuttle.pop());
                            }
                            shuttle.push(token);
                        }
                        else {
                            throw new Error("Confused interpreter");
                        }
                    }
                }
            }
        }
        // if there are any tokens left on the stack, move them to the results
        while (shuttle.length) {
            const op = shuttle.pop();
            if (op === '(' || op === ')') throw new Error("Mismatched parentheses");
            results.push(op);
        }

        return results;
    }
}
