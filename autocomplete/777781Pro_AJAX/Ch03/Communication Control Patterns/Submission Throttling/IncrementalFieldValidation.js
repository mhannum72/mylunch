
var oXmlHttp = null;
var iTimeoutId = null;

//function to validate fields
function validateField(oEvent) {
    oEvent = oEvent || window.event;
    var txtField = oEvent.target || oEvent.srcElement;
    
    var btnNext = document.getElementById("btnNext");
    btnNext.disabled = true;    
    
    if (iTimeoutId != null) {
        clearTimeout(iTimeoutId);
        iTimeoutId = null;
    }
    
    if (!oXmlHttp) {
        oXmlHttp = zXmlHttp.createRequest();
    } else if (oXmlHttp.readyState != 0) {
        oXmlHttp.abort();
    }
    
    oXmlHttp.open("get", "ValidateForm.php?" + txtField.name + "=" + encodeURIComponent(txtField.value), true);
    oXmlHttp.onreadystatechange = function () {               
        
        if (oXmlHttp.readyState == 4) {
            if (oXmlHttp.status == 200) {
                var arrInfo = oXmlHttp.responseText.split("||");
                var imgError = document.getElementById("img" + txtField.id.substring(3) + "Error");
                
                if (!eval(arrInfo[0])) {
                    imgError.title = arrInfo[1];
                    imgError.style.display = "";
                    txtField.valid = false;                    
                } else {
                    imgError.style.display = "none";
                    txtField.valid = true;
                }
                
                btnNext.disabled = !txtField.valid;
            } else {
                alert("An error occurred while trying to contact the server.");
            }
        }
    };
    
    iTimeoutId = setTimeout(function () {
        oXmlHttp.send(null);
    }, 500);
};


//if Ajax is enabled, disable the submit button and assign event handlers
window.onload = function () {
    if (zXmlHttp.isSupported()) {
        var btnNext = document.getElementById("btnNext");        
        var txtUsername = document.getElementById("txtUsername");

        btnNext.disabled = true;
        txtUsername.onkeyup = validateField;
        txtUsername.onchange = validateField;
        txtUsername.valid = false;        
    }
};