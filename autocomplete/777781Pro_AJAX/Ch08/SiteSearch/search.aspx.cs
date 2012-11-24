using System;
using System.Collections;
using System.Configuration;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Web;
using System.Web.SessionState;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using Wrox.ProfessionalAjax.Search;

namespace AjaxSiteSearch
{
	/// <summary>
	/// Summary description for search.
	/// </summary>
	public class search : System.Web.UI.Page
	{
		private void Page_Load(object sender, System.EventArgs e)
		{
			Response.CacheControl = "no-cache";
			Response.ContentType = "text/plain; charset=UTF-8";

			if (Request.QueryString["search"] != null) 
			{
				string searchTerm = Request.QueryString["search"];
                string conStr = ConfigurationSettings.AppSettings["connectionStr"];
			
				SiteSearch siteSearch = new SiteSearch(conStr);

				string json = siteSearch.Search(searchTerm);
				Response.Write(json);
			}
		}

		#region Web Form Designer generated code
		override protected void OnInit(EventArgs e)
		{
			//
			// CODEGEN: This call is required by the ASP.NET Web Form Designer.
			//
			InitializeComponent();
			base.OnInit(e);
		}
		
		/// <summary>
		/// Required method for Designer support - do not modify
		/// the contents of this method with the code editor.
		/// </summary>
		private void InitializeComponent()
		{    
			this.Load += new System.EventHandler(this.Page_Load);
		}
		#endregion
	}
}
