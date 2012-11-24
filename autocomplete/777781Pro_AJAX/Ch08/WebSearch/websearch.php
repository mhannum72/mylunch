<?php
header("Content-Type: text/xml");
header("Cache-Control: no-cache");


if ( isset( $_GET["search"] ) ) {

    $searchTerm = urlencode(stripslashes($_GET["search"]));
    
    $url = "http://search.msn.com/results.aspx?q=$searchTerm&format=rss";
    
    $xml = file_get_contents($url);
    
    echo $xml; 
}
?>