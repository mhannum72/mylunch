<?php
header("Content-Type: text/xml");
header("Cache-Control: no-cache");


if ( isset( $_GET["url"] ) ) {

    $remoteUrl = $_GET["url"];
    
    $xml = file_get_contents($remoteUrl);
    
    echo $xml; 
}
?>