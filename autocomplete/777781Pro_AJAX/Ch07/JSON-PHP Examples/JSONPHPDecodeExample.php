<html>
    <head>
        <title>JSON-PHP Example</title>
    </head>
    <body>
<?php 
    require_once("JSON.php");
    $oJSON = new JSON();
    
    $sJSONText = " {\"age\":26,\"hairColor\":\"brown\",\"name\":\"Mike\",\"siblingNames\":[\"Matt\",\"Tammy\"]}";
    
    $oPerson = $oJSON->decode($sJSONText);

    print("<h3>Person Information</h3>");
    print("<p>Name: ".$oPerson->name."<br />");
    print("Age: ".$oPerson->age."<br />");
    print("Hair Color: ".$oPerson->hairColor."<br />");
    print("Sibling Names:</p><ul>");
    
    for ($i=0; $i < count($oPerson->siblingNames); $i++) {
        print("<li>".$oPerson->siblingNames[$i]."</li>");
    }
    
    print("</ul>");
    
?>            
    </body>
</html>