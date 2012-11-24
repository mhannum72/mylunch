function AjaxWeatherWidget(oElement) {
    this.element = (oElement)?oElement:document.body;
    this.lastModified = null;
	
    this.getWeather();	
}

AjaxWeatherWidget.prototype.getWeather = function () {
	var oThis = this;
	
	var doTimeout = function () {
		oThis.getWeather();
	};
	
	var oReq = zXmlHttp.createRequest();
    oReq.onreadystatechange = function () {
        if (oReq.readyState == 4) {
            if (oReq.status == 200) {
				var lastModified = oReq.getResponseHeader("Weather-Modified");
				
				if (lastModified != oThis.lastModified) {
					oThis.lastModified = lastModified;
					oThis.element.innerHTML = oReq.responseText;
				}
			}
        }
    };
    
    oReq.open("GET", "weather.aspx", true);
    oReq.send(null);
    
    setTimeout(doTimeout,60000);
};