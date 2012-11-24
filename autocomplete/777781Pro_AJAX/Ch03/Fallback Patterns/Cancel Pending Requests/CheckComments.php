<?php       
    header("Cache-control: No-Cache");
    header("Pragma: No-Cache");
    
    //database information
    $sDBServer = "your.database.server";
    $sDBName = "your_db_name";
    $sDBUsername = "your_db_username";
    $sDBPassword = "your_db_password";

    //create the SQL query string
    $sSQL = "select CommentId,Name,LEFT(Message, 50) as ShortMessage from BlogComments order by Date desc limit 0,1";

    $oLink = mysql_connect($sDBServer,$sDBUsername,$sDBPassword);
    @mysql_select_db($sDBName) or die("-1|| || ");
        
    if($oResult = mysql_query($sSQL) and mysql_num_rows($oResult) > 0) {
        $aValues = mysql_fetch_array($oResult,MYSQL_ASSOC);
        echo $aValues['CommentId']."||".$aValues['Name']."||".$aValues['ShortMessage'];
    } else {
        echo "-1|| || ";
    }
    
    mysql_free_result($oResult);
    mysql_close($oLink);
?>