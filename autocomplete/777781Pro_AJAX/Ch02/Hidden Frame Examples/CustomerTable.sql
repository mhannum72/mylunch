#
# Table structure for table `Customers`
#

CREATE TABLE `Customers` (
  `CustomerId` int(11) NOT NULL auto_increment,
  `Name` varchar(255) NOT NULL default '',
  `Address` varchar(255) NOT NULL default '',
  `City` varchar(255) NOT NULL default '',
  `State` varchar(255) NOT NULL default '',
  `Zip` varchar(255) NOT NULL default '',
  `Phone` varchar(255) NOT NULL default '',
  `E-mail` varchar(255) NOT NULL default '',
  PRIMARY KEY  (`CustomerId`)
) TYPE=MyISAM COMMENT='Sample Customer Data' ;

#
# Dumping data for table `Customers`
#

INSERT INTO `Customers` VALUES (1, 'Michael Smith', '123 Somewhere Road', 'Beverly Hills', 'California', '90210', '(555) 555-1234', 'michael@somewhere.com');
INSERT INTO `Customers` VALUES (2, 'Matthew Johnson', '1234 Somewhere Else Street', 'Elsewhere', 'Confusion', '00000', '(555) 555-2345', 'johnboy@neato.net');
INSERT INTO `Customers` VALUES (3, 'Cindy Benjamin', '1313 Mockingbird Lane', 'Somewhere', 'Montana', '00000', '(555) 555-9876', 'cindybean@mcok.net');
INSERT INTO `Customers` VALUES (4, 'Mary Klein', '10 Highland Avenue', 'Salem', 'Massachusetts', '01970', '(555) 555-4920', 'mary@klein.net');
    