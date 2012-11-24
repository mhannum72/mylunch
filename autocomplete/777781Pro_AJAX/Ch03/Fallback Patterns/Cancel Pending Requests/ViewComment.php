<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>
        <title>Comment</title>
    </head>
    <body>
<?php       
    
    //database information
    $sDBServer = "your.database.server";
    $sDBName = "your_db_name";
    $sDBUsername = "your_db_username";
    $sDBPassword = "your_db_password";
    $commentId = $_GET["id"];

    //create the SQL query string
    $sSQL = "select Name,Message from BlogComments where CommentId=$commentId";

    $oLink = mysql_connect($sDBServer,$sDBUsername,$sDBPassword);
    @mysql_select_db($sDBName) or $sStatus = "Unable to open database";
        
    if($oResult = mysql_query($sSQL) and mysql_num_rows($oResult) > 0) {
        $aValues = mysql_fetch_array($oResult,MYSQL_ASSOC);
    }
    
    mysql_free_result($oResult);
    mysql_close($oLink);
?>
        <p>Comment from <?php echo $aValues["Name"] ?>:</p>
        <p><?php echo $aValues["Message"] ?></p>
    </body>
 </html>