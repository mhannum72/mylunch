function NewsTicker(oAppendTo) {
    var oThis = this;
    this.timer = null;
    this.feeds = [];
    this.tickerContainer = document.createElement("div");
    this.ticker = document.createElement("nobr");

    this.tickerContainer.className = "newsTickerContainer";
    this.ticker.className = "newsTicker";

    this.tickerContainer.onmouseover = function () {
        clearTimeout(oThis.timer);
    };

    this.tickerContainer.onmouseout = function () {
        oThis.tick();
    };

    this.tickerContainer.appendChild(this.ticker);

    var oToAppend = (oAppendTo)?oAppendTo:document.body;
    oToAppend.appendChild(this.tickerContainer);

    this.ticker.style.left = this.tickerContainer.offsetWidth + "px";
    this.tick();
}
	    
	    
NewsTicker.prototype.tick = function () {
    var iTickerLength = this.ticker.offsetWidth;
    var oThis = this;

    var doSetTimeout = function() {
        oThis.tick();
    };

    if (this.ticker.innerHTML) {
        if (this.ticker.offsetLeft > -iTickerLength) {
            var iNewLeft = this.ticker.offsetLeft - 1;
            this.ticker.style.left = iNewLeft + "px";
        } else {
            this.ticker.style.left = this.tickerContainer.offsetWidth + "px";
        }
    }
    this.timer = setTimeout(doSetTimeout,1);
};
	    
NewsTicker.prototype.add = function (sUrl) {
    var feedsLength = this.feeds.length;

    this.feeds[feedsLength] = new NewsTickerFeed(this,sUrl);
};
	    
function NewsTickerFeed(oParent,sUrl) {
    this.parent = oParent;
    this.url = sUrl;
    this.container = null;

    this.poll();
}
	    
NewsTickerFeed.prototype.poll = function () {
    var oThis = this;

    var oReq = zXmlHttp.createRequest();
	    oReq.onreadystatechange = function () {
		if (oReq.readyState == 4) {
		    if (oReq.status == 200) {
                oThis.populateTicker(oReq.responseText);
            }
        }
    };
		    
    var sFullUrl = encodeURI("newsticker.php?url=" + this.url);
		    
    oReq.open("GET", sFullUrl, true);
    oReq.send(null);
		    
    var doSetTimeout = function () {
        oThis.poll();
    };
		    
    setTimeout(doSetTimeout, 90000);
};
	    
NewsTickerFeed.prototype.populateTicker = function (sXml) {
    var oParser = new XParser(sXml, true);

    var spanLinkContainer = document.createElement("span");

    var aFeedTitle = document.createElement("a");
    aFeedTitle.className = "newsTicker-feedTitle";
    aFeedTitle.href = oParser.link.value;
    aFeedTitle.target = "_new";
    aFeedTitle.innerHTML = oParser.title.value;


    spanLinkContainer.appendChild(aFeedTitle);

    for (var i = 0; i < oParser.items.length; i++) {
        var item = oParser.items[i];
    
        var aFeedLink = document.createElement("a");
        aFeedLink.href = item.link.value;
        aFeedLink.target = "_new";
        aFeedLink.className = "newsTicker-feedItem";
        aFeedLink.innerHTML = item.title.value;
    
        spanLinkContainer.appendChild(aFeedLink);
    }
	  	    
    if (!this.container) {
        this.container = document.createElement("span");
        this.container.className = "newsTicker-feedContainer";
        this.parent.ticker.appendChild(this.container);
    } else {
        this.container.removeChild(this.container.firstChild);
    }

    this.container.appendChild(spanLinkContainer);
};