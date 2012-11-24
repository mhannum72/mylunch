function AjaxSiteSearch(oElement) {
	var oThis = this;
	this.result = null;
	
	this.widgetContainer = document.createElement("div");
	this.form = document.createElement("form");
	this.textBox = document.createElement("input");
	this.submitButton = document.createElement("input");
	this.resultPane = document.createElement("div");
	
	this.widgetContainer.className = "ajaxSiteSearchContainer";
	this.form.className = "ajaxSiteSearchForm";
	this.textBox.className = "ajaxSiteSearchTextBox";
	this.submitButton.className = "ajaxSiteSearchButton";
	this.resultPane.className = "ajaxSiteSearchResultPane";
	
	this.submitButton.type = "submit";
	this.submitButton.value = "Go";
	
	this.form.onsubmit = function () {
		oThis.clearResults();
		
		if (oThis.textBox.value != "") {
			oThis.search();
		} else {
			alert("Please enter a search term");
		}
		return false;
	};
	
	this.form.appendChild(this.textBox);
	this.form.appendChild(this.submitButton);
	this.widgetContainer.appendChild(this.form);
	this.widgetContainer.appendChild(this.resultPane);
	
	var oToAppend = (oElement)?oElement:document.body;
    oToAppend.appendChild(this.widgetContainer);
}

AjaxSiteSearch.prototype.search = function () {
	var oThis = this;
	var sUrl = encodeURI("search.aspx?search=" + this.textBox.value);
	
	var oReq = zXmlHttp.createRequest();
	oReq.onreadystatechange = function () {
		if (oReq.readyState == 4) {
			// only if "OK"
			if (oReq.status == 200) {
				oThis.handleResponse(oReq.responseText);
			}
		}
	};
	
	oReq.open("GET", sUrl, true);
	oReq.send(null);
};

AjaxSiteSearch.prototype.clearResults = function () {
	while (this.resultPane.hasChildNodes()) {
		this.resultPane.removeChild(this.resultPane.firstChild);
	}
};

AjaxSiteSearch.prototype.handleResponse = function (sJson) {
	this.result = JSON.parse(sJson);
		
	if (this.result.length > 0) {
		var oFragment = document.createDocumentFragment();
		for (var i = 0; i < this.result.length; i++) {
			var linkResult = document.createElement("a");
			linkResult.href = "http://yoursite.com/" + this.result[i].id;
			linkResult.innerHTML = this.result[i].title;
			linkResult.className = "ajaxSiteSearchLink";
			oFragment.appendChild(linkResult);
		}
		
		this.resultPane.appendChild(oFragment);
	} else {
		alert("Your search returned no results.");
	}
};