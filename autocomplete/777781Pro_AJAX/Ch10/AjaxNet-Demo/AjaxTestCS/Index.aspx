<%@ Page language="c#" Codebehind="Index.aspx.cs" AutoEventWireup="false" Inherits="AjaxTest.Index" %>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" > 

<html>
  <head>
    <title>Ajax Test</title>
    <meta name="GENERATOR" Content="Microsoft Visual Studio .NET 7.1">
    <meta name="CODE_LANGUAGE" Content="C#">
    <meta name=vs_defaultClientScript content="JavaScript">
    <meta name=vs_targetSchema content="http://schemas.microsoft.com/intellisense/ie5">
  </head>
  <body MS_POSITIONING="GridLayout">
	
    <form id="Form1" method="post" runat="server">

      <script type="text/javascript">
        var callback = function (response)
                       {
                         if (response.error)
                         {
                           alert(response.error);
                         }
                         else
                         {
                           alert(response.context + response.value);
                         }
                       }        
        Index.Add(6, 8, callback, "6 + 8 = ");
        Index.Add(9, 2, callback, "9 + 2 = ");
      </script>
    </form>
	
  </body>
</html>
