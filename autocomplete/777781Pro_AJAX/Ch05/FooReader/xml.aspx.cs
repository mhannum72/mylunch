using System;
using System.Collections;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Net;
using System.Web;
using System.Web.SessionState;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Xml;


namespace FooReader
{
	/// <summary>
	/// Summary description for xml.
	/// </summary>
	public class xml : System.Web.UI.Page
	{
		private void Page_Load(object sender, System.EventArgs e)
		{
			StartFooReader();
		}

		private void StartFooReader() 
		{
			Response.ContentType = "text/xml";
			Response.CacheControl = "No-cache";

			if (Request.QueryString["xml"] != null) 
			{
				string xml = Request.QueryString["xml"];
				FeedsFile feedsFile = new FeedsFile(Server.MapPath("feeds.xml"));
				FeedsFileLink link = feedsFile.GetLinkByFileName(xml);
		
				string fileName = String.Format(@"{0}\xml\{1}.xml",Server.MapPath(string.Empty),link.FileName);
				
				try 
				{
					//Start our request for the feed.
					HttpWebRequest getFeed = (HttpWebRequest) WebRequest.Create(link.Url);
					getFeed.UserAgent = "FooReader.NET 1.5 (http://reader.wdonline.com)";
					
					// The xml from the feed.
					string feedXml = string.Empty;

					// Get the response.
					using (HttpWebResponse responseFeed = (HttpWebResponse) getFeed.GetResponse())
					{
						// Create a stream reader.
						using (StreamReader reader = new StreamReader(responseFeed.GetResponseStream()))
						{
							// Read the contents.
							feedXml = reader.ReadToEnd();
						}
					}
					
					using (StreamWriter strmWriter = new StreamWriter(fileName))
					{
						// Write the line.
						strmWriter.Write(feedXml);
					}
					
					//Write the XML to the page.
					Response.Write(feedXml);	
				}
				catch //Can't get the feed from the Internet.  Let's try a cached copy, first.
				{
					string fileToUse = File.Exists(fileName)?fileName:Server.MapPath("error.xml");
					Response.Write(GetLocalFile(fileToUse));
				}
			} 
			else 
			{
				Response.Write(GetLocalFile(Server.MapPath("error.xml")));
			}
		}

		public string GetLocalFile(string path) 
		{
			string contents = string.Empty;
			using (StreamReader file = File.OpenText(path)) 
			{
				contents = file.ReadToEnd();
			}
			return contents;
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
