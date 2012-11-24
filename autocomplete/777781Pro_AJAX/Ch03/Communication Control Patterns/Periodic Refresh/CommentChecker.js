
var oXmlHttp = null;
var iInterval = 1000;
var iLastCommentId = -1;
var divNotification = null;

function checkComments() {
    if (!oXmlHttp) {
        oXmlHttp = zXmlHttp.createRequest();
    } else if (oXmlHttp.readyState != 0) {
        oXmlHttp.abort();
    }    
    
    oXmlHttp.open("get", "CheckComments.php", true);
    oXmlHttp.onreadystatechange = function () {               
        
        if (oXmlHttp.readyState == 4) {
            if (oXmlHttp.status == 200) {

                var aData = oXmlHttp.responseText.split("||");
                if (aData[0] != iLastCommentId) {                   
                    
                    iLastCommentId = aData[0];
                    
                    if (iLastCommentId != -1) {                        
                        showNotification(aData[1], aData[2]);
                    }
                    
                }
                
                setTimeout(checkComments, iInterval);             
            }                         
        }
    };    

    oXmlHttp.send(null);       

}

function showNotification(sName, sMessage) {
    if (!divNotification) {
        divNotification = document.createElement("div");
        divNotification.className = "notification";
        document.body.appendChild(divNotification);
    }
    
    divNotification.innerHTML = "<strong>New Comment</strong><br />" + sName 
              + " says: " + sMessage + "...<br /><a href=\"ViewComment.php?id=" 
              + iLastCommentId + "\">View</a>";
    divNotification.style.top = document.body.scrollTop + "px";
    divNotification.style.left = document.body.scrollLeft + "px";
    divNotification.style.display = "block";
    setTimeout(function () {
        divNotification.style.display = "none";
    }, 5000);
}

//if Ajax is enabled, assign event handlers and begin fetching
window.onload = function () {
    if (zXmlHttp.isSupported()) {
        checkComments();              
    }
};