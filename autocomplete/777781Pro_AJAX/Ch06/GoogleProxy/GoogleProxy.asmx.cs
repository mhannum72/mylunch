using System;
using System.Web;
using System.Web.Services;
using GoogleService;

namespace Wrox.Services
{
  [WebService (Description = "Enables calls to the Google API",
               Namespace = "http://www.wrox.com/services/googleProxy")]
  public class GoogleProxyService : System.Web.Services.WebService
  {
    readonly string GoogleKey = "EwVqJPJQFHL4inHoIQMEP9jExTpcf/KG";  

    [WebMethod(
     Description = "Returns Google spelling suggestion for a given phrase.")]
    public string doSpellingSuggestion(string Phrase)
    {
      GoogleSearchService s = new GoogleSearchService();
      s.Url = "http://api.google.com/search/beta2";
      string suggestion = "";
      try
      {
        suggestion = s.doSpellingSuggestion(GoogleKey, Phrase);
      }
      catch(Exception Ex)
      {
        throw Ex;
      }
      if (suggestion == null) suggestion = "No suggestion found.";
      return suggestion;
    }
  }
}
