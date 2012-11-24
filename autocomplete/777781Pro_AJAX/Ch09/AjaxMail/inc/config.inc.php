<?php

//MySQL Database Settings
define("DB_USER", "root");
define("DB_PASSWORD", "password");
define("DB_SERVER", "localhost");
define("DB_NAME", "AjaxMail");

//POP3 Settings
define("POP3_USER", "test@domain.com");
define("POP3_PASSWORD", "password");
define("POP3_SERVER", "mail.domain.com");

//SMTP Settings
define("SMTP_DO_AUTHORIZATION", true);
define("SMTP_USER", "test@domain.com");
define("SMTP_PASSWORD", "password");
define("SMTP_SERVER", "mail.domain.com");

//SMTP User Settings
define("EMAIL_FROM_ADDRESS", "test@domain.com");
define("EMAIL_FROM_NAME", "Joe Somebody");

//Mail settings
define("MESSAGES_PER_PAGE", 10);
?>