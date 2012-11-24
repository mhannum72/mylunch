
function downloadLinks() {
    var oXmlHttp = zXmlHttp.createRequest();
    
    oXmlHttp.open("get", "AdditionalLinks.txt", true);
    oXmlHttp.onreadystatechange = function () {
        if (oXmlHttp.readyState == 4) {
            if (oXmlHttp.status == 200) {
                var divAdditionalLinks = document.getElementById("divAdditionalLinks");
                divAdditionalLinks.innerHTML = oXmlHttp.responseText;  
                divAdditionalLinks.style.display = "block";          
            } 
        }    
    }
    oXmlHttp.send(null);
}

window.onload = function () {
    if (zXmlHttp.isSupported()) {        
        downloadLinks();                  
    }
};