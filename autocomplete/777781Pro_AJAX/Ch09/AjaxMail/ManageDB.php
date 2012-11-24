<?php

    if (isset($_POST["action"])) {
    
        require_once("inc/config.inc.php");
        require_once("inc/pop3lib/pop3.class.php");
        require_once("inc/pop3lib/pop3message.class.php");
        require_once("inc/pop3lib/pop3header.class.php");
        require_once("inc/pop3lib/pop3attachment.class.php");
        require_once("inc/AjaxMail.inc.php");
        
        $mailbox = new AjaxMailbox();
    
        switch ($_POST["action"]) {
            case "Clear Database":
                $mailbox->clearAll();
                break;
            case "Retrieve E-mails":
                $mailbox->checkMail();
                break;
        }       
    }

?>
<html>
    <head>
        <title>Manage AjaxMail Database</title>
    </head>
    <body>
        <form method="post">
            <input type="submit" name="action" value="Clear Database" /><br />
            <input type="submit" name="action" value="Retrieve E-mails" />            
        </form>    
    </body>
</html>