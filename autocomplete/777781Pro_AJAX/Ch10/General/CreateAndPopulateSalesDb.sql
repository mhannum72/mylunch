CREATE DATABASE [Sales]  ON (NAME = N'Sales', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL\data\Sales.mdf' , SIZE = 1, FILEGROWTH = 10%) LOG ON (NAME = N'Sales_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL\data\Sales_log.LDF' , FILEGROWTH = 10%)
 COLLATE Latin1_General_CI_AS
GO

exec sp_dboption N'Sales', N'autoclose', N'false'
GO

exec sp_dboption N'Sales', N'bulkcopy', N'false'
GO

exec sp_dboption N'Sales', N'trunc. log', N'false'
GO

exec sp_dboption N'Sales', N'torn page detection', N'true'
GO

exec sp_dboption N'Sales', N'read only', N'false'
GO

exec sp_dboption N'Sales', N'dbo use', N'false'
GO

exec sp_dboption N'Sales', N'single', N'false'
GO

exec sp_dboption N'Sales', N'autoshrink', N'false'
GO

exec sp_dboption N'Sales', N'ANSI null default', N'false'
GO

exec sp_dboption N'Sales', N'recursive triggers', N'false'
GO

exec sp_dboption N'Sales', N'ANSI nulls', N'false'
GO

exec sp_dboption N'Sales', N'concat null yields null', N'false'
GO

exec sp_dboption N'Sales', N'cursor close on commit', N'false'
GO

exec sp_dboption N'Sales', N'default to local cursor', N'false'
GO

exec sp_dboption N'Sales', N'quoted identifier', N'false'
GO

exec sp_dboption N'Sales', N'ANSI warnings', N'false'
GO

exec sp_dboption N'Sales', N'auto create statistics', N'true'
GO

exec sp_dboption N'Sales', N'auto update statistics', N'true'
GO

if( ( (@@microsoftversion / power(2, 24) = 8) and (@@microsoftversion & 0xffff >= 724) ) or ( (@@microsoftversion / power(2, 24) = 7) and (@@microsoftversion & 0xffff >= 1082) ) )
	exec sp_dboption N'Sales', N'db chaining', N'false'
GO

use [Sales]
GO

if not exists (select * from master.dbo.syslogins where loginname = N'Test')
BEGIN
	declare @logindb nvarchar(132), @loginlang nvarchar(132) select @logindb = N'Sales', @loginlang = N'us_english'
	if @logindb is null or not exists (select * from master.dbo.sysdatabases where name = @logindb)
		select @logindb = N'master'
	if @loginlang is null or (not exists (select * from master.dbo.syslanguages where name = @loginlang) and @loginlang <> N'us_english')
		select @loginlang = @@language
	exec sp_addlogin N'Test', null, @logindb, @loginlang
END
GO

if not exists (select * from dbo.sysusers where name = N'Test' and uid < 16382)
	EXEC sp_grantdbaccess N'Test', N'Test'
GO

exec sp_addrolemember N'db_datareader', N'Test'
GO

CREATE TABLE [dbo].[tblCustomer] (
	[CustomerId] [int] IDENTITY (1, 1) NOT NULL ,
	[Forenames] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL ,
	[Surname] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL ,
	[Email] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL ,
	[Address1] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL ,
	[Address2] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL ,
	[Address3] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL ,
	[AddressTown] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL ,
	[AddressStateCounty] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL ,
	[AddressZipPC] [nvarchar] (10) COLLATE Latin1_General_CI_AS NULL ,
	[AddressCountry] [nvarchar] (100) COLLATE Latin1_General_CI_AS NULL 
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[tblCustomer] WITH NOCHECK ADD 
	CONSTRAINT [PK_tblCustomer] PRIMARY KEY  CLUSTERED 
	(
		[CustomerId]
	)  ON [PRIMARY] 
GO





INSERT dbo.tblCustomer
(Forenames, Surname, Email, Address1, Address2, AddressTown, AddressZipPC, AddressCountry)
VALUES
(N'Joe', N'Fawcett', N'joefawcett@hotmail.com', N'Apsley House', N'149 Piccadilly', N'London', N'W1', N'UK')

INSERT dbo.tblCustomer
(Forenames, Surname, Email, Address1, Address2, AddressTown, AddressZipPC, AddressCountry)
VALUES
(N'Elizabeth', N'Windsor', N'hmqueen412@yahoo.com', N'Buckingham Palace', N'Buckingham Palace Road', N'London', N'SW1A 1AA', N'UK')

INSERT dbo.tblCustomer
(Forenames, Surname, Email, Address1, Address2, AddressTown, AddressZipPC, AddressCountry)
VALUES
(N'George', N'Bush', N'buckStops@here.com', N'The White House', N'1600 Pennsylvania Avenue NW', N'Washington DC', N'20500', N'USA')
