/*********************************************************************************
 *
 *	e l e m e n t F a c t o r y  - a factory to return elements that render 
 *
 **********************************************************************************
 *    Copyright 2025 Prairie Trail Software, Inc.
 *
 */


// factory for creating elements


// array to hold objects to create in factory
// each object has to have an rdlName which is used to identify what to create
var reportElements = new Array();

// data that might be injected into the objects created
var datasetsToUse;
var embeddedImages;

function registerClass(classToRegister) {
    reportElements.push(new classToRegister);
}
function createReportElement(elementName) {
    var arrayLength = reportElements.length;
    for (var i = 0; i < arrayLength; i++) {
        var testElem = reportElements[i];
        if (elementName == testElem.rdlName) {
            const nObj = Object.create(testElem);
            nObj.nodeType = elementName;
            if (testElem.needsData) nObj.datasets = datasetsToUse;
            return nObj; // on Edge, Object.create does create properly when 'new' does not
        }
        //return { ...testElem };  // <----- this does not copy the object methods!
        //return { new testElem };  // <----- this does not copy the object prototype / methods!
    }
    return new _reportItem;  // if nothing found, return a null acting item
}

function saveDataSetsInFactory(datasets) { datasetsToUse = datasets; }
function saveEmbeddedImagesInFactory(images) { embeddedImages = images; }

// the embedded images are referenced from the Page element

function getEmbeddedImage(imageName) {
    if (embeddedImages) {
        if (embeddedImages.children) {
            // go through the list of embedded images to find the image with this name
            for (var i = 0; i < embeddedImages.children.length; i++) {
                var imageElement = embeddedImages.children[i];
                if (imageElement.Name == imageName) return imageElement;
            }
        }
    }
}


// testing of this factory


/*
var testFactoryVar = createReportElement('EmbeddedImage');
if (!testFactoryVar) console.log('didnt make class');
if (testFactoryVar instanceof _embeddedImage) console.log('created instance of embeddedImage');
*/

