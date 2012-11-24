  var iCallId = 0;
  function performSpecificOperation(sMethod, sOp1, sOp2)
  {
    var oServiceHandler = document.getElementById("divServiceHandler");
    if (!oServiceHandler.Math)
    {
      oServiceHandler.useService(SERVICE_URL + "?WSDL", "Math");
    }
    iCallId = oServiceHandler.Math.callService(handleResponseFromBehavior,
                                                sMethod, sOp1, sOp2);
  }

  
  //This handles the response
  function handleResponseFromBehavior(oResult)
  {
    var oResponseOutput = document.getElementById("txtResponse");
    if (oResult.error)
    {
      var sErrorMessage = oResult.errorDetail.code
                        + "\n" + oResult.errorDetail.string;
      alert("An error occurred:\n"
            + sErrorMessage
            + "See message pane for SOAP fault.");      
      oResponseOutput.value = oResult.errorDetail.raw.xml;
    }
    else
    {
      var oResultOutput = document.getElementById("txtResult");
      oResultOutput.value = oResult.value;
      oResponseOutput.value = oResult.raw.xml;
    }
  }
