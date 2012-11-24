function performSpecificOperation(sMethod, sOp1, sOp2)
{
  var oSoapCall = new SOAPCall();
  oSoapCall.transportURI = SERVICE_URL;
  oSoapCall.actionURI = SOAP_ACTION_BASE + "/" + sMethod;
  var aParams = [];
  var oParam = new SOAPParameter(sOp1, "op1");
  oParam.namespaceURI = SOAP_ACTION_BASE;
  aParams.push(oParam);
  oParam = new SOAPParameter(sOp2, "op2");
  oParam.namespaceURI = SOAP_ACTION_BASE;
  aParams.push(oParam);
  oSoapCall.encode(0, sMethod, SOAP_ACTION_BASE, 0, null, aParams.length, aParams);
  var oSerializer = new XMLSerializer();
  document.getElementById("txtRequest").value = 
                        oSerializer.serializeToString(oSoapCall.envelope);                    
  setUIEnabled(false);
  
  //more code here
  oSoapCall.asyncInvoke(
                          function (oResponse, oCall, iError)
                          {
                            var oResult = handleResponse(oResponse, oCall, iError);
                            showSoapResults(oResult);
                          }
                        );
  
}

function handleResponse(oResponse, oCall, iError)
{
  setUIEnabled(true);
  if (iError != 0)
  { 
    alert("Unrecognized error.");
    return false;
  }
  else
  {
    var oSerializer = new XMLSerializer();                          
    document.getElementById("txtResponse").value = 
                    oSerializer.serializeToString(oResponse.envelope);
    var oFault = oResponse.fault; 
    if (oFault != null)
    { 
      var sName = oFault.faultCode; 
      var sSummary = oFault.faultString; 
      alert("An error occurred:\n"  + sSummary
                                + "\n" + sName
                                + "\nSee message pane for SOAP fault");
      return false;
    }
    else
    {
      return oResponse;
    }
  }
}
  
function showSoapResults(oResult)
{
  
  if (!oResult) return;       
  document.getElementById("txtResult").value = oResult.body.firstChild.firstChild.firstChild.data;
}



