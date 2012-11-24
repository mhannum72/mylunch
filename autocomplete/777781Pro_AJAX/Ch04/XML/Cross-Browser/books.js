function init() {
    var oXmlDom = zXmlDom.createDocument();
    oXmlDom.onreadystatechange = function () {
        if (oXmlDom.readyState == 4) {
            if (oXmlDom.parseError.errorCode == 0) {
                parseBookInfo(oXmlDom);
            } else {
                var str = "An error occurred!!\n" +
                    "Description: " + oXmlDom.parseError.reason + "\n" +
                    "File: " + oXmlDom.parseError.url + "\n" +
                    "Line: " + oXmlDom.parseError.line + "\n" +
                    "Line Position: " + oXmlDom.parseError.linepos + "\n" +
                    "Source Code: " + oXmlDom.parseError.srcText;

                alert(str);
            }
        }
    };
    oXmlDom.load("books.xml");
}

function parseBookInfo(oXmlDom) {
    var oRoot = oXmlDom.documentElement;
    var oFragment = document.createDocumentFragment();
    
    var aBooks = oRoot.getElementsByTagName("book");
    
    for (var i = 0; i < aBooks.length; i++) {
        var sIsbn = aBooks[i].getAttribute("isbn");
        var sAuthor, sTitle, sPublisher;
        
        var oCurrentChild = aBooks[i].firstChild;

        do {
            switch (oCurrentChild.tagName) {
                case "title":
                    sTitle = oCurrentChild.text;
                break;
                case "author":
                    sAuthor = oCurrentChild.text;
                break;
                case "publisher":
                    sPublisher = oCurrentChild.text;
                break;
                default:
                break;
            }
        } while (oCurrentChild = oCurrentChild.nextSibling);
        
        var divContainer = document.createElement("div");
        var imgBookCover = document.createElement("img");
        var divContent = document.createElement("div");
        
        var sOdd = (i % 2)?"":"-odd";
        divContainer.className = "bookContainer" + sOdd;
        
        imgBookCover.src = "images/" + sIsbn + ".png";
        imgBookCover.className = "bookCover";
        divContainer.appendChild(imgBookCover);
        
        var h3Title = document.createElement("h3");
        h3Title.appendChild(document.createTextNode(sTitle));
        divContent.appendChild(h3Title);
        
        divContent.appendChild(document.createTextNode("Written by: " + sAuthor));
        divContent.appendChild(document.createElement("br"));
        divContent.appendChild(document.createTextNode("ISBN: #" + sIsbn));
        
        var divPublisher = document.createElement("div");
        divPublisher.className = "bookPublisher";
        divPublisher.appendChild(document.createTextNode("Published by: " + sPublisher));
        divContent.appendChild(divPublisher);
        
        divContent.className = "bookContent";
        divContainer.appendChild(divContent);
        
        oFragment.appendChild(divContainer);
    }
    document.body.appendChild(oFragment);
}



onload = init;