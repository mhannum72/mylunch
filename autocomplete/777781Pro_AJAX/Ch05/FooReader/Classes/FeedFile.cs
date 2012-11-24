using System;
using System.IO;
using System.Xml;

namespace FooReader
{
	/// <summary>
	/// A class to easily retreive needed information from the feeds file.
	/// </summary>
	public class FeedsFile
	{
		private XmlDocument _doc;

		/// <summary>
		/// Creates a FeedsFile object.
		/// </summary>
		/// <param name="path">Path to the feeds file.</param>
		public FeedsFile(string path)
		{	
			_doc = new XmlDocument();
			_doc.Load(path);
		}

		/// <summary>
		/// Gets the corresponding link element by it's filename attribute.
		/// </summary>
		/// <param name="fileName">The value of the filename attribute.</param>
		/// <returns>FeedsFileLink</returns>
		public FeedsFileLink GetLinkByFileName(string fileName) 
		{
			string pathToNode = String.Format("/feeds/section/link[@filename='{0}']",fileName);
			XmlNode linkNode = _doc.SelectSingleNode(pathToNode);
			return new FeedsFileLink(linkNode);
		}
	}
}
