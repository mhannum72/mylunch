var feedsFile;

function FeedsFile() {
	var oThis = this;
	var oXmlDom = zXmlDom.createDocument();
	
	this.sections = [];
	this.onload = null;
	
	oXmlDom.load("feeds.xml");
	oXmlDom.onreadystatechange = function () {
		if (oXmlDom.readyState == 4) {
			var oSections = oXmlDom.documentElement.getElementsByTagName("section");

			for (var i = 0; i < oSections.length; i++) {
				oThis.sections[i] = new FeedsFileElement(oSections[i]);
			}
		}
		
		if (typeof oThis.onload == "function") {
			oThis.onload();
		}
		oXmlDom = null;
	};
		
	this.getLinkByFileName = function (sFileName) {
		for (var i = 0; i < this.sections.length; i++) {
			var section = this.sections[i];
			for (var j = 0; j < section.links.length; j++) {
				var link = section.links[j];
				if (sFileName.toLowerCase() == link.fileName.toLowerCase())
					return link;
			}
		}
		alert("Cannot fine the specified feed information.");
		return this.sections[0].link[0];
	};
}

function FeedsFileElement(oNode) {
	if (oNode.tagName.toLowerCase() == "section") {
		this.links = [];
		var linkNodes = oNode.getElementsByTagName("link");
		for (var i = 0; i < linkNodes.length; i++) {
			this.links[i] = new FeedsFileElement(linkNodes[i]);
		}
	} else {
		this.fileName = oNode.getAttribute("filename");
	}
	this.name = oNode.getAttribute("name");
}