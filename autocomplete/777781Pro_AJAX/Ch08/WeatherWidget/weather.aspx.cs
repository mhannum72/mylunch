using System;
using System.Collections;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Web;
using System.Web.SessionState;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using Wrox.ProfessionalAjax.Weather;

namespace WeatherWidget
{
	/// <summary>
	/// Summary description for weather.
	/// </summary>
	public class weather : System.Web.UI.Page
	{
		private void Page_Load(object sender, System.EventArgs e)
		{
			WeatherInfo weather = new WeatherInfo(Server.MapPath(String.Empty));
			string weatherData = weather.GetWeather();
			
			Response.ContentType = "text/xml";
			Response.AddHeader("Weather-Modified", weather.LastModified.ToFileTime().ToString());
			Response.CacheControl = "no-cache";
					
			Response.Write(weatherData);
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
