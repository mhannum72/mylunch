<?php
    require_once("inc/config.inc.php");
    require_once("inc/phpmailer/class.phpmailer.php");
    require_once("inc/phpmailer/class.smtp.php");    
    require_once("inc/JSON.php");
    require_once("inc/AjaxMail.inc.php");
    
    //headers
    header("Content-Type: text/plain");
    header("Cache-control: No-Cache");
    header("Pragma: No-Cache");

    //get information
    $to = $_POST["txtTo"];
    $cc = $_POST["txtCC"];
    $subject = $_POST["txtSubject"];
    $message = $_POST["txtMessage"];

    //create new mailbox
    $mailbox = new AjaxMailbox();

    //create JSON object in case its needed
    $oJSON = new JSON();
    
    //send the mail
    $response = $mailbox->sendMail($to, $subject, $message, $cc);
    $output = $oJSON->encode($response);      
    echo $output;    
?>