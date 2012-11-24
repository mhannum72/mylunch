//Universal Test Harness Example

  //handles the request and response
  var oXmlHttp = null;
    
  //This function constructs the SOAP request as a string.
  function getRequest(sMethod, sOp1, sOp2)
  {
    var sRequest = "<soap:Envelope xmlns:xsi=\""
                 + "http://www.w3.org/2001/XMLSchema-instance\" "
                 + "xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" "
                 + "xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n"
                 + "<soap:Body>\n"
                 + "<" + sMethod + " xmlns=\"" + SOAP_ACTION_BASE + "\">\n"
                 + "<op1>" + sOp1 + "</op1>\n"
                 + "<op2>" + sOp2 + "</op2>\n"
                 + "</" + sMethod + ">\n"
                 + "</soap:Body>\n"
                 + "</soap:Envelope>\n";
    return sRequest;                 
  }
  
  function performSpecificOperation(sMethod, sOp1, sOp2)
  {
    oXmlHttp = zXmlHttp.createRequest();
    setUIEnabled(false);    
    var sRequest = getRequest(sMethod, sOp1, sOp2);
    var sSoapActionHeader = SOAP_ACTION_BASE + "/" + sMethod;
    oXmlHttp.open("POST", SERVICE_URL, true);
    oXmlHttp.onreadystatechange = handleResponse;
    oXmlHttp.setRequestHeader("SOAPAction", sSoapActionHeader);
    oXmlHttp.setRequestHeader("Content-Type", "text/xml");
    oXmlHttp.send(sRequest);
    document.getElementById("txtRequest").value = sRequest; 
  }
  
  //This handles the response
  function handleResponse()
  {
    if (oXmlHttp.readyState == 4)
    {
      setUIEnabled(true);
      var oResponseOutput = document.getElementById("txtResponse");
      var oResultOutput = document.getElementById("txtResult");
      var oXmlResponse = oXmlHttp.responseXML;
      var sHeaders = oXmlHttp.getAllResponseHeaders();
      if (oXmlHttp.status != 200 || !oXmlResponse.xml)
      {
        alert("Error accessing Web service.\n"
              + oXmlHttp.statusText
              + "\nSee response pane for further details.");
        var sResponse = (oXmlResponse.xml ? oXmlResponse.xml : oXmlResponseText);        
        oResponseOutput.value = sHeaders + sResponse;
        return;
      }
      oResponseOutput.value = sHeaders + oXmlResponse.xml;
      var sResult = oXmlResponse.documentElement.firstChild.firstChild.firstChild.firstChild.data;
      oResultOutput.value = sResult;
    }
  }  