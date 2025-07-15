/*********************************************************************************
 *
 *	t a b l i x  - a class to render the table 
 *
 **********************************************************************************
 *    Copyright 2025 Prairie Trail Software, Inc.
 *
 *    The Tablix consists of four parts: the corner cells, the table column cells,
 *    the table row cells, and the table body cells.
 *    This implementation is a simplified version. 
 */





class _tablixCell extends _reportItem {
    size;
    constructor() { super(); this.rdlName = "TablixCell"; }
    tablixrender(jsonDataToPutInCell) {
        // actually, tablixCell doesn't render the data
        var htmlContents;
        var childContents = super.tablixrenderChildren(jsonDataToPutInCell);;
        if (this.size) htmlContents = "<td width=" + this.size + ">" + childContents + "</td>";
        else htmlContents = "<td>" + childContents + "</td>";
        return htmlContents;
    }
    parse(RDLElement) {
        this.parsedChildren = super.parseChildren(RDLElement);
        if (RDLElement.Size) this.size = RDLElement.Size;
        return this;
    }
}
registerClass(_tablixCell);


class _tablixCells extends _reportItem {
    tablixCells;
    constructor() { super(); this.rdlName = "TablixCells"; }
    tablixrender(jsonDataToPutInCell) {
        // call the individual cell to render
        var htmlContents = '';
        for (var cellID = 0; cellID < this.tablixCells.length; cellID++) {
            htmlContents = htmlContents + this.tablixCells[cellID].tablixrender(jsonDataToPutInCell);
        }
        return htmlContents;
    }
    parse(RDLElement) {
        this.tablixCells = Array.from(super.parseChildren(RDLElement));
        return this;
    }
}
registerClass(_tablixCells);

class _tablixColumn extends _reportItem {
    columnSize;
    constructor() { super(); this.rdlName = "TablixColumn"; }
    parse(RDLElement) {
        this.columnSize = RDLElement.Width;
    }
}

class _tablixColumns extends _reportItem {
    constructor() { super(); this.rdlName = "TablixColumns"; }
    parse(RDLElement) {
        var columnArray = [];
        if (RDLElement.children) {
            if (RDLElement.children.length > 0) {
                for (var childID = 0; childID < RDLElement.children.length; childID++) {
                    var tablixColumn = new _tablixColumn();
                    if (RDLElement.children[childID].nodeType == 'TablixColumn') {
                        tablixColumn.parse(RDLElement.children[childID]);
                        columnArray.push(tablixColumn);
                    }
                }
            }
        }
        return columnArray;
    }
}

class _tablixHeader extends _reportItem {
    size;
}






class _tablixRow extends _reportItem {
    ifHeaderRow;    // flag if this row contains header information
    tablixCells;

    constructor() { super(); this.rdlName = "TablixRow"; }

    // render a specific row in this tablix
    // returns a <tr> element, a set of <tr> elements, and the </tr>

    tablixrender(tablixRowJsonData) {
        var results = '<tr>';

        // for each element, render that element

        for (var columnID = 0; columnID < this.tablixCells.length; columnID++) {
            var cellsToSendTo = this.tablixCells[columnID];
            results = results + cellsToSendTo.tablixrender(tablixRowJsonData);
        }
        return results + '</tr>';
    }

    // this has to build the structure in order to repeatedly render the row
    // depending on how many rows are in the data

    parse(RDLElement) {
        this.tablixCells = super.parseChildren(RDLElement);
        return this;
    }

}
registerClass(_tablixRow);

class _tablixRows extends _reportItem {
    constructor() { super(); this.rdlName = "TablixRows"; }

    parse(RDLElement) {
        var rowArray = [];
        if (RDLElement.children) {
            if (RDLElement.children.length > 0) {
                for (var childID = 0; childID < RDLElement.children.length; childID++) {
                    if (RDLElement.children[childID].nodeType == 'TablixRow') {
                        rowArray.push(new _tablixRow()); 
                        var thisrow = rowArray[rowArray.length-1];
                        thisrow.parse(RDLElement.children[childID]);
                    }
                }
            }
        }
        return rowArray;
    }
}

// row members can have a group.
// in which case, the row can be duplicated depending on the dataset
class _tablixGroup extends _reportItem {
    // GroupExpressions
    name;
    // variables

    // the TablixRow connected to this group
    tablixRow;

    constructor() { super(); this.rdlName = "Group"; }
    tablixrender(rowData) {
        var groupResults = '';
        if (this.tablixRow) {
            if (rowData) {
                groupResults = '<tr>';
                for (var id = 0; id < this.tablixRow.children.length; id++) {
                    var possibleChild = this.tablixRow.children[id];
                    if (possibleChild) {
                        var renderer = createReportElement(possibleChild.nodeType);
                        groupResults = groupResults + renderer.tablixrender(rowData);
                    }
                }
            }
        }
        return groupResults;
    }
    parse(RDLElement) {
        if (RDLElement.Name)  this.name = RDLElement.Name;
        // initialize group variables used in formulas
    }
    setRowDefinition(_tablixRow) {
        this.tablixRow = _tablixRow;
    }
}
registerClass(_tablixGroup);


class _tablixMember extends _reportItem {
    // CustomProperties
    // DataElementName
    // DataElementOutput
    // FixedData
    group;
    // HideIfNoRows
    // KeepTogether
    keepWithGroup;
    // RepeatOnNewPage
    // SortExpressions
    // TablixHeader
    // TablixMembers  - means that tablix members can be included in a single cell
    // Visibility

    tablixRow; // single TablixRow

    constructor() { super(); this.rdlName = "TablixMember"; }
    tablixrender(rowData) {
        // if the host data is defined for this row
        // render using that
        if (rowData) {
            if (this.group) {
                this.group.setRowDefinition(this.tablixRow);
                return this.group.tablixrender(rowData);
            }
            return super.renderChildren();
        }
        // render the row as static
        else {
            super.renderChildren();
        }

        return '';
    }

    parse(RDLElement) {
        if (RDLElement.children.length > 0) {
            for (var childID = 0; childID < RDLElement.children.length; childID++) {
                var childElement = RDLElement.children[childID];
                if (childElement.nodeType == "Group") {
                    if (childElement.children) {
                        if (childElement.children.length > 0)
                            childElement.parseChildren(childElement);
                    }
                    this.group = childElement;
                }
            }
        }
        if (RDLElement.KeepWithGroup) this.keepWithGroup = RDLElement.KeepWithGroup;
        return this;
    }
    // connect the tablixRow with this member
    setRowDefinition(_tablixRow) {
        this.tablixRow = _tablixRow;
        // we may not have parsed the group yet.
    }
}
registerClass(_tablixMember);


// TablixMembers simply holds the array of TablixMember
class _tablixMembers extends _reportItem {
    tablixMembers;
    tablixRows; // array of TablixRows
    constructor() { super(); this.rdlName = "TablixMembers"; }

    tablixrender(hostDataArray) {
        var rowResults = '';
        var dataRow = 0;

        for (var rowID = 0; rowID < this.tablixMembers.length; rowID++) {
            if (rowID < this.tablixRows.length) {
                var rowInTablix = this.tablixRows[rowID];  // get the row elements definitions

                // check if this row hierarchy member has a group on it

                if (this.tablixMembers[rowID].group) {
                    if (dataRow < hostDataArray.length) {
                        rowResults = rowResults + rowInTablix.tablixrender(hostDataArray[dataRow++]);
                    }
                    else { // looks like the row is static or data is from variables
                        rowResults = rowResults + rowInTablix.tablixrender();
                    }
                }
                else {
                    rowResults = rowResults + rowInTablix.tablixrender();
                }
            }
        }
        return rowResults;
    }
    // pull up the tablix members into this
    parse(RDLElement) {
        this.tablixMembers = Array.from(super.parseChildren(RDLElement));
        return this;
    }

    // this connects the TablixRows with the TablixMembers of the TablixRowHierarchy
    setRowDefinitions(_tablixRows) {
        // test to make sure the number of rows and rowmembers in the hierarchy match
        if (_tablixRows.length != this.tablixMembers.length) throw new Error("Mismatch between row hierarchy and rows");
        this.tablixRows = _tablixRows;
        for (var rowID = 0; rowID < _tablixRows.length; rowID++) {
            this.tablixMembers[rowID].setRowDefinition(_tablixRows[rowID]);
        }
    }
}
registerClass(_tablixMembers);


class _tablixColumnHierarchy extends _reportItem {
    tablixMembers;
    constructor() { super(); this.rdlName = "TablixColumnHierarchy"; }

    // there can be a TablixHeader in the hierarchy
    parse(RDLElement) {
        this.tablixMembers = super.parseChildren(RDLElement);
        return this;
    }
}
registerClass(_tablixColumnHierarchy);


// Row Hierarchy is defined at the tablix level
// and specifies how the different rows are to be processed
// if the Row Hierarchy includes a group name, then the rows process an array of data

class _tablixRowHierarchy extends _reportItem {
    tablixMembers; // array of tablixMember
    tablixRows; // array of TablixRows
    constructor() { super(); this.rdlName = "TablixRowHierarchy"; }
    tablixrender(hostDataArray) {
        var results = '';
        if (this.tablixMembers) {
            for (var i = 0; i < this.tablixMembers.length; i++) {
                var tm = this.tablixMembers[i];
                tm.setRowDefinitions(this.tablixRows);
                results = results + tm.tablixrender(hostDataArray);
            }
        }
        return results;
    }

    // there can be a TablixHeader in the hierarchy
    parse(RDLElement) {
        this.tablixMembers = super.parseChildren(RDLElement);
        return this;
    }

    setRowDefinitions(_tablixrows) {
        this.tablixRows = _tablixrows;
    }
}
registerClass(_tablixRowHierarchy);

class _tablixBody extends _reportItem {
    tablixColumns;
    tablixRows;
    rows;
    columns;

    columnHierarchy;
    rowHierarchy;

    constructor() { super(); this.rdlName = "TablixBody"; }

    // the regular render will create a new tablixBody and ask it to render
    // we have to use the tablixBody that is part of the tablix object

    tablixrender(hostDataArray) {

        var bodyResults = '';

        // get the header row

        // connect with the data and add the rows
        // parse the jsonData to find out how many columns and rows to put on the table
        if (Array.isArray(hostDataArray)) {

            // make the row hierarchy process the rows
            if (this.rowHierarchy) {
                this.rowHierarchy.setRowDefinitions(this.rows);
                bodyResults = bodyResults + this.rowHierarchy.tablixrender(hostDataArray);
            }
            else {// render without the hierarchy
            }
        }
        return bodyResults;
    }
    parse(RDLElement) {
        this.tablixColumns = [];
        for (var childID = 0; childID < RDLElement.children.length; childID++) {

            // get the column definitions and sizes

            if (RDLElement.children[childID].nodeType == 'TablixColumns') {
                this.tablixColumns = new _tablixColumns();
                this.columns = this.tablixColumns.parse(RDLElement.children[childID]);
            }

            // get the rows

            if (RDLElement.children[childID].nodeType == 'TablixRows') {
                this.tablixRows = new _tablixRows();
                this.rows = this.tablixRows.parse(RDLElement.children[childID]);
            }
        }
        return this;
    }

    // this needs to determine if any rows are part of a group.
    // rows that are part of a group can be processed over and over again depending on the data
    // there needs to be a one to one relationship between tablixrows and tablixmembers in the row hierarchy

    determineRowProcessing() {

    }

    setHierarchy(_rowHierarchy, _columnHierarchy) {
        this.columnHierarchy = _columnHierarchy;
        this.rowHierarchy = _rowHierarchy;

        // connect rows with row hierarchy

        if (this.rowHierarchy) {
            this.rowHierarchy.setRowDefinitions(this.rows);
        }

    }
    // determine the number of columns
    // The quantity of TablixColumn elements within the tablix MUST equal the quantity of tablix column members 
    // that do not have a TablixMember element descendant.The quantity of TablixColumn elements within the tablix 
    // MUST equal the quantity of TablixCell elements within the tablix.
}
registerClass(_tablixBody);

// tablix needs to figure out how many rows and columns are in the data

class _tablix extends _reportItem {
    tablixName;    // holds the name of the tablix

    // child elements that can be defined and identified in the RDL parse step
    top;
    left;
    width;
    height;
    pageName

    // supported child elements pulled out of the RDL element
    datasetname;    // which dataset to use for this tablix
    tablixBody;
    columnHierarchy;
    rowHierarchy;

    //numberOfRows;
    //numberOfColumns;
    //headerList;
    //rowList;
    //runningValues;
    //aggregateList;

    constructor() { super(); this.rdlName = "Tablix"; }


    // this needs to be redone as
    // 1. each column might need to be duplicated
    // 2. each row is likely to be duplicated because of the data



    render(jsonDatasetArray) {

        if (!this.datasetname) return 'no dataset defined';

        // get that dataset for rendering
        // a Tablix should only render one dataset
        // It may need to reference other datasets
        var tablixDataset;
        for (var datasetID = 0; datasetID < jsonDatasetArray.length; datasetID++) {
            var specificDataset = jsonDatasetArray[datasetID];
            if (specificDataset.name == this.datasetname) {
                tablixDataset = specificDataset;
            }
        }
        if (tablixDataset == undefined) throw new Error('tablix dataset undefined');

        // pull the host sent data out of the dataset

        var hostSentData = tablixDataset.hostSentData[tablixDataset.name];



        // send the hierarchy down to the body where the columns and rows are defined

        var renderedChildren = '';

        if (this.tablixBody) {
            this.tablixBody.setHierarchy(this.rowHierarchy, this.columnHierarchy);

            // this first version will not support subtables.

            renderedChildren = this.tablixBody.tablixrender(hostSentData);
        }
        var renderedTablix = "<table " + this.renderTablixStyle() + ">" + renderedChildren + "</table>";
        return renderedTablix;
    }
    renderTablixStyle() {
        var styleResult = '';

        // check if anything was defined that would render as a style
        if (this.top || this.left) {
            styleResult = 'style="position: absolute;';
            if (this.top) { styleResult = styleResult + ' top:' + ConvertToPixels(this.top) + ';'; } // AddInTopMargin(
            if (this.left) { styleResult = styleResult + ' left:' + ConvertToPixels(this.left) + ';'; } // AddInLeftMargin(
            styleResult = styleResult + '"';
        }
        return styleResult;
    }
    parse(RDLElement) {
        // find the datasetname in the children

        if (RDLElement.DataSetName) {
            this.datasetname = RDLElement.DataSetName;
        }
        // pull other child elements that were identified in the RDL parsing

        if (RDLElement.Name) this.tablixName = RDLElement.Name;
        if (RDLElement.Top) this.top = RDLElement.Top;
        if (RDLElement.Left) this.left = RDLElement.Left;
        if (RDLElement.Width) this.width = RDLElement.Width;
        if (RDLElement.Height) this.height = RDLElement.Height;
        if (RDLElement.PageName) this.pageName = RDLElement.PageName;
        // the RDL file splits up the rows and the hierarchy.
        // rows are under the TablixBody while the hierarchy is under the Tablix.

        for (var childID = 0; childID < RDLElement.children.length; childID++) {

            // get the body

            if (RDLElement.children[childID].nodeType == 'TablixBody') {
                this.tablixBody = new _tablixBody();
                this.tablixBody.parse(RDLElement.children[childID]);
            }

            // get the column hierarchy

            if (RDLElement.children[childID].nodeType == 'TablixColumnHierarchy') {
                this.columnHierarchy = new _tablixColumnHierarchy();
                this.columnHierarchy.parse(RDLElement.children[childID]);
            }

            // get the row hierarchy

            if (RDLElement.children[childID].nodeType == 'TablixRowHierarchy') {
                this.rowHierarchy = new _tablixRowHierarchy();
                this.rowHierarchy.parse(RDLElement.children[childID]);
            }
        }
        return this;
    }
}
registerClass(_tablix);
