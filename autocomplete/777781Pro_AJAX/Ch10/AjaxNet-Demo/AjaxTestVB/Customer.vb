Imports System.Collections
Imports System.Data.OleDb
Imports System.Text


Namespace AjaxTestVB




Public Class Customer

    <Ajax.AjaxMethod()> _
    Public Function GetAddressFromEmail(ByVal Email As String) As Hashtable
      Dim address As New Hashtable
      address("success") = False
      'Connection details for Access
      'Dim sConnString As String = "Provider=Microsoft.Jet.OLEDB.4.0; Data Source='" + "C:\Inetpub\wwwroot\AjaxTest\Sales.mdb" + "';"
      'Connection details for SQL Server
      Dim sConnString As String = "Provider=SQLOLEDB; Data Source='localhost'; Initial Catalog='sales'; User Id='Test'; Password='test';"
      Dim conn As New OleDbConnection(sConnString)
      conn.Open()
      Dim SQL As New StringBuilder("SELECT * FROM tblCustomer WHERE Email = '")
      Dim safeEmail As String = Email.Replace("'", "''")
      SQL.Append(safeEmail + "'")
      Dim cmd As New OleDbCommand(SQL.ToString(), conn)
      Dim dr As OleDbDataReader = cmd.ExecuteReader()
      Dim found As Boolean = dr.Read()
      If found Then
        address("success") = True
        address("forenames") = ReplaceIfDbNull(dr(1), "")
        address("surname") = ReplaceIfDbNull(dr(2), "") 'IIf(dr.IsDBNull(2), "", dr.GetString(2))
        address("address1") = ReplaceIfDbNull(dr(4), "") 'IIf(dr.IsDBNull(4), "", dr.GetString(4))
        address("address2") = ReplaceIfDbNull(dr(5), "") 'IIf(dr.IsDBNull(5), "", dr.GetString(5))
        address("address3") = ReplaceIfDbNull(dr(6), "") 'IIf(dr.IsDBNull(6), "", dr.GetString(6))
        address("addressTown") = ReplaceIfDbNull(dr(7), "") 'IIf(dr.IsDBNull(7), "", dr.GetString(7))
        address("addressStateCounty") = ReplaceIfDbNull(dr(8), "") 'IIf(dr.IsDBNull(8), "", dr.GetString(8))
        address("addressZipPC") = ReplaceIfDbNull(dr(9), "") 'IIf(dr.IsDBNull(9), "", dr.GetString(9))
        address("addressCountry") = ReplaceIfDbNull(dr(10), "") 'IIf(dr.IsDBNull(10), "", dr.GetString(10))
      End If
      dr.Close()
      conn.Close()
      Return address
    End Function

    Private Function ReplaceIfDbNull(ByVal Value As Object, ByVal ReplaceWith As Object) As Object
      If Value Is DBNull.Value Then
        Return ReplaceWith
      End If
      Return Value
    End Function

End Class

End Namespace
