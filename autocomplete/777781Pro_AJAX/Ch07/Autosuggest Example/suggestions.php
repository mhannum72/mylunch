<?php
    //plain text header
    header("Content-Type: text/plain; charset=UTF-8");
    
    //database information
    $sDBServer = "your.database.server";
    $sDBName = "your_database_name";
    $sDBUsername = "your_database_username";
    $sDBPassword = "your_database_password";

    //include JSON-PHP and instantiate the object
    require_once("JSON.php");
    $oJSON = new JSON();
    
    //get the data that was posted
    $oData = $oJSON->decode($HTTP_RAW_POST_DATA);
    $aSuggestions = array();

    //make sure there's text
    if (strlen($oData->text) > 0) {

        //create the SQL query string
        $sQuery = "Select Name from ".$oData->requesting." where Name like '".
                  $oData->text."%' order by Name ASC limit 0,".$oData->limit;
              
        //make the database connection
        $oLink = mysql_connect($sDBServer,$sDBUsername,$sDBPassword);
        @mysql_select_db($sDBName) or die("Unable to open database");
        
        if($oResult = mysql_query($sQuery)) {
            while ($aValues = mysql_fetch_array($oResult,MYSQL_ASSOC)) {            
                array_push($aSuggestions, $aValues['Name']);
            }
        }
    
        mysql_free_result($oResult);
        mysql_close($oLink);
        
    }
    
    echo($oJSON->encode($aSuggestions));
?>