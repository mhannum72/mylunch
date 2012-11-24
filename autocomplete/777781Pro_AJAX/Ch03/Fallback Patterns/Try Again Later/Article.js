
var iFailed = 0;

function downloadLinks() {
    var oXmlHttp = zXmlHttp.createRequest();
    
    if (iFailed < 10) {
        try {
            oXmlHttp.open("get", "AdditionalLinks.txt", true);
            oXmlHttp.onreadystatechange = function () {
                if (oXmlHttp.readyState == 4) {
                    if (oXmlHttp.status == 200) {
                        var divAdditionalLinks = document.getElementById("divAdditionalLinks");
                        divAdditionalLinks.innerHTML = oXmlHttp.responseText;  
                        divAdditionalLinks.style.display = "block";          
                    } else {
                        throw new Error("An error occurred.");
                    }
                }    
            }
            
            oXmlHttp.send(null);
        } catch (oException) {
            iFailed++;
            downloadLinks();
        }        
    }
}

window.onload = function () {
    if (zXmlHttp.isSupported()) {        
        downloadLinks();                  
    }
};