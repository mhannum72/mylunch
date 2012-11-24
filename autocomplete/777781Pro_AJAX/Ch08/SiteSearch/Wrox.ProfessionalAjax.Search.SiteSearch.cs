using System;
using System.Collections;
using System.Configuration;
using System.Data.SqlClient;
using Nii.JSON;

namespace Wrox.ProfessionalAjax.Search
{
	/// <summary>
	/// Summary description for Class1.
	/// </summary>
	public class SiteSearch
	{
		private string _conString;
		
		public SiteSearch(string connectionString)
		{
            _conString = connectionString;
		}

		public string Search (string searchString) 
		{
			//Our Search Query
			string query = String.Format("SELECT TOP 10 id, title FROM BlogPosts WHERE posting LIKE '%{0}%' OR title LIKE '%{0}%' ORDER BY date DESC", searchString);

            Nii.JSON.JSONArray jsa = new JSONArray();

			using (SqlConnection conn = new SqlConnection(_conString)) 
			{
                SqlCommand command = new SqlCommand(query, conn);
                conn.Open();
			
				using (SqlDataReader reader = command.ExecuteReader()) 
				{
					try 
					{
						if (reader.HasRows) 
						{
                            int i = 0;
							while (reader.Read()) 
							{	
								Nii.JSON.JSONObject jso = new JSONObject();
								jso.put("title",reader["title"]);
								jso.put("id",reader["id"]);
							
								jsa.put(i++,jso);
							}
						}
					}
					catch {}
				} 
			}
			return jsa.ToString();
		}
	}
}
