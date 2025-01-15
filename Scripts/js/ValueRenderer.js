/*********************************************************************************
*
*	V a l u e     R e n d e r e r - a class to render the value
*
**********************************************************************************
*
*    This class handles the value clause of a textrun.
*    It needs to parse the clause, find the matching data element, and render it
*    It may need to perform calculations or searches to find the correct element.
*/


class ValueRenderer {

    static splitTokens(valueClause) {
        var tokens = [];
        if (valueClause) {
            var i = 0;
            var j = 0;
            while (i < valueClause.length) {
                if (chars.isNameStart(valueClause.charCodeAt(i))) {
                    j = i + 1;
                    while (chars.isNameChar(valueClause.charCodeAt(j)) && (j < valueClause.length)) {
                        j++;
                    }
                    var token = valueClause.substring(i,j);
                    tokens.push(token);
                    i = j; // j is pointing to the next char after token
                }
                else {
                    var token = valueClause.substring(i, i + 1);
                    // don't worry about spaces and quotes
                    if ((token !== ' ') && (token !== '\"')) tokens.push(token);
                    i++;
                }
            }

        }
        return tokens;
    }


    static findFieldValueInJsonData(datasetname, datafieldID, jsonData) {
        if (jsonData.hostSentData) {
            var tDataset = jsonData.hostSentData[datasetname];
            if (tDataset[datafieldID])
                return tDataset[datafieldID];
            else return '';
        }
        return '';
    }


//var dataSets = {};
//if (RDLElement) {
//    dataSets._dataSets = [];
//    var _dataset = RDLElement.getChild("DataSet");
//    if (_dataset) {
//        var ndataSet = new RDLdataSet;
//        var datasetname = _dataset.getAttribute("Name");
//        if (datasetname) { ndataSet.name = datasetname.value; }
//        ndataSet.fields = [];
//        var datafields = _dataset.getChild("Fields");
//        if (datafields) {
//            for (var i = 0; i < datafields.children.length; i++) {
//                var possibleField = datafields.children[i];
//                if (possibleField.name == "Field") {
//                    var newField = new RDLDataField;
//                    var nameAttribute = possibleField.getAttribute("Name");
//                    if (nameAttribute) { newField.name = nameAttribute.value; }
//                    var sourceDataField = possibleField.getChild("DataField");
//                    if (sourceDataField) { newField.sourceDataField = this.getContent(sourceDataField.contentStart, sourceDataField.contentEnd); }
//                    var dataformat = possibleField.getChild("rd:TypeName");
//                    if (dataformat) { newField.dataformat = this.getContent(dataformat.contentStart, dataformat.contentEnd); }
//                    var fieldValue = possibleField.getChild("Value");
//                    if (fieldValue) { newField.value = this.getContent(fieldValue.contentStart, fieldValue.contentEnd); }
//                    ndataSet.fields.push(newField);
//                }
//            }
//        }
//        dataSets._dataSets.push(ndataSet);
//    }
//}
//if (rendererClass) rendererClass.datasets = dataSets;
//return dataSets;



    static fieldValue(fldname, datasetname, datasets, jsonData) {
        // look through the datasets to find this dataset

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

                                    // a field might have a DataField indicating data from host
                                    // or a Value indicating a fixed value
                                    // and a rd:TypeName indicating a data type

                                    if (datasetFields[k].DataField) {
                                        var databaseFieldName = datasetFields[k].DataField;
                                        return this.findFieldValueInJsonData(datasetname, databaseFieldName, jsonData)
                                    }
                                    if (datasetFields[k].Value) {
                                        return datasetFields[k].Value;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    static extractFieldName(fldname) {
        var pos = fldname.lastIndexOf('.Value');
        if (pos) return fldname.substring(0, pos);
        return null;
    }
/**
 * parseValue - take the value string and return what needs to be printed
 * @param {any} valueString
 * @param { array of dataset } datasets
 * @param {any} jsonData - the data sent from the host
 */

// The value string can have both function calls and definitions of value
// Functions supported: First
    static parseValue(valueString, datasets, jsonData) {
        var flds = [];
        if (valueString) {
            // split up the value string into fields and operators
            var ptr = 0;
            flds = this.splitTokens(valueString);

            // look through the tokenized array for the Fields! item

            var i = 0;
            while (i < flds.length) {
                if (flds[i] == 'Fields') {
                    // make sure that we have enough tokens in the stream to find the value
                    if (flds.length > i + 4) {
                        var fldName = this.extractFieldName(flds[i + 2]);
                        if (fldName) {
                            var datasetname = flds[i + 4];
                            return this.fieldValue(fldName, datasetname, datasets, jsonData);
                        }
                    }
                }
                i++;
            }
        }
        return null;
    }
}
