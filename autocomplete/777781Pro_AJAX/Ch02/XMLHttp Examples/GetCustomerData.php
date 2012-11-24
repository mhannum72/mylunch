<?php
    header("Content-Type: text/plain");
    
    //customer ID
    $sID = $_GET["id"];
    
    //variable to hold customer info
    $sInfo = "";
    
    //database information
    $sDBServer = "your.databaser.server";
    $sDBName = "your_db_name";
    $sDBUsername = "your_db_username";
    $sDBPassword = "your_db_password";

    //create the SQL query string
    $sQuery = "Select * from Customers where CustomerId=".$sID;
              
    //make the database connection
    $oLink = mysql_connect($sDBServer,$sDBUsername,$sDBPassword);
    @mysql_select_db($sDBName) or $sInfo = "Unable to open database";
        
    if($sInfo == '') {
        if($oResult = mysql_query($sQuery) and mysql_num_rows($oResult) > 0) {
            $aValues = mysql_fetch_array($oResult,MYSQL_ASSOC);
            $sInfo = $aValues['Name']."<br />".$aValues['Address']."<br />".
                     $aValues['City']."<br />".$aValues['State']."<br />".
                     $aValues['Zip']."<br /><br />Phone: ".$aValues['Phone']."<br />".
                     "<a href=\"mailto:".$aValues['E-mail']."\">".$aValues['E-mail']."</a>";
        } else {
            $sInfo = "Customer with ID $sID doesn't exist.";
        }
    }
    
    
    mysql_close($oLink);

    echo $sInfo;
?>
