<%@ Page language="c#" Codebehind="Customer-AjaxNet.aspx.cs" AutoEventWireup="false" Inherits="AjaxTest.Customer_AjaxNet" %>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" > 

<html>
  <head>
    <title>Customer-AjaxNet</title>
    <meta name="GENERATOR" Content="Microsoft Visual Studio .NET 7.1">
    <meta name="CODE_LANGUAGE" Content="C#">
    <meta name=vs_defaultClientScript content="JavaScript">
    <meta name=vs_targetSchema content="http://schemas.microsoft.com/intellisense/ie5">
  </head>
  <body MS_POSITIONING="GridLayout">
	
  <form id="Form1" method="post" runat="server">
    <script type="text/javascript">
      function fetchAddress(Email)
      {
        if (!Email)
        {
          alert("Please enter your email address before choosing an item.");
          document.getElementById("txtEmail").focus();
          return;
        }
        Customer.GetAddressFromEmail(Email, callback);
      }

      var callback = function (Response)
                     {
                       showAddress(Response);
                     };

      function showAddress(Response)
      {    
        if (Response.error)
        {
          alert("Unable to retrieve address.\n(" + Response.error + ")");
          return;
        }
        var Address = getAddressFromResponse(Response);
        document.getElementById("txtForenames").value = replaceIfNull(Address["forenames"], "");
        document.getElementById("txtSurname").value = replaceIfNull(Address["surname"], "");
        document.getElementById("txtAddress1").value = replaceIfNull(Address["address1"], "");
        document.getElementById("txtAddress2").value = replaceIfNull(Address["address2"], "");
        document.getElementById("txtAddress3").value = replaceIfNull(Address["address3"], "");
        document.getElementById("txtAddressTown").value = replaceIfNull(Address["addressTown"], "");
        document.getElementById("txtAddressStateCounty").value = replaceIfNull(Address["addressStateCounty"], "");
        document.getElementById("txtAddressZipPC").value = replaceIfNull(Address["addressZipPC"], "");
        document.getElementById("txtAddressCountry").value = replaceIfNull(Address["addressCountry"], "");
        if (!Address["success"])
        {
          alert("Address not registered, please fill in details.");       
          document.getElementById("txtForenames").focus();
        }
      }
      
      function getAddressFromResponse(Response)
      {
        var address = new Object();
        var data = Response.value;
        for (var i = 0; i < data.length; i++)
        {
          address[data[i].Key] = data[i].Value;
        }
        return address;
      }
      
      function replaceIfNull(Value, ReplaceWith)
      {
        if (Value == null)
        {
          return ReplaceWith;
        }
        return Value;
      }

    </script>
        <table width="60%" align="left">
    <tbody>
      <tr>
        <td width="25%">Enter your email address:</td>
        <td width="75%">
          <input type="text" id="txtEmail" size="30"
                 value="hmqueen412@yahoo.com" 
                 onblur="fetchAddress(document.getElementById('txtEmail').value);">
        </td>
      </tr>
      <tr>
      <tr>
        <td>Choose an item:</td>
        <td>
          <select>
            <option>Lear Jet</option>
            <option>Rolls Royce Car</option>
            <option>Luxury Yacht</option>
            <option>Wrox Book</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>Forenames:</td>
        <td><input type="text" id="txtForenames" size="50"></td>
      </tr>
      <tr>
        <td>Surname:</td>
        <td><input type="text" id="txtSurname" size="50"></td>
      </tr>
      <tr>
        <td>Address 1:</td>
        <td><input type="text" id="txtAddress1" size="50"></td>
      </tr>
      <tr>
        <td>Address 2:</td>
        <td><input type="text" id="txtAddress2" size="50"></td>
      </tr>
      <tr>
        <td>Address 3:</td>
        <td><input type="text" id="txtAddress3" size="50"></td>
      </tr>
      <tr>
        <td>Town/City:</td>
        <td><input type="text" id="txtAddressTown" size="50"></td>
      </tr>
      <tr>
        <td>State/County:</td>
        <td><input type="text" id="txtAddressStateCounty" size="50"></td>
      </tr>
      <tr>
        <td>ZIP/Post Code:</td>
        <td><input type="text" id="txtAddressZipPC" size="50"></td>
      </tr>
      <tr>
        <td>Country:</td>
        <td><input type="text" id="txtAddressCountry" size="50"></td>
      </tr>
    </tbody>
  </table>
     </form>
	
  </body>
</html>
