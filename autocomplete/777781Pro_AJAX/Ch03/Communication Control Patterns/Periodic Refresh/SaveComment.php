<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">

<html>
<head>
    <title>Save Comment</title>
<?php
    //get information
    $sName = $_POST["txtName"];
    $sMessage = $_POST["txtMessage"];
    
    $sStatus = "";
        
    //database information
    $sDBServer = "your.database.server";
    $sDBName = "your_db_name";
    $sDBUsername = "your_db_username";
    $sDBPassword = "your_db_password";

    //create the SQL query string
    $sSQL = "Insert into BlogComments(BlogEntryId,Name,Message,Date) ".
              " values (0,'$sName','$sMessage',NOW())";

    $oLink = mysql_connect($sDBServer,$sDBUsername,$sDBPassword);
    @mysql_select_db($sDBName) or $sStatus = "Unable to open database";
        
    if($oResult = mysql_query($sSQL)) {
        $sStatus = "Added comment; comment ID is ".mysql_insert_id();
     } else {
        $sStatus = "An error occurred while inserting; comment not saved.";
    }
    
    mysql_free_result($oResult);
    mysql_close($oLink);
?>
</head>
<body>
    <?php echo $sStatus ?>
</body>
</html>
