
//function to validate fields
function validateField(oEvent) {
    oEvent = oEvent || window.event;
    var txtField = oEvent.target || oEvent.srcElement;
    var oXmlHttp = zXmlHttp.createRequest();
    oXmlHttp.open("get", "ValidateForm.php?" + txtField.name + "=" + encodeURIComponent(txtField.value), true);
    oXmlHttp.onreadystatechange = function () {
        if (oXmlHttp.readyState == 4) {
            if (oXmlHttp.status == 200) {
                var arrInfo = oXmlHttp.responseText.split("||");
                var imgError = document.getElementById("img" + txtField.id.substring(3) + "Error");
                var btnSignUp = document.getElementById("btnSignUp");
                
                if (!eval(arrInfo[0])) {
                    imgError.title = arrInfo[1];
                    imgError.style.display = "";
                    txtField.valid = false;                    
                } else {
                    imgError.style.display = "none";
                    txtField.valid = true;
                }
                
                btnSignUp.disabled = !isFormValid();
            } else {
                alert("An error occurred while trying to contact the server.");
            }
        }
    };
    oXmlHttp.send(null);
};

function isFormValid() {
    var frmMain = document.forms[0];
    var blnValid = true;

    for (var i=0; i < frmMain.elements.length; i++) {        
        if (typeof frmMain.elements[i].valid == "boolean") {
            blnValid = blnValid && frmMain.elements[i].valid;            
        }
    }
    
    return blnValid;
}

//if Ajax is enabled, disable the submit button and assign event handlers
window.onload = function () {
    if (zXmlHttp.isSupported()) {
        var btnSignUp = document.getElementById("btnSignUp");        
        var txtUsername = document.getElementById("txtUsername");
        var txtBirthday = document.getElementById("txtBirthday");
        var txtEmail = document.getElementById("txtEmail");

        btnSignUp.disabled = true;
        txtUsername.onchange = validateField;
        txtBirthday.onchange = validateField;
        txtEmail.onchange = validateField;
        txtUsername.valid = false;
        txtBirthday.valid = false;
        txtEmail.valid = false;
        
    }
};