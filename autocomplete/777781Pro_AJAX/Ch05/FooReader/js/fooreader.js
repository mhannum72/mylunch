var oFeed;

function init() {
	var divFeedList = document.getElementById("divFeedList");
    var oFragment = document.createDocumentFragment();
    
    feedsFile = new FeedsFile();
    feedsFile.onload = function () {
		for (var i = 0; i < feedsFile.sections.length; i++) {
			var section = feedsFile.sections[i];
			var oSpan = document.createElement("span");
			oSpan.appendChild(document.createTextNode(section.name));
			oSpan.className = "navheading";
			
			var oIcon = document.createElement("img");
			oIcon.src = "img/category_icon.gif";
			oIcon.border = "0";
			

			oFragment.appendChild(oIcon);
			oFragment.appendChild(oSpan);
		
			var oUl = document.createElement("ul");
			oUl.className = "navlist";
			for (var j = 0; j < section.links.length; j++) {
				var link = section.links[j];
				var oLi = document.createElement("li");
				var oA = document.createElement("a");
				oA.appendChild(document.createTextNode(link.name));
				oA.href = "#";
				oA.onclick = loadFeed;
				oA.className = "navlinks";
				oA.title="Load " + link.name;
				oA.setAttribute("frFileName",link.fileName);
				
				oLi.appendChild(oA);
				oUl.appendChild(oLi);
			} 
			oFragment.appendChild(oUl);
			divFeedList.appendChild(oFragment);
		}
		loadFeed(feedsFile.sections[0].links[0].fileName);
	};
}
   
function loadFeed(sFileName) {
	sFileName = (typeof sFileName == "string")?sFileName:this.getAttribute("frFileName");
	var divItemList = document.getElementById("divItemList");
	var divViewingItem = document.getElementById("divViewingItem");
	var oFragment = document.createDocumentFragment();
	var sTitle = feedsFile.getLinkByFileName(sFileName).name;
	toggleLoadingDiv(true);
	
	while (divItemList.hasChildNodes()) {
		divItemList.removeChild(divItemList.lastChild);
	}

	sFileName = "xml.aspx?xml=" + sFileName;
	oFeed = new XParser(sFileName);
	oFeed.onload = function () {
		divViewingItem.innerHTML = sTitle + " ("+oFeed.type+")";
		for (var i = 0; i < oFeed.items.length; i++) {
			var oItem = oFeed.items[i];
			var oA = document.createElement("A");
			oA.className = "itemlink";
			oA.href = "#";
			oA.onclick = itemClick;
			oA.ondblclick = doubleClick;
			oA.setAttribute("frFeedItem",i);
			oA.id = "oA" + i;
            
			var oHeadline = document.createElement("DIV");
			oHeadline.className = "itemheadline";
			oHeadline.innerHTML = oItem.title.value;
			//oHeadline.appendChild(document.createTextNode());

			var oDate = document.createElement("DIV");
			oDate.className = "itemdate";
			oDate.appendChild(document.createTextNode("Date: " + oItem.date.value));
			oA.appendChild(oHeadline);
			oA.appendChild(oDate);
			
			oFragment.appendChild(oA);
		}
		divItemList.appendChild(oFragment);
		itemClick(0);
		toggleLoadingDiv();
	};
	return false;
}
   
function itemClick(iItem) {
	iItem = (typeof iItem == "number")?iItem:this.getAttribute("frFeedItem");
	var el = document.getElementById("oA"+iItem);
	if (oSelected != el) {
		if (oSelected) oSelected.className = "itemlink";
		el.className += "-selected";
		oSelected = el;
		var divTitle = document.getElementById("divMessageTitle");
		var divBody = document.getElementById("divMessageBody");
		var aLink = document.getElementById("aMessageLink");
		var oItem = oFeed.items[iItem];
		divTitle.innerHTML = oItem.title.value;
		aLink.href = oItem.link.value;
		divBody.innerHTML = oItem.description.value;
	}
	return false;
}

window.onload = varHeight;
window.onresize = varHeight;
