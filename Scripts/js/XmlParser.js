/*********************************************************************************
*
*       XML Parser - a simple XML parsers
*
**********************************************************************************
*    Copyright 2025 Prairie Trail Software, Inc.
*/
// Why write another XML parser? 
// Because many of the other parsers assume that I am parsing an HTML file. 
// the DOMParser errors off on valid RDL file
// the <body> tag really confuses it

// error handling is done with throwing errors


class _xmlAttribute {
    name;
    value;
}

class _xmlNode {
    name;
    start;
    attributes = [];   // attributes after the tag name
    contentStart;
    contentEnd;
    children = [];

    getChild(childName) {
        for (const node of this.children) {
            if (node.name == childName) return node;
        }
    }
    getAttribute(attributeName) {  // for some reason, the for (const att of this.attributes) does not return the class instance
        for (var i = 0; i < this.attributes.length; i++) {
            var Att = this.attributes[i];
            if (Att.name == attributeName) return Att;
        }
    }
}

// most times, we are dealing with the char code so as to handle non-alphnumeric chars
class chars {
    static #_Tab = 0x9;     // "\t"
    static #_NL = 0xa;     // "\n"
    static #_FF = 0xc;     // "\f"
    static #_CR = 0xd;     // "\r"
    static #_SP = 0x20;    // " "
    static #_DoubleQuote = 0x22; // '"'
    static #_Ampersand = 0x26;   // "&"
    static #_SingleQuote = 0x27; // "'"
    static #_dash = 0x2d;   // "-"
    static #_period = 0x2e; // "."
    static #_Slash = 0x2f;  // "/"
    static #_colon = 0x3a;  // ":"
    static #_LT = 0x3c;    // "<"
    static #_GT = 0x3e;    // ">"
    static #_QuestionMark = 0x3f; // "?"
    static #_Plus = 0x2b;         // "+"
    static #_Minus = 0x2d;        // "-"
    static #_Times = 0x2a;        // "*"
    static #_Divide = 0x2f        // "/"
    static #_Equals = 0x3d;       // "="

    static #_0 = 0x30;
    static #_9 = 0x39;
    static #_a = 0x61;
    static #_z = 0x7a;
    static #_A = 0x41;
    static #_Z = 0x5A;
    static #_underscore = 0x5f; // "_"


    static inRange(num, min, max) { return num >= min && num <= max; }
    static isWhiteSpace(c) {
        return c === this.#_Tab ||
            c === this.#_NL ||
            c === this.#_CR ||
            c === this.#_SP;
    }

    static isTokenOpener(c) { return c === this.#_LT; }
    static isTokenCloser(c) { return c === this.#_GT; }
    static isEndingToken(c) { return c === this.#_Slash; }
    static isQuote(c) {
        return c === this.#_SingleQuote ||
            c === this.#_DoubleQuote;
    }
    static isQuestionMark(c) { return c === this.#_QuestionMark; }
    static isNameStart(c) {
        return this.inRange(c, this.#_A, this.#_Z) ||
            this.inRange(c, this.#_a, this.#_z) ||
            c === this.#_colon ||
            c === this.#_underscore;
    }
    // note: there are a number of characters that are valid xml name starts that are not considered here
    //       [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] 
    //       [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
    static isNameChar(c) {
        return this.isNameStart(c) ||
            this.inRange(c, this.#_0, this.#_9) ||
            c === this.#_dash ||
            c === this.#_period;
    }
    // Note this ignores the following valid chars #xB7 | [#x0300-#x036F] | [#x203F-#x2040]

    static isEndOfName(c) { return c === this.#_Slash || c === this.#_GT || isWhiteSpace(c); }
    static isIllegalStringChar(c) { return c === this.#_Ampersand || c === this.#_LT; }
    static isMathOperator(c) { return c === this.#_Plus || c === this.#_Minus || c === this.#_Times || c === this.#_Divide; }
    static isFieldEnd(c) { return this.isMathOperator(c) || c === this.#_period; }
}


class xmlParser {


    // parsing engine states
    // making these static is wrong as then they are not able to be used within methods

    stateStart = 1;
    stateBeforeTagName = 2;  // After <
    stateAfterTagName = 3;
    stateBeforeClosingTagName = 4;
    stateAfterClosingTagName = 5;
    stateParsingAttribute = 6;
    stateAfterTag = 7;
    stateInContent = 8;
    stateInClosingTag = 9;

    // internal variables

    state;         // holds what state the parsing engine is in
    charPtr;       // holds the index into the string that was passed
    noErrors;      // flag to indicate if parsing has found an error
    currentChar;   // holds the character being examined
    currentName;   // holds the current name being parsed
    currentNode;   // holds the node currently being parsed
    attribute;     // holds the attribute being parsed
    xmlDoc;        // base pointer to the xml document
    xmlLength;     // holds the length of the xml document


    currentNodes; // array of nodes currently being parsed so that we can recursively parse child nodes
    stateStack;   // array of states to allow for recursive parsing 
    rootNode;     // root node to return 



  // state engine functions

  // what to do when starting the parse
  // look for a starting < and skip all the whitespace in front of it

  startingParse() {
      if (chars.isTokenOpener(this.currentChar)) {
          this.state = this.stateBeforeTagName;
      }  
  }

  // the first line of the file has a <?xml tag. 
  // simply ignore it and find the ending ?> tag

  parseQuestionMark() {
      this.charPtr++;
      while (this.charPtr < this.xmlLength) {
          this.currentChar = this.xmlDoc.charCodeAt(this.charPtr);
          if (chars.isQuestionMark(this.currentChar)) {
              this.charPtr++;
              if (this.charPtr < this.xmlLength) {
                 this.currentChar = this.xmlDoc.charCodeAt(this.charPtr);
                 if (chars.isTokenCloser(this.currentChar)) {
                     this.state = this.stateStart;
                     return;
                 }
              }
              else throw new Error('unexpected end of file while parsing question mark');
          }
          this.charPtr++;
      }
      // if we get here, we reached the end of file before finding the ending token
      throw new Error('unexpected end of file while parsing question mark');
  }

    // skip to a char, not a char code
  skipTo(c) {
      this.charPtr++;
      while (this.charPtr < this.xmlLength) {
          this.currentChar = this.xmlDoc.charAt(this.charPtr);
          if (this.currentChar == c) {
              this.charPtr++;
              return;
          }
      }
      // if we get here, we reached the end of file before finding the wanted char
      throw new Error('unexpected end of file while skipping to ' + c);
  }
  skipWhiteSpace(){
      this.charPtr++;
      while (this.charPtr < this.xmlLength) {
          this.currentChar = this.xmlDoc.charCodeAt(this.charPtr);
          if (chars.isWhiteSpace(this.currentChar)) {
             this.charPtr++;
          }
          else { 
              this.charPtr--; 
              return; 
          }
      }
      // if we get here, we reached the end of file before finding the end of the white space
      throw new Error('unexpected end of file while skipping white space');
  }


    // parse the characters that make up the name

  parseName(){
          // pull off the character that started the name

      var parsedName = this.xmlDoc[this.charPtr];

          // then pull off each character 
      this.charPtr++;
      while (this.charPtr < this.xmlLength) {
          this.currentChar = this.xmlDoc.charCodeAt(this.charPtr);
          if (chars.isNameChar(this.currentChar)) {
             parsedName = parsedName + this.xmlDoc[this.charPtr];
             this.charPtr++;
          }
          else { 
              this.charPtr--; 
              return parsedName; 
          }
      }
      // if we get here, we reached the end of file before finding the end of the name
      throw new Error('unexpected end of file while parsing name' + this.currentName);
  }

     // attributes are quoted strings which can contain nearly anything except < and &
  parseQuotedString() {
          // pull off the quote character

      var quoteChar = this.xmlDoc.charCodeAt(this.charPtr);
      var stringValue = '';

          // then pull off each character 
      this.charPtr++;
      while (this.charPtr < this.xmlLength) {
          this.currentChar = this.xmlDoc.charCodeAt(this.charPtr);
          if (this.currentChar != quoteChar) {
              if (chars.isIllegalStringChar(this.currentChar)) {
                  throw new Error('encountered illegal char in string ' + this.currentChar);
              }
              stringValue = stringValue + this.xmlDoc[this.charPtr];
              this.charPtr++;
          }
              // when this returns, the charPtr is pointing at the quote
          else { 
              return stringValue; 
          }
      }
      // if we get here, we reached the end of file before finding the end of the quoted string
      throw new Error('unexpected end of file while parsing quoted string');
  }


  parseNodeName() {
      this.currentName = this.parseName();
      this.state = this.stateAfterTagName;
  }


  parseAttribute() {
      this.state = this.stateParsingAttribute;
      this.attribute = new _xmlAttribute;
      this.attribute.name = this.parseName();
      this.skipTo('=');
      this.skipWhiteSpace();
      this.attribute.value = this.parseQuotedString();
      this.state = this.stateAfterTagName;
      return this.attribute;
  }





  // State Engine

    // parsing a specific node
    // at this time, this does not support comments or CDATA segments


  parseOn() {
    while (this.noErrors) {
        if (this.charPtr < this.xmlLength) {
            this.currentChar = this.xmlDoc.charCodeAt(this.charPtr);
            switch (this.state) {
                case this.stateStart: {
                    this.startingParse();
                    break;
                }
                case this.stateBeforeTagName: {
                    if (chars.isQuestionMark(this.currentChar)) {
                        this.parseQuestionMark();
                    }
                    else
                        if (chars.isNameStart(this.currentChar)) {
                            this.parseNodeName();
                            // when a tag is opened and we have the name, add it to the node tree
                            // that way, any attribues get connected to this new node and not the parent
                            var newNode = new _xmlNode;
                            newNode.name = this.currentName;
                            if (this.currentNode) {
                                this.currentNode.children.push(newNode);
                                this.currentNodes.push(this.currentNode);
                                this.stateStack.push(this.stateAfterTag);
                            }
                            else
                                this.rootNode = newNode;
                            this.currentNode = newNode;
                        }
                        else  // for </ 
                            if (chars.isEndingToken(this.currentChar)) {
                                this.state = this.stateBeforeClosingTagName;
                            }
                    break;
                }
                case this.stateAfterTagName: {
                    // for >
                    if (chars.isTokenCloser(this.currentChar)) {
                        this.state = this.stateAfterTag;
                    }
                    else  // for /
                        if (chars.isEndingToken(this.currentChar)) {
                            this.state = this.stateInClosingTag;
                        }
                        else
                            if (chars.isWhiteSpace(this.currentChar)) { }    // simply skip white space
                            else
                                // if a name happens after the tag name, that is an attribute
                                if (chars.isNameStart(this.currentChar)) {
                                    var att = this.parseAttribute();
                                    if (!this.currentNode.attributes) this.currentNode.attributes = [];
                                    this.currentNode.attributes.push(att);
                                }
                    break;
                }
                case this.stateAfterTag: {
                    // after a tag is done, we can have a closing tag or a child
                    if (chars.isTokenOpener(this.currentChar)) {
                        this.state = this.stateBeforeTagName;
                    }
                    else
                        if (chars.isWhiteSpace(this.currentChar)) { }    // simply skip white space
                        else {
                            // or we can have tag content
                            // we have content. store start and end points
                            if (!this.currentNode.contentStart) this.currentNode.contentStart = this.charPtr;
                            this.currentNode.contentEnd = this.charPtr;
                            this.state = this.stateInContent;
                        }
                    break;
                }
                // we need an in content state as we skip white spaces before content, but not during
                case this.stateInContent: {
                    this.currentNode.contentEnd = this.charPtr;  // because we are setting up for a substring, include the ending token position
                    if (chars.isTokenOpener(this.currentChar)) {
                        this.state = this.stateBeforeTagName;
                    }
                    break;
                }
                case this.stateBeforeClosingTagName: {
                    if (chars.isNameStart(this.currentChar)) {
                        this.parseNodeName();
                        if (this.currentName != this.currentNode.name) {
                            throw new Error('Ending tag ' + this.currentName + ' does not match current node name ' + this.currentNode.name);
                        }
                        this.state = this.stateAfterClosingTagName;
                    }
                    break;
                }
                case this.stateAfterClosingTagName: {
                    if (chars.isTokenCloser(this.currentChar)) {
                        // we have reached the end of the node
                        // see if we are to continue the parent node
                        this.currentNode = this.currentNodes.pop();
                        this.state = this.stateStack.pop();
                    }
                    break;
                }
                // this is to support the self closing node <name />
                case this.stateInClosingTag: {
                    if (chars.isTokenCloser(this.currentChar)) {
                        // we have reached the end of the node
                        // see if we are to continue the parent node
                        this.currentNode = this.currentNodes.pop();
                        this.state = this.stateStack.pop();
                    }
                    else throw new Error('mal formed ending tag');
                    break;
                }

            }
            this.charPtr++;
        }
        else {
            if (this.currentNode)
                throw new Error('unexpected end of xml document at position ' + this.charPtr);
            return this.rootNode;
        }

    }

  }

  // returns a tree of all the _xmlNodes found

  parse(xmlString) {

    this.state = this.stateStart;
    this.charPtr = 0;
    this.noErrors = true;
    this.xmlDoc = xmlString;
    this.xmlLength = xmlString.length;
    this.currentNodes = [];
    this.stateStack = [];

    return(this.parseOn());

  }

}  // end of xmlParser class
