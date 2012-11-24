using System;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Text;

namespace AjaxTest
{

	public class Customer
	{
   	[Ajax.AjaxMethod()]
    public Hashtable GetAddressFromEmail(string Email)
    {
      Hashtable address = new Hashtable();
      address["success"] = false;
      //string sConnString = "Provider=Microsoft.Jet.OLEDB.4.0; Data Source='" + @"C:\Inetpub\wwwroot\AjaxTest\Sales.mdb" + "';";
      string sConnString = "Provider=SQLOLEDB; Data Source='localhost'; Initial Catalog='sales'; User Id='Test'; Password='test';";
      OleDbConnection conn = new OleDbConnection(sConnString);      
      conn.Open();
      StringBuilder SQL = new StringBuilder("SELECT * FROM tblCustomer WHERE Email = '");
      string safeEmail = Email.Replace("'", "''");
      SQL.Append(safeEmail + "'");
      OleDbCommand cmd = new OleDbCommand(SQL.ToString(), conn);
      OleDbDataReader dr = cmd.ExecuteReader();
      Boolean found = dr.Read();
      if (found)
      {
        address["success"] = true;
        address["forenames"] = (dr.IsDBNull(1) ? "" : dr.GetString(1));
        address["surname"] =(dr.IsDBNull(2) ? "" : dr.GetString(2));
        address["address1"] =(dr.IsDBNull(4) ? "" : dr.GetString(4));
        address["address2"] =(dr.IsDBNull(5) ? "" : dr.GetString(5));
        address["address3"] =(dr.IsDBNull(6) ? "" : dr.GetString(6));
        address["addressTown"] =(dr.IsDBNull(7) ? "" : dr.GetString(7));
        address["addressStateCounty"] =(dr.IsDBNull(8) ? "" : dr.GetString(8));
        address["addressZipPC"] =(dr.IsDBNull(9) ? "" : dr.GetString(9));
        address["addressCountry"] =(dr.IsDBNull(10) ? "" : dr.GetString(10));
      }
      dr.Close();
      conn.Close();
      return address;
    }
	}
}
