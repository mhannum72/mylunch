using System;
using System.Xml;

namespace Wrox.ProfessionalAjax.Weather
{
	/// <summary>
	/// Summary description for Settings
	/// </summary>
	public class Settings
	{
		private string _partnerId;
		private string _licenseKey;
		private string _location;

		public Settings(string path)
		{
			XmlDocument xml = new XmlDocument();
			xml.Load(path + "/config.xml");

			_partnerId = xml.SelectSingleNode("/weather/ids/partner").InnerText;
			_licenseKey = xml.SelectSingleNode("/weather/ids/license").InnerText;
			_location = xml.SelectSingleNode("/weather/ids/location").InnerText;
		}

		public string PartnerId
		{
			get
			{
				return _partnerId;
			}
		}

		public string LicenseKey
		{
			get
			{
				return _licenseKey;
			}
		}

		public string LocationId
		{
			get
			{
				return _location;
			}
		}
	}
}
