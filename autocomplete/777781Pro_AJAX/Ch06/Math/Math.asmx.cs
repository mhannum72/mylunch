using System;
using System.Web;
using System.Web.Services;

namespace Wrox.Services
{
  [WebService (Description = "Contains a number of simple arithmetical functions", Namespace = "http://www.wrox.com/services/math")]
	public class Math : System.Web.Services.WebService
	{
		
		[WebMethod(Description = "Returns the sum of two floats as a float")]
		public float add(float op1, float op2)
		{
			return op1 + op2;
		}

    [WebMethod(Description = "Returns the difference of two floats as a float")]
    public float subtract(float op1, float op2)
    {
      return op1 - op2;
    }

    [WebMethod(Description = "Returns the product of two floats as a float")]
    public float multiply(float op1, float op2)
    {
      return op1 * op2;
    }

    [WebMethod(Description = "Returns the quotient of two floats as a float")]
    public float divide(float op1, float op2)
    {
      return op1 / op2;
    }
	}
}
