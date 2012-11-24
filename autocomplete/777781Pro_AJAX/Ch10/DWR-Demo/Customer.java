package wrox;

import java.util.*;
import java.sql.*;

public class Customer
{
  
  public HashMap getAddressFromEmail(String Email)
  {     
    HashMap address = new HashMap();
    address.put("success", false);
    try 
    {
      Class.forName("sun.jdbc.odbc.JdbcOdbcDriver");
      try
      {
        //Connection to SQL Server
        Connection con = DriverManager.getConnection("jdbc:odbc:SalesSql", "Test", "test");
        //Connection to Access
        //Connection con = DriverManager.getConnection("jdbc:odbc:Sales");
        try
        {
          StringBuffer SQL = new StringBuffer("SELECT * FROM tblCustomer WHERE Email = '");
          String safeEmail = Email.replaceAll("'", "''");
          SQL.append(safeEmail);
          SQL.append("'");
          Statement stmt = con.createStatement();
          ResultSet rs = stmt.executeQuery(SQL.toString());
          boolean found = rs.next();
          if (found)
          {          
            address.put("success", true);
            address.put("forenames", rs.getString(2));
            address.put("surname", rs.getString(3));
            address.put("address1", rs.getString(5));
            address.put("address2", rs.getString(6));
            address.put("address3", rs.getString(7));
            address.put("addressTown", rs.getString(8));
            address.put("addressStateCounty", rs.getString(9));
            address.put("addressZipPC", rs.getString(10));
            address.put("addressCountry", rs.getString(11));
          }
          rs.close();
          con.close();
        }
        catch (Exception e)
        {
          address.put("error", e.toString());
        }
      }
      catch (Exception e)
      {
        address.put("error", "Failed to connect.");
      }
    }
    catch (Exception e)
    {
      address.put("error", "Failed to load JDBC/ODBC driver.");
    }
    return address;
  } 
}