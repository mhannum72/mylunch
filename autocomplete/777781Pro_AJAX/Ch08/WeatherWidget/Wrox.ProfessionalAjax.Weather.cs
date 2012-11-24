using System;
using System.IO;
using System.Net;
using System.Xml;
using System.Xml.Xsl;

namespace Wrox.ProfessionalAjax.Weather
{
	/// <summary>
	/// A simple class to pull a weather feed from Weather.com's XOAP service.
	/// </summary>
	public class WeatherInfo
	{
		private string _path;
		private string _cachedFile;

		private Settings _settings;
		
		/// <summary>
		/// The Weather class constructor.
		/// </summary>
		/// <param name="path">The path to the application (Server.MapPath(""))</param>
		public WeatherInfo(string path)
		{
			_path = path;
			_cachedFile = String.Format(@"{0}\weather_cache.xml",_path);
			_settings = new Settings(path);
		}

		/// <summary>
		/// Gets the weather feed either from a cached file or straight from the Web.
		/// </summary>
		/// <returns>A string containing the XML feed from the Weather.com service.</returns>
		public string GetWeather()
		{
			DateTime timeLimit = LastModified.AddMinutes(30);
			
			//Check the time. If it's been thirty minutes since the cached
			//file's been written, then pull a new feed.
			if (DateTime.Now.CompareTo(timeLimit) > -1)
			{
				//Time to pull a new feed.
				return _getWebWeather();
			} 
			else 
			{
				return _getCachedWeather();
			}
		}
		
		/// <summary>
		/// Gets the cached feed.
		/// </summary>
		/// <returns>A string containing the XML feed from the Weather.com service.</returns>
		private string _getCachedWeather()
		{
			string str = String.Empty;
			
			//Open and read the cached weather feed.
			using (StreamReader reader = new StreamReader(_cachedFile))
			{
				str = reader.ReadToEnd();
			}
			
			//Return the contents
			return str;
		}

		/// <summary>
		/// Gets the feed from the Weather.com XOAP service.
		/// </summary>
		/// <returns>A string containing the XML feed from the Weather.com service.</returns>
		private string _getWebWeather()
		{
			//Just to keep things clean, an unformatted URL:
			string baseUrl = "http://xoap.weather.com/weather/local/{0}?cc=*&prod=xoap&par={1}&key={2}";
			
			//Now format the url with the needed information
			string url = String.Format(baseUrl, _settings.LocationId, _settings.PartnerId, _settings.LicenseKey);
			
			//String that the weather feed will be written to
			string xmlStr = String.Empty;
			
			//Use a web client. It's less coding than an HttpWebRequest.
			using (WebClient client = new WebClient())
			{
				//Read the results
				try 
				{
					using (StreamReader reader = new StreamReader(client.OpenRead(url)))
					{
						xmlStr = reader.ReadToEnd();
					}
				} 
				catch (WebException exception) 
				{
					xmlStr = _writeErrorDoc(exception);
				}
			}
			
			XslTransform xslt = new XslTransform();
			XmlDocument xml = new XmlDocument();
				
			using (StringWriter stringWriter = new StringWriter()) 
			{
				xml.LoadXml(xmlStr);
				xslt.Load(_path + "/weather.xslt");
                xslt.Transform(xml, null, stringWriter, null);
                xmlStr = stringWriter.ToString();
			}
				
			//Write the cached file
			using (StreamWriter writer = new StreamWriter(_cachedFile))
			{
				writer.Write(xmlStr);
			}
			
			//Finally, return the feed data.
			return xmlStr;
		}

		private string _writeErrorDoc(WebException exception) 
		{
			XmlDocument xml = new XmlDocument();

			xml.LoadXml("<errorDoc />");

			XmlElement alertElement = xml.CreateElement("alert");
            alertElement.InnerText = "An Error Occurred!";

			XmlElement messageElement = xml.CreateElement("message");
            messageElement.InnerText = exception.Message;

            xml.DocumentElement.AppendChild(alertElement);
            xml.DocumentElement.AppendChild(messageElement);

			return xml.OuterXml;
		}

		public Settings Settings
		{
			get
			{
				return _settings;
			}
		}

		public string CachedFile
		{
			get
			{
				return _cachedFile;
			}
		}

		public DateTime LastModified 
		{
			get 
			{
				if ((File.Exists(_cachedFile))) 
				{ 
					//If so, grab it's time.
					return File.GetLastWriteTime(_cachedFile);
				} 
				else 
				{
					//If not, then set to an early time.
					return new DateTime(1,1,1);
				}
			}
		}
	}
}
