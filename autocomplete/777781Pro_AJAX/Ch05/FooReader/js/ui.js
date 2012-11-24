var oSelected;

function varHeight(e) {
    var e = (window.event)?window.event:e;
    
    if (e.type == "load") init();
    
	var innerPage = document.getElementById("divPaneContainer");
	
	if (document.documentElement) {
		var newHeight = document.documentElement.clientHeight - 61 + "px";
		innerPage.style.height = newHeight;
	
	} else if (navigator.userAgent.toLowerCase().indexOf("gecko") > -1) {
		var newHeight = document.body.clientHeight - 47 + "px";
		innerpage.style.height = newHeight;
	}
	
	var myBody = document.getElementById("divMessageBody");
	var myList = document.getElementById("divItemList");
	var myNav  = document.getElementById("divFeedList");
	myBody.style.height = myBody.parentNode.parentNode.offsetHeight - 74 + "px";
	myList.style.height = myList.parentNode.offsetHeight - 56 + "px";
	myNav.style.height = myNav.parentNode.offsetHeight - 37 + "px";
}

function doubleClick() {
	var oItem = oFeed.items[this.getAttribute("frFeedItem")];
	var oWindow = window.open(oItem.link.value);
}

function toggleLoadingDiv(bShow) {
	var oToggleDiv = document.getElementById("divLoading");
	oToggleDiv.style.display = (bShow)?"block":"none";
}