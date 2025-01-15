/*********************************************************************************
*
*	Report Formatting Classes
*
**********************************************************************************
*
*    These classes take the MetaData and the data record sent from the host 
*    and render the data
*/

// This supports a _very_ limited version of the RDL file format
// Each class that renders the RDL will document what the RDL specification has

var pageTopMargin = 0;
var pageLeftMargin = 0;

// while all the documentation says that the factor should be 96, 142 works better
// with that value, then the positions work and we don't need any margins added in
var pixelConversionFactor = 143;

function AddInTopMargin(str) {
    var position = Number(str.substring(0, str.length - 2));
    var units = str.substring(str.length - 2, str.length);
    var newpos = position + pageTopMargin;
    return newpos + units;
}
function AddInLeftMargin(str) {
    var position = Number(str.substring(0, str.length - 2));
    var units = str.substring(str.length - 2, str.length);
    var newpos = position + pageLeftMargin;
    return newpos + units;
}

function ConvertToPixels(str) {
    var position = Number(str.substring(0, str.length - 2));
    var units = str.substring(str.length - 2, str.length);
    var newpos = Math.round(position * pixelConversionFactor);
    return newpos + "px";
}

/** Data Set operations
 * The TextRun can have a value of "Fields!<datafieldID>"
 * The DataSet can have a Fields object containing a number of Field objects
 * The Field object has Name matching the datafieldID.
 * The Field object has a DataField with the value of the JSON field sent from the host
 * The Field object can have an rd:TypeName indicating the format of that JSON field
 */

function convertBase64ToImage(base64String, imageType = "image/jpeg") {
    const img = new Image();
    img.src = `data:${imageType};base64,${base64String}`;
    return img;
}

function createHtmlFragment(htmlStr) {
    var frag = document.createDocumentFragment(),
        temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }
    return frag;
}



/**
 *  _reportItem
 * 
 *  The base class for rendering objects.
 *  
 */

class _reportItem {
    rdlName;      // child classes put their name in this
    /**
     * 
     * @param {any} whereToPutReport  - the DOM object that will display the report
     * @param {any} RDLElement - the current Metadata node in the RDL file
     * @param {any} datasets   - the datasets 
     * @param {any} jsonData   - the data sent from the host
     * @returns new Object     - the point is to return something
     */
    render(whereToPutReport, RDLElement, datasets, jsonData) {
        return '';  // the default action is to return an empty string which can be added to any string under construction
    }  // child classes override this

}

// class to apply the style to a DOM object
class _styleObject {
    apply(DOMObject, stylesToApply) {

    }
}

/**
 * _textRunStyleObject actually applies the style to a text run object
 */
class _textRunStyleObject extends _styleObject {
    //TextAlign;      // must be "left", "right", "center"
    //TextDecoration; // must be "underline" or "none"
    //FontFamily;
    //FontSize;       // default is 10pt. max is 200pt
    //FontStyle;      // must be "normal" or "italic"
    //FontWeight;     // must be "normal" or "bold" (css font weight 800)
    //Format;         // must be a string
    apply(DOMObject, stylesToApply) {

    }
}
class _pageStyleObject extends _styleObject {
    apply(DOMObject, stylesToApply, topLevelObject) {

        if (stylesToApply.children.length > 0) {
            for (var i = 0; i < stylesToApply.children.length; i++) {
                var tChild = stylesToApply.children[i];
                if (tChild.nodeType == 'BackgroundImage') {
                    var imageID = tChild.Value;
                    // get the image to embed
                    if (imageID) {
                        var embeddedImage = topLevelObject.getEmbeddedImage(imageID);
                        if (embeddedImage) {
                            var newImg = convertBase64ToImage(embeddedImage.ImageData);
                            DOMObject.appendChild(newImg);
                            var imgObj = DOMObject.lastElementChild;
                            imgObj.alt = 'background image';
                            imgObj.style.position = "absolute";
                            imgObj.style.Top = "1px";
                        }
                    }
                }
            }
        }
    }
}

/**
 * _style parses the RDL style item into action parameters that can be applied.
 * 
 * To add the handling of a RDL style, have to add the parsing and the apply steps
 * 
 */
class _style extends _reportItem {
    //    BackgroundColor;
    //    BackgroundGradientEndColor;
    //    BackgroundGradient;
    //    BackgroundHatchType;
    //    BackgroundImage;
    //    Border;
    //    BorderColor;
    //    BorderStyle;
    //    BorderWidth;
    //    BottomBorder;
    //    Calendar;
    //    Color;
    //    CurrencyLanguage;
    //    Direction;
    //    FontFamily
    //    FontSize;
    //    FontStyle;
    //    FontWeight;
    //    Format;
    //    Language;
    //    LeftBorder;
    //    LineHeight;
    //    NumeralLanguage;
    //    NumeralVariant;
    //    PaddingBottom;
    //    PaddingLeft;
    //    PaddingRight;
    //    PaddingTop;
    //    RightBorder;
    //    ShadowColor;
    //    ShadowOffset;
    //    TextAlign;
    //    TextDecoration;
    //    TextEffect;
    //    TopBorder;
    //    UnicodeBiDi;
    //    VerticalAlign;
    //    WritingMode;
    constructor() { super(); this.rdlName = 'Style'; }
    // we need to move attributes from the RDL Element to the style object so that this style can be used later
    render(whereToPutReport, RDLElement, topLevelObject, jsonData) {
        var styleObject = new _styleObject;
        if (RDLElement.Format) { styleObject.format = RDLElement.Format; }
        if (RDLElement.PaddingTop) { styleObject.paddingTop = RDLElement.PaddingTop; }
        if (RDLElement.PaddingLeft) { styleObject.paddingLeft = RDLElement.PaddingLeft; }
        if (RDLElement.PaddingRight) { styleObject.paddingRight = RDLElement.PaddingRight; }
        if (RDLElement.PaddingBottom) { styleObject.paddingBottom = RDLElement.PaddingBottom; }
        if (RDLElement.TextDecoration) { styleObject.textDecoration = RDLElement.TextDecoration; }
        if (RDLElement.TextAlign) { styleObject.textAlign = RDLElement.TextAlign; }

        if (RDLElement.children) {
            for (var i = 0; i < RDLElement.children.length; i++) {
                var child = RDLElement.children[i];
                if (child.nodeType == 'Border') { styleObject.border = child.Style; }
                if (child.nodeType == 'BackgroundImage') { styleObject.backgroundImage = child.Value; }
            }
        }
        return styleObject;
    }

}

// because TextRun is a subitem to TextBox, return the string value
class _textRun extends _reportItem {
    // ActionInfo
    // Label
    // MarkupType
    // Style
    // ToolTip
    // Value
    // Value.DataType
    // Value.EvaulationMode
    constructor() { super(); this.rdlName = 'TextRun'; }

    renderStyle(style) {
        if (style.FontSize) {
            // convert pt to px 
            var fontSize = style.FontSize;
            if (fontSize) {
                var fontpt = fontSize.substring(0, fontSize.length - 2);
                var fontpx = Math.round((Number(fontpt) * 4) / 3);
                return 'font-size: ' + fontpx + 'px';
            }
        }
    }
    render(whereToPutReport, RDLElement, topLevelObject, jsonData) {
        var datasets = topLevelObject.DataSets;
        if (datasets) {
            if (RDLElement.Value) {
                var fldValue = ValueRenderer.parseValue(RDLElement.Value, datasets, jsonData);

                // check for any style on this text
                if (RDLElement.children) {
                    for (var i = 0; i < RDLElement.children.length; i++) {
                        if (RDLElement.children[i].nodeType == 'Style') {
                            fldValue = '<div style="' + this.renderStyle(RDLElement.children[i]) + '">' + fldValue + '</div>';
                        }
                    }
                }
                else {
                    fldValue = '<div>' + fldValue + '</div>';
                }
                return fldValue;
            }
        }
        return '';
    }
}

class _textBox extends _reportItem {
    // TextBox
    //    Name
    //    Style
    //    ActionInfo
    //    CanScrollVertically
    //    CustomProperties
    //    DataElementName
    //    DataElementOutput
    //    DocumentMapLabel
    //    Height
    //    Left
    //    RepeatWith
    //    ToolTip
    //    Top
    //    Visibility
    //    Width
    //    ZIndex
    //    CanGrow
    //    CanShrink
    //    DataElementStyle
    //    HideDuplicates
    //    KeepTogether
    //    Paragraphs
    //    ToggleImage
    //    UserSort
    //    Value
    //    rd:DefaultName  - this is not in the specification, but occurs in RDL files
    constructor() { super(); this.rdlName = 'Textbox'; }

    renderChildren(whereToPutReport, RDLElement, topLevelObject, jsonData) {
        var results = '';
        var tChildren = RDLElement.children;
        if (tChildren) {
            for (var i = 0; i < tChildren.length; i++) {
                var possibleChild = tChildren[i];
                if (possibleChild) {
                    var renderer = createReportElement(possibleChild.nodeType);
                    results = results + renderer.render(whereToPutReport, possibleChild, topLevelObject, jsonData);
                    results = results + this.renderChildren(whereToPutReport, possibleChild, topLevelObject, jsonData);
                }
            }
        }
        return results;
    }
    renderStyle(style) { return ''; }
    // The textbox determines where the data will be shown and TextRun gets the data
    // To display everything, this needs to render all the children and then place them.
    render(whereToPutReport, RDLElement, topLevelObject, jsonData) {
        var textBoxData = this.renderChildren(whereToPutReport, RDLElement, topLevelObject, jsonData);
        var style = '';
        // get textbox location
        if (RDLElement.Top) {
            style = style + 'position: absolute; top:' + ConvertToPixels(AddInTopMargin(RDLElement.Top));
        }
        if (RDLElement.Left) {
            style = style + '; left:' + ConvertToPixels(AddInLeftMargin(RDLElement.Left));
        }
        // check for any formatting
        if (RDLElement.Style) {
            style = style + this.renderStyle(RDLElement.Style);
        }
        if (style.length > 0) { style = ' style="' + style + '"' }


        // build html to render the string
        var textboxHtml = '<div' + style + '>' + textBoxData + '</div>';

        // add the textbox to the screen
        whereToPutReport.insertAdjacentHTML('beforeend', textboxHtml);
        return '';
    }

}

class _embeddedImage extends _reportItem {
    imageData;
    mimetype;   // must be "image/jpeg", "image/gif", "image/png"
    name;
    constructor() { super(); this.rdlName = 'EmbeddedImage'; }
    render(whereToPutReport, RDLElement, topLevelObject, jsonData) {
        return new Object;
    }

}


// this needs the full RDL tree in order to find the embedded image
class _body extends _reportItem {
    // Body
    //   ReportItems
    //   Height
    //   Style
    constructor() { super(); this.rdlName = 'Body'; }
    render(whereToPutReport, RDLElement, topLevelObject, jsonData) {
        if (RDLElement.children) {
            // look for a style element prior to rendering other children
            for (var i = 0; i < RDLElement.children.length; i++) {
                var tChild = RDLElement.children[i];
                if (tChild.nodeType == "Style") {
                    // apply the styles selected and background image
                    var bodyStyle = new _pageStyleObject();
                    bodyStyle.apply(whereToPutReport, tChild, topLevelObject);
                }
            }
            // render other children

        }
    }
}

// the problem with this class is that it is executed after rendering the report items.
// yet, we need to know the margins while rendering the text runs
class _page extends _reportItem {
    constructor() { super(); this.rdlName = "Page"; }
    render(whereToPutReport, rdlPage) {
        if (rdlPage.TopMargin) {
            //pageTopMargin = rdlPage.TopMargin;
        }


    }
}


// factory for creating elements


var reportElements = new Array();
reportElements.push(new _textRun);
reportElements.push(new _textBox);
reportElements.push(new _body);
reportElements.push(new _embeddedImage);
function createReportElement(elementName) {
    var arrayLength = reportElements.length;
    for (var i = 0; i < arrayLength; i++) {
        var testElem = reportElements[i];
        if (elementName == testElem.rdlName) return testElem;
    }
    return new _reportItem;  // if nothing found, return a null acting item
}

// testing of this factory


/*
var testFactoryVar = createReportElement('EmbeddedImage');
if (!testFactoryVar) console.log('didnt make class');
if (testFactoryVar instanceof _embeddedImage) console.log('created instance of embeddedImage');
*/


// in order to have a pre-render step, build a list of objects that parse the pre-render aspects of this element
class pre_reportItem {
    rdlName;      // child classes put their name in this
    /**
     * 
     * @param {any} rendererClass  - the renderer class that will render the report
     * @param {any} RDLElement - the current Metadata node in the RDL file
     * @returns new Object     - the point is to return something
     */
    parse(rendererClass, RDLElement) {
        return new Object;
    }  // child classes override this
}



class RDLDataField {
    name;
    sourceDataField;
    dataformat;  // must be "String", "Boolean", "DateTime", "Integer", "Float"
    // but the first RDL I parsed had "System:Decimal"
    value;       // this field can contain a formula that will be interpreted
    aggregateindicatorfield; // a reference to another field which is boolean whether to aggregate this field in this row
}


class RDLdataSet {
    name;
    query;
    fields;
    datasetinfo;
}


class pre_Datasets extends pre_reportItem {
    constructor() { super(); this.rdlName = 'DataSets'; }

    /**
     * parseDataSets
     *   moves the datasets to the renderer class so that they can be accessed by other items
     */
    // datasets have
    //    dataset
    //      multiple fields
    parse(rendererClass, RDLElement) {
        rendererClass.DataSets = RDLElement;
        return new Object;
    }

}

class pre_Body extends pre_reportItem {
    constructor() { super(); this.rdlName = 'Body'; }
    // with the body, we simply want to put it at the top of the renderer
    parse(rendererClass, RDLElement) {
        rendererClass.Body = RDLElement;
        return new Object;
    }
}


class pre_Page extends pre_reportItem {
    constructor() { super(); this.rdlName = 'Page'; }
    // with the page, we simply want to put it at the top of the renderer
    parse(rendererClass, RDLElement) {
        rendererClass.Page = RDLElement;
        return new Object;
    }
}
class pre_EmbeddedImages extends pre_reportItem {
    constructor() { super(); this.rdlName = 'EmbeddedImages'; }
    // with the embedded images, we simply want to put them at the top of the renderer
    parse(rendererClass, RDLElement) {
        rendererClass.EmbeddedImages = RDLElement;
        return new Object;
    }
}


var preElements = new Array();
preElements.push(new pre_Datasets);
preElements.push(new pre_Body);
preElements.push(new pre_Page);
preElements.push(new pre_EmbeddedImages);


function createPreElement(elementName) {
    var arrayLength = preElements.length;
    for (var i = 0; i < arrayLength; i++) {
        var testElem = preElements[i];
        if (elementName == testElem.rdlName) return testElem;
    }
    return new pre_reportItem;  // if nothing found, return a null acting item
}




class HtmlRenderer {

    // the pre-render step goes through the RDL and finds specific elements that will be referenced by other elements
    // and puts them into this class.
    // Then, this class is passed to the individual renderers so that they can access what elements they need

    _prerender(rendererClass, RDLElement) {
        var prerenderer = createPreElement(RDLElement.nodeType);
        prerenderer.parse(rendererClass, RDLElement);

        // parse any children

        var tChildren = RDLElement.children;
        for (var i = 0; i < tChildren.length; i++) {
            var possibleChild = tChildren[i];
            if (possibleChild) {
                this._prerender(rendererClass, possibleChild)
            }
        }
    }

    // the embedded images are referenced from the Page element

    getEmbeddedImage(imageName) {
        if (this.EmbeddedImages) {
            if (this.EmbeddedImages.children) {
                // go through the list of embedded images to find the image with this name
                for (var i = 0; i < this.EmbeddedImages.children.length; i++) {
                    var imageElement = this.EmbeddedImages.children[i];
                    if (imageElement.Name == imageName) return imageElement;
                }
            }
        }
    }



    _render(whereToPutReport, RDLElement, topLevelObject, jsonData) {
        // find the renderer for this element
        var renderer = createReportElement(RDLElement.nodeType);
        var DOM_element = renderer.render(whereToPutReport, RDLElement, topLevelObject, jsonData);
        this.renderChildren(whereToPutReport, DOM_element, RDLElement, topLevelObject, jsonData);
    }

    renderChildren(whereToPutReport, newDomObject, RDLElement, topLevelObject, jsonData) {
        var tChildren = RDLElement.children;
        for (var i = 0; i < tChildren.length; i++) {
            var possibleChild = tChildren[i];
            if (possibleChild) {
                this._render(whereToPutReport, possibleChild, topLevelObject, jsonData);                    
            }
        }
    }

    /**
     * Render
     * 
     * Takes xlmString - the string containing the raw xml including images
     *       RDLTree   - the tree containing the interpreted RDL nodes
     *       jsonData  - array of all the json data sent from the host for this page
     * 
     *  Produces the screens 
     */
    render(whereToPutReport, RDLTree, jsonData) {

        // walk through the RDL tree and pre parse items

        this._prerender(this, RDLTree);

        // get any definition of the page and make sure the layout is set accordingly

        var pageRender = new _page();
        pageRender.render(whereToPutReport, this.Page);
        
        this._render(whereToPutReport, RDLTree, this, jsonData);

    }
}


/**  from the current - how to print a page
 * function displayReport(emp) {
    var APIKeyField = document.getElementById('APIKeyField');
    var APIKey = APIKeyField.value;
    var images = document.getElementById('displayPages');
    images.innerHTML = '        <img id="w4page" src="/api/W4_2022/GetW4?APIKey='+APIKey+'&EmployeeNumber='+emp+'" style="max-width:100%"  /> ';

    var links = document.getElementById('printableLinks');
    links.innerHTML = '        <a href="" onclick="    printW4page();">Printable page</a>'  + 'Select no margins in print options';
}


function printW4page() {
    var pageId = document.getElementById('w4page')
    var pagesrc = pageId.src;

    var newwindow = window.open(pagesrc, 'printwindow', 'titlebar=no,menubar=no,status=no');
    newwindow.window.print();
    //newwindow.close();
};

 */


class dataSet {
    name;
    hostSentData;
}