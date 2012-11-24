<?php
    $valid = "false";
    $message = "An unknown error occurred.";

    if (isset($_GET["txtUsername"])) {
    
        //load array of usernames
        $usernames = array();
        $usernames[] = "SuperBlue";
        $usernames[] = "Ninja123";
        $usernames[] = "Daisy1724";
        $usernames[] = "NatPack";
        
        //check usernames
        if (in_array($_GET["txtUsername"], $usernames)) {
            $message = "This username already exists. Please choose another.";
        } else if (strlen($_GET["txtUsername"]) < 8) {
            $message = "Username must be at least 8 characters long.";
        } else {
            $valid = "true";
            $message = "";
        }
    
    } else if (isset($_GET["txtBirthday"])) {
    
        $date = strtotime($_GET["txtBirthday"]);
        if ($date < 0) {
            $message = "This is not a valid date.";
        } else {
            $valid = "true";
            $message = "";
        }
    
    } else if (isset($_GET["txtEmail"])) {
    
        if(!eregi(
           "^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$",  
           $_GET["txtEmail"])) {
            $message = "This e-mail address is not valid";
        } else {
            $valid = "true";
            $message = "";
        }    
    }

    echo "$valid||$message"; ?>
