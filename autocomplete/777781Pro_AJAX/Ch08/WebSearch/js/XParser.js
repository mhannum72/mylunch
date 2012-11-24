/*****************************************************
XWeb XParser 0.8

Browsers Supported
MSIE 6
Mozilla 1+
Firefox 0.8+

Online documentation at http://www.wdonline.com/javascript/xparser/
(c) 2004  Jeremy McPeak  jwmcpeak@gmail.com
*****************************************************/
function XParser(sFileName,bIsXml) {
    var oThis = this;
    this.title=this.link=this.description=this.copyright=this.generator=this.modified=this.author=new XParserElement();
    this.onload = null;
    if (bIsXml) this.load(sFileName);
    else {
		var oReq = zXmlHttp.createRequest();
		oReq.onreadystatechange = function () {
			if (oReq.readyState == 4) {
	            // only if "OK"
				if (oReq.status == 200) {
	                oThis.load(oReq.responseText);
				}
			}
		};
		oReq.open("GET", sFileName, true);
		oReq.send(null);
    }
}

XParser.prototype.load = function (sXml) {
	var oXmlDom = zXmlDom.createDocument();
	oXmlDom.loadXML(sXml);
	this.root = oXmlDom.documentElement;
	this.isRss = (this.root.tagName.toLowerCase() == "rss");
	if (this.isRss && parseInt(this.root.getAttribute("version")) < 2) 
		throw new Error("RSS Version is less than 2");;
	this.isAtom = (this.root.tagName.toLowerCase() == "feed");
	this.type = (this.isRss)?"RSS":"Atom";
	var oChannel = (this.isRss)?this.root.getElementsByTagName("channel")[0]:this.root;
	
	for (var i = 0; i < oChannel.childNodes.length; i++) {
		var oNode = oChannel.childNodes[i];
		if (oNode.nodeType == 1) {
			switch (oNode.tagName.toLowerCase()) {
				//Shared Tags
				case "title":
					this.title = new XParserElement(oNode);
				break;
				case "link":
					if (this.isAtom) {
						if (oNode.getAttribute("rel").toLowerCase() == "alternate") {
							this.link = new XParserElement(oNode,oNode.getAttribute("href"));
						}
					} else {
						this.link = new XParserElement(oNode);
					}
				break;
				case "copyright":
					this.copyright = new XParserElement(oNode);
				break;
				case "generator":
					this.generator = new XParserElement(oNode);
				break;
				//RSS Tags
				case "description":
					this.description = new XParserElement(oNode);
				break;
				case "lastbuilddate":
					this.modified = new XParserElement(oNode);
				break;
				case "managingeditor":
					this.author = new XParserElement(oNode);
				break;
				//Atom Tags
				case "tagline":
					this.description = new XParserElement(oNode);
				break;
				case "modified":
					this.modified = new XParserElement(oNode);
				break;
				case "author":
					this.author = new XParserElement(oNode);
				break;
				default:
				break;
			}
		}
	}
	this.items = [];
	
	var oItems = null;
	if (this.isRss) {
		oItems = oChannel.getElementsByTagName("item");
	} else {
		try {
			oXmlDom.setProperty("SelectionNamespaces","xmlns:atom='http://purl.org/atom/ns#'");
			oItems = oXmlDom.selectNodes("/atom:feed/atom:entry");
		} catch (oError) {
			oItems = oChannel.getElementsByTagName("entry");
		}
	}

	for (var i = 0; i < oItems.length; i++) {
		this.items[i] = new XParserItem(oItems[i]);
	}
	
	if (typeof this.onload == "function")
		this.onload();
}

function XParserElement(oNode,sValue) {
	this.node = oNode || false;
	this.value = sValue || (this.node && this.node.text) || false;
	
	if (this.node) {
		this.attributes = [];
		var oAtts = this.node.attributes;
		for (var i = 0; i < oAtts.length; i++) {
			this.attributes[i] = new XParserAttribute(oAtts[i]);
			this.attributes[oAtts[i].nodeName] = new XParserAttribute(oAtts[i]);
		}
	} else this.attributes = 0;
	
	this.isNull = (!this.node && !this.value && !this.attributes);
}

function XParserAttribute(oNode) {
	this.value = oNode.nodeValue;
}

function XParserItem(itemNode) {
	this.title=this.link=this.author=this.description=this.date=new XParserElement();
	for (var i = 0; i < itemNode.childNodes.length; i++) {
		var oNode = itemNode.childNodes[i];
		if (oNode.nodeType == 1) {
			switch (oNode.tagName.toLowerCase()) {
				//Shared Tags
				case "title":
					this.title = new XParserElement(oNode);
				break;
				case "link":
					if (oNode.getAttribute("href"))
						this.link = new XParserElement(oNode,oNode.getAttribute("href"));
					else this.link = new XParserElement(oNode);
				break;
				case "author":
					this.author = new XParserElement(oNode);
				break;
				//RSS Tags
				case "description":
					this.description = new XParserElement(oNode);
				break;
				case "pubdate":
					this.date = new XParserElement(oNode);
				break;
				//Atom Tags
				case "content":
					this.description = new XParserElement(oNode);
				break;
				case "issued":
					this.date = new XParserElement(oNode);
				break;
				//Extensions
				case "dc:date":
					this.date = new XParserElement(oNode);
				break;
				default:
				break;
			}
		}
	}
}

/*
  Text Getter
  Written by Erik, http://webfx.eae.net
*/
if (navigator.product == "Gecko") 
{
	Text.prototype.__defineGetter__( "text", function ()
	{
	   return this.nodeValue;
	} );
	
	Node.prototype.__defineGetter__( "text", function ()
	{
	   var oChildren = this.childNodes;
	   var aText = [];
	   for ( var i = 0; i < oChildren.length; i++ )
	      aText[i] = oChildren[i].nodeValue;
	   return aText.join("");
	} );

}