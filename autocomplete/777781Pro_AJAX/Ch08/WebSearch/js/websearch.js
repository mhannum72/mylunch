var msnWebSearch = {};

msnWebSearch.search = function (e,sSearchTerm) {
    var divSearchBox = this.drawResultBox(e);
    var url = encodeURI("websearch.php?search=" + sSearchTerm);

    var oParser = new XParser(url);
    oParser.onload = function () {
        msnWebSearch.populateResults(divSearchBox.childNodes[1],oParser);
    };
};

msnWebSearch.drawResultBox = function (e) {
    var divSearchBox= document.createElement("div");
    var divHeading = document.createElement("div");
    var divResultsPane = document.createElement("div");
    var aCloseLink = document.createElement("a");
    
    aCloseLink.href = "#";
    aCloseLink.className = "ajaxWebSearchCloseLink";
    aCloseLink.onclick = this.close;
    aCloseLink.appendChild(document.createTextNode("X"));
    
    divHeading.className = "ajaxWebSearchHeading";
    divHeading.appendChild(document.createTextNode("MSN Search Results"));
    divHeading.appendChild(aCloseLink);
    
    var divLoading = document.createElement("div");
    divLoading.appendChild(document.createTextNode("Loading Search Feed"));
    
    divResultsPane.className = "ajaxWebSearchResults";
    divResultsPane.appendChild(divLoading);
    
    divSearchBox.className = "ajaxWebSearchBox";
    divSearchBox.appendChild(divHeading);
    divSearchBox.appendChild(divResultsPane);
    
    document.body.appendChild(divSearchBox);
    
    this.position(e, divSearchBox);
    
    return divSearchBox;
};

msnWebSearch.position = function (e, divSearchBox) {
    var x = e.clientX + document.documentElement.scrollLeft;
    var y = e.clientY + document.documentElement.scrollTop;

    divSearchBox.style.left = x + "px";
    divSearchBox.style.top = y + "px";
};

msnWebSearch.populateResults = function (divResultsPane,oParser) {
    //Create the document fragment
    var oFragment = document.createDocumentFragment();
    
    //Clear the Loading XML message
    divResultsPane.removeChild(divResultsPane.firstChild);
    
    for (var i = 0; i < oParser.items.length; i++) {
        var oItem = oParser.items[i];
        
        //Create the link
        var aResultLink = document.createElement("a");
        aResultLink.href = oItem.link.value;
        aResultLink.className = "ajaxWebSearchLink";
        aResultLink.target = "_new";
        aResultLink.appendChild(document.createTextNode(oItem.title.value));
        
        //Append the link to the fragment
        oFragment.appendChild(aResultLink);
    }
    
    //Add the fragment to the results box
    divResultsPane.appendChild(oFragment);   
};



msnWebSearch.close = function () {
    var divSearchBox = this.parentNode.parentNode;
    document.body.removeChild(divSearchBox);
	   
    return false;
};