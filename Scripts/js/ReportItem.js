/*********************************************************************************
*
*	_ r e p o r t I t e m - a base class for report items
*
**********************************************************************************
*
*    Copyright 2025 Prairie Trail Software, Inc.
*
*    Classes inherit from this, take the MetaData and the data record sent from the host 
*    and render the data
*/

class _reportItem {
    rdlName;        // child classes put their name in this
    needsData;      // flag to indicate if factory should inject datasets into these objects
    datasets;       // place to inject datasets

    parsedChildren;
    style;

    /**
     * 
     * @param {any} RDLElement       - the current Metadata node in the RDL file
     * @param {any} topLevelObject   - the top item in the rendering (may contain extra info) 
     * @param {any} jsonDatasetArray - the data sent from the host
     * @returns new Object     - the point is to return something
     */
    render(jsonDatasetArray) {
        return this.renderChildren(jsonDatasetArray);
        //return '';  // the default action is to return an empty string which can be added to any string under construction
    }  // child classes override this


    // in the tablix, the data to use will be different each row that this item is called for
    tablixrender(jsonDataArray) { return this.tablixrenderChildren(jsonDataArray); }

    // this method is put here so that each derived class can use it
    // children can build html that needs to be encapsulated by the parent item

    renderChildren(jsonDatasetArray) {
        var result = '';
        if (this.parsedChildren) {
            for (var i = 0; i < this.parsedChildren.length; i++) {
                var possibleChild = this.parsedChildren[i];
                if (possibleChild) {
                    var childhtml = '';
                    if (possibleChild.render) {
                        childhtml = possibleChild.render(jsonDatasetArray);
                    } else
                        console.log(possibleChild.nodeType);

                    result = result + childhtml;
                }
            }
        }
        return result;
    }

    tablixrenderChildren(jsonDataArray) {
        var result = '';
        if (this.parsedChildren) {
            if (this.parsedChildren.length > 0) {
                for (var i = 0; i < this.parsedChildren.length; i++) {
                    var possibleChild = this.parsedChildren[i];
                    if (possibleChild) {
                        if (Array.isArray(possibleChild)) {
                            for (var arrayID = 0; arrayID < possibleChild.length; arrayID++) {
                                result = result + this.tablixRenderAChild(possibleChild[arrayID], jsonDataArray);
                            }
                        }
                        else result = result + this.tablixRenderAChild(possibleChild, jsonDataArray);
                    }
                }
            }
        } // may want to check the jsonDataArray to see if this is supposed to simply return the data sent down
        else { result = this.render(jsonDataArray); }
        return result;
    }
    tablixRenderAChild(possibleChild, jsonDataArray) {
        var childhtml;
        if (possibleChild.tablixrender) { childhtml = possibleChild.tablixrender(jsonDataArray); }
        else
            childhtml = possibleChild.render(possibleChild, this, jsonDataArray);
        return childhtml;
    }

    // allow the children to parse their elements
    // the children may return an array of objects needed to render the tablix

    parseChildren(RDLElement) {
        var resultArray = [];
        if (RDLElement.children) {
            if (RDLElement.children.length > 0) {
                for (var childID = 0; childID < RDLElement.children.length; childID++) {
                    var childelement = RDLElement.children[childID];
                    var childobject = createReportElement(childelement.nodeType);
                    if (childobject.parse) {
                        const resultObject = childobject.parse(childelement);
                        // save only if something was found in the parsing step
                        if (resultObject) {
                            // if a style object, save that in the style variable
                            if (childelement.nodeType == "Style") {
                                this.style = resultObject;
                            }
                            else {
                                if (Array.isArray(resultObject)) {
                                    if (resultObject.length > 0) { resultArray.push(resultObject); }
                                } else {
                                    resultArray.push(resultObject);
                                }
                            }
                        }
                    }
                }
            }
        }
        return resultArray;
    }
    parse(RDLElement) {
        var parsedArray = this.parseChildren(RDLElement);
        if (parsedArray.length == 0) this.parsedChildren = [];
        else {
            if (parsedArray.length == 1)
                this.parsedChildren = parsedArray[0];
            else
                this.parsedChildren = Array.from(parsedArray);
        }
        return this.parsedChildren; 
    }


}
