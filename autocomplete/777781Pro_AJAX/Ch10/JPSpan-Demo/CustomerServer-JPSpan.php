<?php

class Customer
{
  //Business class to be included here
  public function getAddressFromEmail($email)
  {
    //Customer class implementation to be included here
    $address = array("success" => FALSE);
   
    $conn = new COM("Adodb.Connection");           
    //Connection details for Microsoft Access database
    //$dbPath = realpath('sales.mdb');
    //$dbConnString = "Provider=Microsoft.Jet.OLEDB.4.0; Data Source='$dbPath';";
    //Connection details for SQL Server database
    $dbConnString = "Provider=SQLOLEDB; Data Source='localhost'; "
                  . "Initial Catalog='sales'; User Id='Test'; Password='test';";
    $conn->connectionString = $dbConnString; 
    $conn->open();
    $safeEmail = str_replace('\'', '\'\'', $email);
    $rs = $conn->execute("SELECT * FROM tblCustomer WHERE Email = '$safeEmail'");
    if (!$rs->EOF)
    {
      $address['success'] = TRUE;
      $address['forenames'] = $rs->fields(1)->value;
      $address['surname'] = $rs->fields(2)->value;  
      $address['address1'] = $rs->fields(4)->value;  
      $address['address2'] = $rs->fields(5)->value;  
      $address['address3'] = $rs->fields(6)->value;  
      $address['addressTown'] = $rs->fields(7)->value;  
      $address['addressStateCounty'] = $rs->fields(8)->value;  
      $address['addressZipPC'] = $rs->fields(9)->value;  
      $address['addressCountry'] = $rs->fields(10)->value;  
    }
    $rs->close();
    $conn->close();
    return $address;
  }  
} 


// Including this sets up the JPSPAN constant
require_once '../JPSpan/JPSpan.php';
    
// Load the PostOffice server
require_once JPSPAN . 'Server/PostOffice.php';
    
// Create the PostOffice server
$PostOffice = & new JPSpan_Server_PostOffice();
    
// Register the Customer class with it...
$PostOffice->addHandler(new Customer());
 
// This allows the JavaScript to be seen by
// just adding ?client to the end of the
// server's URL
    
if (isset($_SERVER['QUERY_STRING']) && strcasecmp($_SERVER['QUERY_STRING'], 'client') == 0)
{
    
  // Compress the output Javascript feature (e.g. strip whitespace)
  // turn this off it has performance problems
  define('JPSPAN_INCLUDE_COMPRESS', false);
    
  // Display the Javascript client
  $PostOffice->displayClient();
    
}
else
{    
  // This is where the real serving happens...
  // Include error handler
  // PHP errors, warnings and notices serialized to JS
  require_once JPSPAN . 'ErrorHandler.php';
  
  // Start serving requests...
  $PostOffice->serve();    
}

?>