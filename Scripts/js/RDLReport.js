/*********************************************************************************
*
*	r D L R e p o r t  - a class to provide a report
*
**********************************************************************************
*    Copyright 2025 Prairie Trail Software, Inc.
*
*    This class handles the value clause of a textrun.
*    It needs to parse the clause, find the matching data element, and render it
*    It may need to perform calculations or searches to find the correct element.
*/

class rDLReport {

    // define some variables global to the class

    parser;  // class to hold the parser
    RDLTree; // holds the parsed tree so that it can be used for printing

    // function to load a file from the server

    async loadFile(url) {
    try {
        const response = await fetch(url);
        const data = await response.text();
        //console.log(data);
        this.initRDLReport(data);
    } catch (err) {
        console.error(err);
    }
}

    //------------------------------------------------------------
    //
    //    initRDLReport - initialize the report layout
    //
    //------------------------------------------------------------
    //
    //  This function takes the RDL source and parses it to build the internal
    //  structures needed to print the report

    initRDLReport(rDLsrc) {

        // Parse the RDL XML
        this.parser = new RDLParser(rDLsrc);
        this.RDLTree = this.parser.parse();

    }

    //------------------------------------------------------------
    //
    //    buildDataSetFromJSON - parse the JSON into a dataset usable by the renderer
    //
    //------------------------------------------------------------
    //
    //  This function takes the JSON data from the host and builds a dataset from that

    buildDataSetFromJSON(jsonData, datasetName) {
        var dataFromHost = JSON.parse(jsonData);
        var newDataSet = new dataSet;
        newDataSet.name = datasetName;
        newDataSet.hostSentData = dataFromHost;
        return newDataSet;
    }

    //------------------------------------------------------------
    //
    //    render - render the page with the given data
    //
    //------------------------------------------------------------
    //
    //  This function takes the parsed RDL and the data given and renders the page
    render(whereToPutReport, dataForThePage) {
        const renderer = new HtmlRenderer;
        renderer.render(whereToPutReport, this.RDLTree, dataForThePage);
    }


}



