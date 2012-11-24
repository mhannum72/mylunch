<?php

    header("Content-Type: text/plain");
    
    //get information
    $sName = $_POST["txtName"];
    $sAddress = $_POST["txtAddress"];
    $sCity = $_POST["txtCity"];
    $sState = $_POST["txtState"];
    $sZipCode = $_POST["txtZipCode"];
    $sPhone = $_POST["txtPhone"];
    $sEmail = $_POST["txtEmail"];
    
    //status message
    $sStatus = "";
        
    //database information
    $sDBServer = "your.databaser.server";
    $sDBName = "your_db_name";
    $sDBUsername = "your_db_username";
    $sDBPassword = "your_db_password";


    //create the SQL query string
    $sSQL = "Insert into Customers(Name,Address,City,State,Zip,Phone,`E-mail`) ".
              " values ('$sName','$sAddress','$sCity','$sState', '$sZipCode'".
              ", '$sPhone', '$sEmail')";

    $oLink = mysql_connect($sDBServer,$sDBUsername,$sDBPassword);
    @mysql_select_db($sDBName) or $sStatus = "Unable to open database";
        
    if ($sStatus == '') {
        if($oResult = mysql_query($sSQL)) {
            $sStatus = "Added customer; customer ID is ".mysql_insert_id();
         } else {
            $sStatus = "An error occurred while inserting; customer not saved.";
        }
    }
    
    mysql_close($oLink);
    
    echo $sStatus;
?>