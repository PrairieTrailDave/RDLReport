/*********************************************************************************
*
*	Report Formatting Classes
*
**********************************************************************************
*
*    Copyright 2025 Prairie Trail Software, Inc.
*
*    These classes take the MetaData and the data record sent from the host 
*    and render the data
*/

// This supports a _very_ limited version of the RDL file format
// Each class that renders the RDL will document what the RDL specification has

// XML items that are not supported return an empty string.
// The process of rendering them and their children means that a child item can generate html 
// and it will be added to that empty string. 

var pageTopMargin = 0;
var pageLeftMargin = 0;

// while all the documentation says that the factor should be 96, 142 works better
// with that value, then the positions work and we don't need any margins added in
var inchpixelConversionFactor = 143;
var cmpixelConversionFactor = 56;


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


class dataSet {
    name;
    hostSentData;
}
function AddInTopMargin(str) {
    if (str) {
        var position = Number(str.substring(0, str.length - 2));
        var units = str.substring(str.length - 2, str.length);
        var newpos = position + pageTopMargin;
        return newpos + units;
    }
    return str;
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
    var newpos;
    if (units == 'in') { newpos = Math.round(position * inchpixelConversionFactor); }
    if (units == 'cm') { newpos = Math.round(position * cmpixelConversionFactor); }
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




// class to apply the style to a DOM object
class _styleObject {

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
    // BackgroundColor
    // BackgroundGradient;
    // BackgroundGradientEndColor
    // BackgroundGradientType
    // BackgroundHatchType
    backgroundImage;
    border;
    // BottomBorder
    borderColor;
    // BorderStyle
    // BorderWidth
    // Calendar
    color;
    // CurrencyLanguage
    // Direction
    fontFamily;
    fontSize;
    fontStyle;
    fontWeight;
    format;
    // Language
    // LeftBorder
    // LineHeight
    // NumeralLanguage
    // NumeralVariant
    paddingBottom;
    paddingLeft;
    paddingRight;
    paddingTop;
    // RightBorder
    // ShadowColor
    // ShadowOffset
    textAlign;
    textDecoration;
    // TextEffect
    // TopBorder
    // UnicodeBiDi
    // VerticalAlign
    // WritingMode

    constructor() { super(); this.rdlName = 'Style'; }

    apply(DOMObject, stylesToApply) {

    }

    renderStyle(parent) {
        var resultingStyle = '';
        // get textbox location
        if (parent.top) {
            resultingStyle = resultingStyle + 'position: absolute; top:' + ConvertToPixels(AddInTopMargin(parent.top));
        }
        if (parent.left) {
            resultingStyle = resultingStyle + '; left:' + ConvertToPixels(AddInLeftMargin(parent.left));
        }
        // check for any formatting
        if (parent.style) {
            resultingStyle = resultingStyle + parent.style.renderStyle();
        }

    }
    // we need to move attributes from the RDL Element to the style object so that this style can be used later
    //render(whereToPutReport, RDLElement, topLevelObject, jsonDatasetArray) {
    //}
    parse(RDLElement) {
        var parsedChildren = super.parseChildren(RDLElement);

        if (RDLElement.Format) { this.format = RDLElement.Format; }
        if (RDLElement.PaddingTop) { this.paddingTop = RDLElement.PaddingTop; }
        if (RDLElement.PaddingLeft) { this.paddingLeft = RDLElement.PaddingLeft; }
        if (RDLElement.PaddingRight) { this.paddingRight = RDLElement.PaddingRight; }
        if (RDLElement.PaddingBottom) { this.paddingBottom = RDLElement.PaddingBottom; }
        if (RDLElement.TextDecoration) { this.textDecoration = RDLElement.TextDecoration; }
        if (RDLElement.TextAlign) { this.textAlign = RDLElement.TextAlign; }
        if (RDLElement.Color) this.color = RDLElement.Color;
        if (RDLElement.Width) this.width = RDLElement.Width;

        if (RDLElement.FontFamily) this.fontFamily = RDLElement.FontFamily;
        if (RDLElement.FontSize) this.fontSize = RDLElement.FontSize;
        if (RDLElement.FontStyle) this.fontStyle = RDLElement.FontStyle;
        if (RDLElement.FontWeight) this.fontWeight = RDLElement.FontWeight;

        if (RDLElement.BorderColor) this.borderColor = RDLElement.BorderColor;

        // want to use the parseChildren to first parse these, then extract

        if (RDLElement.children) {
            for (var i = 0; i < RDLElement.children.length; i++) {
                var child = RDLElement.children[i];
                if (child.nodeType == 'Border') { this.border = parsedChildren[i]; }
                if (child.nodeType == 'BackgroundImage') { this.backgroundImage = child.Value; }
            }
        }
        return this;
    }
}
registerClass(_style);

class _border extends _reportItem {
    color;
    //style; // Default, None, Dotted, Dashed, Solid, DashDot
    width;
    constructor() { super(); this.rdlName = 'Border'; }


    renderStyle() {
        var resultingStyle = '';
        // see if any border is defined
        if (this.style) {
            if (this.style == 'None') return '';
            if (this.style == 'Default') return '';  // <--- if drawling a line, this should return solid, but lines are not supported at this time
            if (this.style == 'Solid') resultingStyle = 'border-style: solid;';
            if (this.style == 'Dashed') resultingStyle = 'border-style: dashed;';
            if (this.style == 'Dotted') resultingStyle = 'border-style: dotted;';
            if (this.style == 'Double') resultingStyle = 'border-style: double;';
        }
        // check for any border color
        if (this.color) resultingStyle = resultingStyle + 'border-color:' + this.color + ';';

        return resultingStyle;
    }
    parse(RDLElement) {
        if (RDLElement.Color) this.color = RDLElement.Color;
        if (RDLElement.Style) this.style = RDLElement.Style;
        if (RDLElement.Width) this.width = RDLElement.Width;
        return this;
    }

}
registerClass(_border);


/**
 * _textRunStyleObject actually applies the style to a text run object
 */
class _textRunStyleObject extends _styleObject {
    // TextAlign;      // must be "left", "right", "center"
    // TextDecoration; // must be "underline" or "none"
    // FontFamily;
    // FontSize;       // default is 10pt. max is 200pt
    // FontStyle;      // must be "normal" or "italic"
    // FontWeight;     // must be "normal" or "bold" (css font weight 800)
    // Format;         // must be a string
    apply(DOMObject, stylesToApply) {

    }
}

// because TextRun is a subitem to TextBox, return the string value
// if we could inject the correct module to get the value, we could combine the render modules
class _textRun extends _reportItem {
    // ActionInfo
    // Label
    // MarkupType
    // Style
    // ToolTip
    // Value
    // Value.DataType
    // Value.EvaulationMode
    //style;
    value;
    constructor() { super(); this.rdlName = 'TextRun'; this.needsData = 1; }

    renderStyle() {
        if (this.style.fontSize) {
            // convert pt to px 
            var fontSize = this.style.fontSize;
            if (fontSize) {
                var fontpt = fontSize.substring(0, fontSize.length - 2);
                var fontpx = Math.round((Number(fontpt) * 4) / 3);
                return 'font-size: ' + fontpx + 'px';
            }
        }
    }

    // the textRun can occur as a stand alone object on the page
    // in the stand alone, the value to render can be defined as a 
    // action on any of the datasets
    render(jsonDatasetArray) {
        if (this.datasets) {  // should be injected in the factory
            if (this.value) {
                var fldValue = ValueRenderer.parseValue(this.value, this.datasets, jsonDatasetArray);

                // check for any style on this text
                if (this.style) {
                    fldValue = '<div style="' + this.renderStyle() + '">' + fldValue + '</div>';
                }
                else {
                    fldValue = '<div>' + fldValue + '</div>';
                }
                return fldValue;
            }
        }
        return '';
    }

    // or as a part of a tablix
    // In which case, the data to render is either static 
    // or given as a row of data from the tablix dataset
    tablixrender(jsonDataArray) {
            if (this.value) {
                //var fldValue = ValueRenderer.parseRowValue(this.value, jsonDataArray);
                var fldValue = resolveValue.parseRowValue(this.value, jsonDataArray);

                // check for any style on this text
                if (this.style) {
                   fldValue = '<div style="' + this.renderStyle() + '">' + fldValue + '</div>';
                }
                else {
                    fldValue = '<div>' + fldValue + '</div>';
                }
                return fldValue;
            }
        return '';
    }
    parse(RDLElement) {
        this.parsedChildren = super.parseChildren(RDLElement);
        if (RDLElement.Value) this.value = RDLElement.Value;
        return this;
    }
}
registerClass(_textRun);

class _textBox extends _reportItem {
    //    Name
    //style;
    //    ActionInfo
    //    CanScrollVertically
    //    CustomProperties
    //    DataElementName
    //    DataElementOutput
    //    DocumentMapLabel
    //    Height
    left;
    //    RepeatWith
    //    ToolTip
    top;
    //    Visibility
    width;
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

    valueString;
    expression;

    constructor() { super(); this.rdlName = 'Textbox'; }

    //renderChildren(jsonDatasetArray) {
    //    var results = '';
    //    var tChildren = RDLElement.children;
    //    if (tChildren) {
    //        for (var i = 0; i < tChildren.length; i++) {
    //            var possibleChild = tChildren[i];
    //            if (possibleChild) {
    //                var renderer = createReportElement(possibleChild.nodeType);
    //                results = results + renderer.render(jsonDatasetArray);
    //            }
    //        }
    //    }
    //    return results;
    //}
    //renderStyle() {
    //    var resultingStyle = '';
    //    // get textbox location
    //    if (this.top) {
    //        resultingStyle = resultingStyle + 'position: absolute; top:' + ConvertToPixels(AddInTopMargin(this.top));
    //    }
    //    if (this.left) {
    //        resultingStyle = resultingStyle + '; left:' + ConvertToPixels(AddInLeftMargin(this.left));
    //    }
    //    // check for any formatting
    //    if (this.style) {
    //        resultingStyle = resultingStyle + this.style.renderStyle();
    //    }

    //    return resultingStyle;
    //}
    renderStyle() {
        var resultingStyle = '';
        // get textbox location
        if (this.top) {
            resultingStyle = resultingStyle + 'position: absolute; top:' + ConvertToPixels(this.top); // + topMargin
        }
        if (this.left) {
            resultingStyle = resultingStyle + '; left:' + ConvertToPixels(this.left); // + leftMargin
        }
        return resultingStyle;
    }
    // The textbox determines where the data will be shown and TextRun gets the data
    // To display everything, this needs to render all the children and then place them.
    render(jsonDatasetArray) {
        var textBoxData = this.renderChildren(jsonDatasetArray);
        var boxstyle = this.renderStyle();

        if (boxstyle.length > 0) { boxstyle = ' style="' + boxstyle + '"' }

        // build html to render the string
        var textboxHtml = '<div' + boxstyle + '>' + textBoxData + '</div>';

        return textboxHtml;
    }

    parse(RDLElement) {
        this.parsedChildren = super.parseChildren(RDLElement);
        if (RDLElement.Top) this.top = RDLElement.Top;
        if (RDLElement.Left) this.left = RDLElement.Left;
        if (RDLElement.Width) this.width = RDLElement.Width;

        return this;
    }

}
registerClass(_textBox);

class _embeddedImage extends _reportItem {
    imageData;
    mimetype;   // must be "image/jpeg", "image/gif", "image/png"
    name;
    constructor() { super(); this.rdlName = 'EmbeddedImage'; }
    render(jsonData) {
        return new Object;
    }

}
registerClass(_embeddedImage);

class _embeddedImages extends _reportItem {
    constructor() { super(); this.rdlName = 'EmbeddedImages'; }
    // render  - we don't render from this

    parse(RDLElement) {
        const embeddedImages = super.parseChildren(RDLElement);
        saveEmbeddedImagesInFactory(embeddedImages);
        return this;
    }
}
registerClass(_embeddedImages);


// this needs the full RDL tree in order to find the embedded image
class _body extends _reportItem {
    // Body
    //   ReportItems
    //   Height
    //style;
    constructor() { super(); this.rdlName = 'Body'; }
    render(jsonDatasetArray) {
        var results = '';
        if (this.parsedChildren) {
            // look for a style element prior to rendering other children
            if (this.style) {
                    var bodyStyle = new _pageStyleObject();
                    bodyStyle.apply();
            }
            // render other children
            var childhtml = super.renderChildren(jsonDatasetArray);
            results = results + childhtml;
        }
        return results;
    }

    parse(RDLElement) {
        var parsed = super.parseChildren(RDLElement);
        if (Array.isArray(parsed)) {
            if (parsed.length == 1) {
                if (Array.isArray(parsed[0])) { this.parsedChildren = Array.from(parsed[0]); }
                else this.parsedChildren = parsed[0];
            } else this.parsedChildren = Array.from(parsed);
        }
        else this.parsedChildren = parsed;
        return this;
    }

}
registerClass(_body);

class _reportSection extends _reportItem {
    constructor() { super(); this.rdlName = 'ReportSection'; }
    render(jsonDatasetArray) {
        return super.renderChildren(jsonDatasetArray);
    }
    // how to parse and elevate items
}
registerClass(_reportSection);

class _reportSections extends _reportItem {
    constructor() { super(); this.rdlName = 'ReportSections'; }
    render(jsonDatasetArray) {
        return super.renderChildren(jsonDatasetArray);
    }
    // how to parse and elevate items
}
registerClass(_reportSections);

class _page extends _reportItem {
    // Columns
    // ColumnSpacing
    bottomMargin;
    // InteractiveHeight
    // InteractiveWidth
    leftMargin;
    // PageFooter
    // PageHeader
    // PageHeight
    // PageWidth
    rightMargin;
    // Style
    topMargin;
    constructor() { super(); this.rdlName = "Page"; }
    parse(RDLElement) {
        if (RDLElement.BottomMargin) this.bottomMargin = RDLElement.BottomMargin;
        if (RDLElement.LeftMargin) {
            this.leftMargin = RDLElement.LeftMargin;
            pageLeftMargin = ConvertToPixels(this.leftMargin);
        }
        if (RDLElement.RightMargin) this.rightMargin = RDLElement.RightMargin;
        if (RDLElement.TopMargin) {
            this.topMargin = RDLElement.TopMargin;
            pageTopMargin = ConvertToPixels(this.topMargin);
        }
    }
}
registerClass(_page);



class _dataset extends _reportItem {
    constructor() { super(); this.rdlName = 'DataSet'; }

    parse(RDLElement) {

        return this;
    }
}
registerClass(_dataset);
class _datasets extends _reportItem {
    constructor() { super(); this.rdlName = 'DataSets'; }

    parse(RDLElement) {
        //this.parsedChildren = super.parseChildren(RDLElement);
        saveDataSetsInFactory(RDLElement);
        return this;
    }
}
registerClass(_datasets);
















class HtmlRenderer {
    parsedChildren;


    parse(RDLElement) {
        this.parsedChildren = [];

        var prerenderer = createReportElement(RDLElement.nodeType);
        if (prerenderer.parse) {
            this.parsedChildren = prerenderer.parse(RDLElement);
        }

    }



    _render(jsonDatasetArray) {
        // find the renderer for this element
        //var renderer = createReportElement(RDLElement.nodeType);
        var DOM_elements = '';
        for (var i = 0; i < this.parsedChildren.length; i ++) {
            const renderer = this.parsedChildren[i];
            DOM_elements = DOM_elements + renderer.render(jsonDatasetArray);
        }
        return DOM_elements;
    }


    /**
     * Render
     * 
     * Takes xlmString         - the string containing the raw xml including images
     *       RDLTree           - the tree containing the interpreted RDL nodes
     *       jsonDatasetArray  - array of all the json data sent from the host for this page
     * 
     *  Produces the screens 
     */
    render(whereToPutReport, RDLTree, jsonDatasetArray) {

        // walk through the RDL tree and pre parse items
        // this pulls elements that are referenced elsewhere up to the top
        // so that we can pass one object to the rendering item to do the referencing

        this.parse(RDLTree);

        var dom_element = this._render(jsonDatasetArray);
        whereToPutReport.insertAdjacentHTML('beforeend', dom_element);

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

