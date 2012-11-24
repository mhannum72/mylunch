using System;
using System.IO;
using System.Xml;

namespace FooReader
{
	/// <summary>
	/// Summary description for FeedFileLink2.
	/// </summary>
	public class FeedsFileLink
	{
		private string _name;
		private string _filename;
		private Uri _uri;
	
		public FeedsFileLink(XmlNode myNode)
		{
			_name = myNode.Attributes["name"].Value;
			_filename = myNode.Attributes["filename"].Value;
			_uri = new Uri(myNode.Attributes["href"].Value);
		}
		/// <summary>
		/// The name of the feed.
		/// </summary>
		public string Name 
		{
			get 
			{
				return _name;
			}
		}
		/// <summary>
		/// The filename of the feed.  It is unique.
		/// </summary>
		public string FileName 
		{
			get 
			{
				return _filename;
			}
		}
		/// <summary>
		/// The URI of the feed.
		/// </summary>
		public Uri Url 
		{
			get 
			{
				return _uri;
			}
		}
	}
}
