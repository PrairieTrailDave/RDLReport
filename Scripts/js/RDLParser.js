/**********************************************************************
 * 
 *     R D L P a r s e r
 * 
 * The RDLParser goes through the RDL file generating the MetaData tree for the report
 * 
 */



class RDLItem {

    parseAttributes(itemToParse, rdlItem) {
        var rdlAttributes = itemToParse.attributes;
        if (rdlAttributes) {
            for (var i = 0; i < rdlAttributes.length; i++) {
                rdlItem[rdlAttributes[i].name] = rdlAttributes[i].value;
            }
        }
    }

    parseChildren(xmlString, itemToParse, rdlItem) {
        var itemChildren = itemToParse.children;
        rdlItem.children = [];
        if (itemChildren) {
            for (var j = 0; j < itemChildren.length; j++) {
                var childNode = itemChildren[j];
                // if the child node has children, continue parsing
                if (childNode.children.length > 0) {
                    rdlItem.children.push(this.parse(xmlString, childNode));
                } else {  // elevate the value into a parameter on the class
                    if (childNode.contentStart && childNode.contentEnd) {
                        if (childNode.contentStart < childNode.contentEnd) {
                            rdlItem[childNode.name] = xmlString.substring(childNode.contentStart, childNode.contentEnd);
                        }
                    }
                }
            }
        }
    }
    parseValue(xmlString, itemToParse, rdlItem) {
        if (itemToParse.contentStart && itemToParse.contentEnd) {
            if (itemToParse.contentStart < itemToParse.contentEnd) {
                rdlItem.value = xmlString.substring(itemToParse.contentStart, itemToParse.contentEnd);
            }
        }
    }
    parseName(itemToParse, rdlItem) {
        rdlItem.nodeType = itemToParse.name;
    }
    parse(xmlString, itemToParse) {
        var rdlItem = {};
        this.parseName(itemToParse, rdlItem);
        this.parseAttributes(itemToParse, rdlItem);
        this.parseChildren(xmlString, itemToParse, rdlItem);
        this.parseValue(xmlString, itemToParse, rdlItem);
        return rdlItem
    }
}


class RDLParser {
    constructor(xmlString) {
        this.parser = new xmlParser();
        this.xmlDoc = this.parser.parse(xmlString);
        this.xmlString = xmlString;         // save this for later parsing out values
    }

    //getField(fieldName) {
    //    const field = this.xmlDoc.getElementsByTagName(fieldName)[0];
    //    return field ? field.textContent : null;
    //}

    //getFields(fieldNames) {
    //    return fieldNames.reduce((fields, name) => {
    //        fields[name] = this.getField(name);
    //        return fields;
    //    }, {});
    //}

    getContent(startPtr, endPtr) {
        return this.xmlString.substring(startPtr, endPtr);
    }



    /** 
     * parse is the main entry point into parsing the RDL file
     * 
     */
    
    parse() {
        var RDLParser = new RDLItem;
        var MetaDataTree = RDLParser.parse(this.xmlString, this.xmlDoc);
//        MetaDataTree.Body = RDLParser.parse(this.xmlString, this.xmlDoc.getChild("Body"));
//        MetaDataTree.Page = RDLParser.parse(this.xmlString, this.xmlDoc.getChild("Page"));
//        MetaDataTree.DataSets = this.parseDataSets();
//        MetaDataTree.EmbeddedImages = RDLParser.parse(this.xmlString, this.xmlDoc.getChild("EmbeddedImages"));
        return MetaDataTree;
    }
}








// function to load a file from the server

async function loadFile(url) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
