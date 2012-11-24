<html>
    <head>
        <title>JSON-PHP Example</title>
    </head>
    <body>
<?php 
    class Person {
    
        var $age;
        var $hairColor;
        var $name;
        var $siblingNames;
        
        function Person($name, $age, $hairColor) {
            $this->name = $name;
            $this->age = $age;
            $this->hairColor = $hairColor;
            $this->siblingNames = array();
        }    
    }
?>
<?php 
    require_once("JSON.php");
    $oJSON = new JSON();
    
    $oPerson = new Person("Mike", 26, "brown");
    $oPerson->siblingNames[0] = "Matt";
    $oPerson->siblingNames[1] = "Tammy";

    $sOutput = $oJSON->encode($oPerson);
    print($sOutput);
?>            
    </body>
</html>